import { Suspense } from "react";
import EnterAirSetupPasswordClient from "./EnterAirSetupPasswordClient";

export const metadata = {
  title: "Enter Air Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad az Enter Air partnerportálhoz.",
};

export default function EnterAirSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EnterAirSetupPasswordClient />
    </Suspense>
  );
}
