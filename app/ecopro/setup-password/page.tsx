import { Suspense } from "react";
import EcoproSetupPasswordClient from "./EcoproSetupPasswordClient";

export const metadata = {
  title: "EcoPro Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad az EcoPro partnerportálhoz.",
};

export default function EcoproSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EcoproSetupPasswordClient />
    </Suspense>
  );
}
