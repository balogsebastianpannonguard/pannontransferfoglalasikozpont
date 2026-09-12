import { type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getTravelTermsDocument,
  listTravelTermsAccessUsers,
  resolveTravelTermsAccessForSession,
} from "@/lib/travel-terms";
import { TRAVEL_TERMS_PORTAL_PATH } from "@/lib/travel-terms-config";
import {
  publishTravelTermsEvent,
  subscribeToTravelTerms,
} from "@/lib/travel-terms-realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const accessUser = await resolveTravelTermsAccessForSession(session);
  if (!accessUser || !accessUser.isActive) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const origin = new URL(request.url).origin;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(formatSseEvent(event, payload)));
      };

      const bootstrapDocument = await getTravelTermsDocument();
      const accessUsers = await listTravelTermsAccessUsers();
      send("snapshot", {
        document: bootstrapDocument,
        accessUsers,
        shareUrl: `${origin}${TRAVEL_TERMS_PORTAL_PATH}`,
      });

      const unsubscribe = subscribeToTravelTerms((event) => {
        send(event.type, event.payload);
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
