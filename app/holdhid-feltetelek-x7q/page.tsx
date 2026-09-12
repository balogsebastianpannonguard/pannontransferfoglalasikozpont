import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TravelTermsPortalClient from "./TravelTermsPortalClient";
import { getCurrentSession } from "@/lib/auth";
import {
  findTravelTermsAccessUserByEmail,
  getTravelTermsDocument,
  listTravelTermsAccessUsers,
} from "@/lib/travel-terms";
import { TRAVEL_TERMS_PORTAL_PATH } from "@/lib/travel-terms-config";

function resolveOrigin(headerList: Headers) {
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost || headerList.get("host") || "localhost:3000";
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function TravelTermsPortalPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(TRAVEL_TERMS_PORTAL_PATH)}`);
  }

  const accessUser = await findTravelTermsAccessUserByEmail(session.email);
  if (!accessUser || !accessUser.isActive) {
    redirect("/admin");
  }

  const [document, accessUsers, headerList] = await Promise.all([
    getTravelTermsDocument(),
    listTravelTermsAccessUsers(),
    headers(),
  ]);

  const shareUrl = `${resolveOrigin(headerList)}${TRAVEL_TERMS_PORTAL_PATH}`;

  return (
    <TravelTermsPortalClient
      initialDocument={document}
      initialAccessUsers={accessUsers}
      sessionUser={{
        email: session.email,
        portalRole: accessUser.role,
        displayName: accessUser.displayName,
      }}
      shareUrl={shareUrl}
    />
  );
}
