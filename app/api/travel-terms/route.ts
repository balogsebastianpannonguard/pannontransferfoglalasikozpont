import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  findTravelTermsAccessUserByEmail,
  getTravelTermsDocument,
  hasTravelTermsRole,
  listTravelTermsAccessUsers,
  saveTravelTermsDocument,
  type TravelTermsRole,
} from "@/lib/travel-terms";
import { TRAVEL_TERMS_PORTAL_PATH } from "@/lib/travel-terms-config";
import { publishTravelTermsEvent } from "@/lib/travel-terms-realtime";

export const dynamic = "force-dynamic";

async function requireTravelTermsUser(requiredRoles: TravelTermsRole[] = ["viewer"]) {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ success: false, message: "Nincs aktív munkamenet." }, { status: 401 }) };
  }

  const accessUser = await findTravelTermsAccessUserByEmail(session.email);
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

  return { session, accessUser };
}

export async function GET(request: NextRequest) {
  const auth = await requireTravelTermsUser(["viewer"]);
  if ("error" in auth) return auth.error;

  const document = await getTravelTermsDocument();
  const accessUsers = await listTravelTermsAccessUsers();
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    success: true,
    document,
    accessUsers,
    sessionUser: {
      email: auth.session.email,
      portalRole: auth.accessUser.role,
      displayName: auth.accessUser.displayName,
    },
    shareUrl: `${origin}${TRAVEL_TERMS_PORTAL_PATH}`,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireTravelTermsUser(["editor"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const nextDocument = await saveTravelTermsDocument(body?.document || body, auth.session.email);
    const accessUsers = await listTravelTermsAccessUsers();
    const origin = new URL(request.url).origin;

    publishTravelTermsEvent({
      type: "terms_updated",
      payload: {
        document: nextDocument,
        accessUsers,
        sessionUser: {
          email: auth.session.email,
          portalRole: auth.accessUser.role,
          displayName: auth.accessUser.displayName,
        },
        shareUrl: `${origin}${TRAVEL_TERMS_PORTAL_PATH}`,
      },
    });

    return NextResponse.json({
      success: true,
      document: nextDocument,
      accessUsers,
      shareUrl: `${origin}${TRAVEL_TERMS_PORTAL_PATH}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerült menteni." },
      { status: 500 }
    );
  }
}
