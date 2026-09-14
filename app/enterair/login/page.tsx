import { Suspense } from "react";
import EnterAirLoginClient from "./EnterAirLoginClient";

export const metadata = {
  title: "Enter Air Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés az Enter Air partnerportálra.",
};

export default function EnterAirLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EnterAirLoginClient />
    </Suspense>
  );
}
