import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  createPartnerPricing,
  deletePartnerPricing,
  getDefaultPartnerPricingRecords,
  getAllPartnerPricingWithDefaults,
  getPartnerPricingByKey,
  updatePartnerPricing,
  type PartnerPricing,
} from "@/lib/partner-pricing";
import {
  buildTravelTermsShareUrl,
  getTravelTermsDocument,
  hasTravelTermsRole,
  resolveTravelTermsAccessForSession,
  resolveTravelTermsLinkAccess,
  type TravelTermsRole,
} from "@/lib/travel-terms";
import { TRAVEL_TERMS_ACCESS_QUERY_PARAM } from "@/lib/travel-terms-config";
import {
  PARTNER_PORTAL_CONFIGS,
  PARTNER_PORTAL_ORDER,
} from "@/lib/partner-pricing-config";
import { publishTravelTermsEvent } from "@/lib/travel-terms-realtime";

export const dynamic = "force-dynamic";

function getTravelTermsAccessToken(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get(TRAVEL_TERMS_ACCESS_QUERY_PARAM) ||
    request.headers.get("x-travel-terms-access")
  );
}

async function requirePartnerPortalUser(
  request: NextRequest,
  requiredRoles: TravelTermsRole[] = ["viewer"]
) {
  const session = await getCurrentSession();
  const linkAccess = await resolveTravelTermsLinkAccess(getTravelTermsAccessToken(request));
  const sessionAccess = session ? await resolveTravelTermsAccessForSession(session) : null;
  const accessUser = linkAccess || sessionAccess;

  if (!session && !linkAccess) {
    return {
      error: NextResponse.json(
        { success: false, message: "Nincs aktiv munkamenet vagy megosztott link." },
        { status: 401 }
      ),
    };
  }

  if (!accessUser || !accessUser.isActive) {
    return {
      error: NextResponse.json(
        { success: false, message: "Nincs jogosultsagod ehhez az oldalhoz." },
        { status: 403 }
      ),
    };
  }

  if (!hasTravelTermsRole(accessUser.role, requiredRoles)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Ehhez a muvelethez magasabb jogosultsag szukseges." },
        { status: 403 }
      ),
    };
  }

  return {
    accessUser,
    actorEmail: linkAccess
      ? "megosztott-link@pannontransfer.local"
      : session?.email || "megosztott-link@pannontransfer.local",
  };
}

async function buildResponsePayload(origin: string, accessToken?: string | null) {
  let partners: PartnerPricing[];
  try {
    partners = await getAllPartnerPricingWithDefaults();
  } catch {
    partners = getDefaultPartnerPricingRecords();
  }

  let shareUrl = accessToken
    ? buildTravelTermsShareUrl(origin, accessToken)
    : `${origin}/holdhid-feltetelek-x7q`;
  try {
    const travelTermsDocument = await getTravelTermsDocument();
    shareUrl = buildTravelTermsShareUrl(origin, travelTermsDocument.editorAccessToken);
  } catch {
    // Ha az adatbazis atmenetileg nem elerheto, marad a jelenlegi tokenes link.
  }

  return {
    partners: PARTNER_PORTAL_ORDER.map((key) => {
      const partner =
        partners.find((item) => item.partnerKey === key) ||
        partners.find((item) => item.partnerKey === key.toLowerCase());
      return partner;
    }).filter(Boolean) as PartnerPricing[],
    partnerConfigs: PARTNER_PORTAL_CONFIGS,
    shareUrl,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requirePartnerPortalUser(request, ["viewer"]);
  if ("error" in auth) return auth.error;

  const partnerKey = request.nextUrl.searchParams.get("partnerKey");
  const origin = request.nextUrl.origin;
  const accessToken = getTravelTermsAccessToken(request);

  if (partnerKey) {
    const partner = await getPartnerPricingByKey(partnerKey, { seedIfMissing: true });
    return NextResponse.json({
      success: true,
      partner,
      partnerConfig: PARTNER_PORTAL_CONFIGS[partnerKey] || null,
      ...(await buildResponsePayload(origin, accessToken)),
      sessionUser: {
        email: auth.actorEmail,
        portalRole: auth.accessUser.role,
        displayName: auth.accessUser.displayName,
      },
    });
  }

  return NextResponse.json({
    success: true,
    ...(await buildResponsePayload(origin, accessToken)),
    sessionUser: {
      email: auth.actorEmail,
      portalRole: auth.accessUser.role,
      displayName: auth.accessUser.displayName,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePartnerPortalUser(request, ["editor"]);
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as Partial<PartnerPricing>;
    if (!body.partnerKey || !body.partnerName) {
      return NextResponse.json(
        { success: false, message: "Hiányzik a partnerKey vagy a partner neve." },
        { status: 400 }
      );
    }

    const created = await createPartnerPricing({
      partnerKey: body.partnerKey,
      partnerName: body.partnerName,
      isActive: body.isActive ?? true,
      vehicles: body.vehicles || [],
      terms:
        body.terms || {
          modification: {
            "12-24h": { percentage: 0, description: "" },
            "0-12h": { percentage: 0, description: "" },
          },
          cancellation: {
            "12-24h": { percentage: 0, description: "" },
            "0-12h": { percentage: 0, description: "" },
          },
        },
      meta: body.meta || {},
    });

    const origin = request.nextUrl.origin;
    const payload = await buildResponsePayload(origin, getTravelTermsAccessToken(request));

    publishTravelTermsEvent({
      type: "partner_pricing_updated",
      payload: {
        partner: created,
        partners: payload.partners,
        shareUrl: payload.shareUrl,
      },
    });

    return NextResponse.json({ success: true, partner: created, ...payload }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerult letrehozni a partnert." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePartnerPortalUser(request, ["editor"]);
  if ("error" in auth) return auth.error;

  try {
    const partnerKey = request.nextUrl.searchParams.get("partnerKey");
    if (!partnerKey) {
      return NextResponse.json(
        { success: false, message: "Hianyzik a partnerKey query parameter." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Partial<
      Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt" | "partnerKey">
    >;
    const updated = await updatePartnerPricing(partnerKey, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Nincs ilyen partner rekord." },
        { status: 404 }
      );
    }

    const origin = request.nextUrl.origin;
    const payload = await buildResponsePayload(origin, getTravelTermsAccessToken(request));

    publishTravelTermsEvent({
      type: "partner_pricing_updated",
      payload: {
        partner: updated,
        partners: payload.partners,
        shareUrl: payload.shareUrl,
      },
    });

    return NextResponse.json({
      success: true,
      partner: updated,
      ...payload,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerult menteni." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePartnerPortalUser(request, ["editor"]);
  if ("error" in auth) return auth.error;

  try {
    const partnerKey = request.nextUrl.searchParams.get("partnerKey");
    if (!partnerKey) {
      return NextResponse.json(
        { success: false, message: "Hianyzik a partnerKey query parameter." },
        { status: 400 }
      );
    }

    const deleted = await deletePartnerPricing(partnerKey);
    const origin = request.nextUrl.origin;
    const payload = await buildResponsePayload(origin, getTravelTermsAccessToken(request));

    publishTravelTermsEvent({
      type: "partner_pricing_deleted",
      payload: {
        partnerKey,
        partners: payload.partners,
        shareUrl: payload.shareUrl,
      },
    });

    return NextResponse.json({ success: true, deleted, ...payload });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerult torolni." },
      { status: 500 }
    );
  }
}
