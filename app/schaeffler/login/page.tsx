import { Suspense } from "react";
import SchaefflerLoginClient from "./SchaefflerLoginClient";

export const metadata = {
  title: "Schaeffler Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés a Schaeffler partnerportálra.",
};

export default function SchaefflerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <SchaefflerLoginClient />
    </Suspense>
  );
}
