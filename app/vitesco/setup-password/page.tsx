import { Suspense } from "react";

export const metadata = {
  title: "Vitesco Technologies - Jelszó beállítás | Pannon Transfer",
  description: "Vitesco partnerportál jelszó aktiválása.",
};

import VitescoSetupPasswordClient from "./VitescoSetupPasswordClient";

export default function VitescoSetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <VitescoSetupPasswordClient />
    </Suspense>
  );
}
