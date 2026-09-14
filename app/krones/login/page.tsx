import { Suspense } from "react";
import KronesLoginClient from "./KronesLoginClient";

export const metadata = {
  title: "Krones Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés a Krones partnerportálra.",
};

export default function KronesLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <KronesLoginClient />
    </Suspense>
  );
}
