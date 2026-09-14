import { Suspense } from "react";
import EccoinoSetupPasswordClient from "./EccoinoSetupPasswordClient";

export const metadata = {
  title: "Eccoino Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad az Eccoino partnerportálhoz.",
};

export default function EccoinoSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EccoinoSetupPasswordClient />
    </Suspense>
  );
}
