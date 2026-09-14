import { Suspense } from "react";
import NILoginClient from "./NILoginClient";

export const metadata = {
  title: "NI Bejelentkezés | Pannon Transfer",
  description: "Bejelentkezés az NI partnerportálra.",
};

export default function NILoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <NILoginClient />
    </Suspense>
  );
}
