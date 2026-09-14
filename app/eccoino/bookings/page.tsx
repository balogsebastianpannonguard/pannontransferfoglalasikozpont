import { Suspense } from "react";
import EccoinoBookingsClient from "./BookingsClient";

export const metadata = {
  title: "Eccoino Foglalások | Pannon Transfer",
  description: "Kezeld az Eccoino transfer foglalásait.",
};

export default function EccoinoBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
          Betöltés...
        </div>
      }
    >
      <EccoinoBookingsClient />
    </Suspense>
  );
}
