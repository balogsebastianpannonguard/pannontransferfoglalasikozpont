import TravelTermsPortalClient from "./TravelTermsPortalClient";
import { TRAVEL_TERMS_ACCESS_QUERY_PARAM } from "@/lib/travel-terms-config";

export default async function TravelTermsPortalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const accessTokenParam = resolvedSearchParams[TRAVEL_TERMS_ACCESS_QUERY_PARAM];
  const accessToken = Array.isArray(accessTokenParam) ? accessTokenParam[0] : accessTokenParam;

  return <TravelTermsPortalClient accessToken={accessToken || null} />;
}
