import { Suspense } from "react";
import KronesSetupPasswordClient from "./KronesSetupPasswordClient";

export const metadata = {
  title: "Krones Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad a Krones partnerportálhoz.",
};

export default function KronesSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <KronesSetupPasswordClient />
    </Suspense>
  );
}
