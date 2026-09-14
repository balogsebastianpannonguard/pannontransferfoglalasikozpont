import { Suspense } from "react";
import NISetupPasswordClient from "./NISetupPasswordClient";

export const metadata = {
  title: "NI Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad az NI partnerportálhoz.",
};

export default function NISetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <NISetupPasswordClient />
    </Suspense>
  );
}
