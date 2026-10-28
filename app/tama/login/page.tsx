import { Suspense } from "react";
import TamaLoginClient from "./TamaLoginClient";

export const metadata = {
  title: "TAMA Hungary Kft. Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés a TAMA Hungary Kft. partnerportálra.",
};

export default function TamaLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <TamaLoginClient />
    </Suspense>
  );
}
