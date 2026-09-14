import { Suspense } from "react";
import SchaefflerSetupPasswordClient from "./SchaefflerSetupPasswordClient";

export const metadata = {
  title: "Schaeffler Jelszó Beállítása | Pannon Transfer",
  description: "Állítsd be a hozzáférési jelszavad a Schaeffler partnerportálhoz.",
};

export default function SchaefflerSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <SchaefflerSetupPasswordClient />
    </Suspense>
  );
}
