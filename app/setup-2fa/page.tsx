import SetupTwoFactorClient from "./SetupTwoFactorClient";

export const metadata = {
  title: "2FA Beállítása | Pannon Transfer CRM",
  description: "Kétfaktoros hitelesítés beállítása QR kóddal és TOTP hitelesítő alkalmazással.",
};

export default function SetupTwoFactorPage() {
  return <SetupTwoFactorClient />;
}
