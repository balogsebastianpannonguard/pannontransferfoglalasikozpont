import { Suspense } from "react";
import TamaSetupPasswordClient from "./TamaSetupPasswordClient";

export const metadata = {
  title: "Tama Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad a Tama partnerportálhoz.",
};

export default function TamaSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <TamaSetupPasswordClient />
    </Suspense>
  );
}
