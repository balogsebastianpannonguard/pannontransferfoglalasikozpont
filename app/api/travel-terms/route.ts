import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  buildTravelTermsShareUrl,
  getTravelTermsDocument,
  hasTravelTermsRole,
  listTravelTermsAccessUsers,
  resolveTravelTermsLinkAccess,
  resolveTravelTermsAccessForSession,
  saveTravelTermsDocument,
  type TravelTermsRole,
} from "@/lib/travel-terms";
import { TRAVEL_TERMS_ACCESS_QUERY_PARAM } from "@/lib/travel-terms-config";
import { publishTravelTermsEvent } from "@/lib/travel-terms-realtime";

export const dynamic = "force-dynamic";

function getTravelTermsAccessToken(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get(TRAVEL_TERMS_ACCESS_QUERY_PARAM) ||
    request.headers.get("x-travel-terms-access")
  );
}

async function requireTravelTermsUser(
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
        { success: false, message: "Nincs jogosultságod az utazási feltételek oldalhoz." },
        { status: 403 }
      ),
    };
  }

  if (!hasTravelTermsRole(accessUser.role, requiredRoles)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Ehhez a művelethez magasabb jogosultság szükséges." },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    accessUser,
    actorEmail: linkAccess ? "megosztott-link@pannontransfer.local" : session?.email || "megosztott-link@pannontransfer.local",
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireTravelTermsUser(request, ["viewer"]);
  if ("error" in auth) return auth.error;

  const document = await getTravelTermsDocument();
  const accessUsers = await listTravelTermsAccessUsers();
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    success: true,
    document,
    accessUsers,
    sessionUser: {
      email: auth.actorEmail,
      portalRole: auth.accessUser.role,
      displayName: auth.accessUser.displayName,
    },
    shareUrl: buildTravelTermsShareUrl(origin, document.editorAccessToken),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireTravelTermsUser(request, ["editor"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const nextDocument = await saveTravelTermsDocument(body?.document || body, auth.actorEmail);
    const accessUsers = await listTravelTermsAccessUsers();
    const origin = new URL(request.url).origin;

    publishTravelTermsEvent({
      type: "terms_updated",
      payload: {
        document: nextDocument,
        accessUsers,
        sessionUser: {
          email: auth.actorEmail,
          portalRole: auth.accessUser.role,
          displayName: auth.accessUser.displayName,
        },
        shareUrl: buildTravelTermsShareUrl(origin, nextDocument.editorAccessToken),
      },
    });

    return NextResponse.json({
      success: true,
      document: nextDocument,
      accessUsers,
      shareUrl: buildTravelTermsShareUrl(origin, nextDocument.editorAccessToken),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerült menteni." },
      { status: 500 }
    );
  }
}
