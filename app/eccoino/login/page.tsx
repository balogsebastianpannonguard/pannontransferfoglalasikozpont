import { Suspense } from "react";
import EccoinoLoginClient from "./EccoinoLoginClient";

export const metadata = {
  title: "Eccoino Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés az Eccoino partnerportálra.",
};

export default function EccoinoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EccoinoLoginClient />
    </Suspense>
  );
}
