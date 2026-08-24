import LandingClient from "./LandingClient";

export const metadata = {
  title: "Pannon Transfer | Központi Belépés",
  description: "Válassza ki a belépni kívánt rendszert - CRM vagy Email Invite Center.",
};

export default function Root() {
  return <LandingClient />;
}
