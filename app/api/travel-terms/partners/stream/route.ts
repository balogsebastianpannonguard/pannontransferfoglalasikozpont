import { type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getTravelTermsDocument,
  resolveTravelTermsAccessForSession,
  resolveTravelTermsLinkAccess,
} from "@/lib/travel-terms";
import {
  getAllPartnerPricingWithDefaults,
  getDefaultPartnerPricingRecords,
} from "@/lib/partner-pricing";
import { TRAVEL_TERMS_ACCESS_QUERY_PARAM } from "@/lib/travel-terms-config";
import { buildTravelTermsShareUrl } from "@/lib/travel-terms";
import {
  PARTNER_PORTAL_CONFIGS,
  PARTNER_PORTAL_ORDER,
} from "@/lib/partner-pricing-config";
import {
  publishTravelTermsEvent,
  subscribeToTravelTerms,
} from "@/lib/travel-terms-realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function getTravelTermsAccessToken(request: NextRequest) {
  return request.nextUrl.searchParams.get(TRAVEL_TERMS_ACCESS_QUERY_PARAM);
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  const linkAccess = await resolveTravelTermsLinkAccess(getTravelTermsAccessToken(request));
  const sessionAccess = session ? await resolveTravelTermsAccessForSession(session) : null;
  const accessUser = linkAccess || sessionAccess;

  if (!session && !linkAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!accessUser || !accessUser.isActive) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const origin = request.nextUrl.origin;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(formatSseEvent(event, payload)));
      };

      const [partners, travelTermsDocument] = await Promise.all([
        (async () => {
          try {
            return await getAllPartnerPricingWithDefaults();
          } catch {
            return getDefaultPartnerPricingRecords();
          }
        })(),
        (async () => {
          try {
            return await getTravelTermsDocument();
          } catch {
            return null;
          }
        })(),
      ]);

      send("partners_snapshot", {
        partners: PARTNER_PORTAL_ORDER.map((key) =>
          partners.find((item) => item.partnerKey === key)
        ).filter(Boolean),
        partnerConfigs: PARTNER_PORTAL_CONFIGS,
        shareUrl: buildTravelTermsShareUrl(
          origin,
          travelTermsDocument?.editorAccessToken || getTravelTermsAccessToken(request) || ""
        ),
      });

      const unsubscribe = subscribeToTravelTerms((event) => {
        if (
          event.type === "partner_pricing_updated" ||
          event.type === "partner_pricing_deleted" ||
          event.type === "partners_snapshot" ||
          event.type === "heartbeat"
        ) {
          send(event.type, event.payload);
        }
      });

      const heartbeat = setInterval(() => {
        send("heartbeat", { timestamp: Date.now() });
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      publishTravelTermsEvent({
        type: "heartbeat",
        payload: { timestamp: Date.now() },
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
