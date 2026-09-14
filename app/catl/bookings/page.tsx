export const metadata = {
  title: "CATL Hungary - Foglalások | Pannon Transfer",
  description: "CATL partner foglalások kezelése.",
};

import CatlBookingsClient from "./BookingsClient";

export default function CatlBookingsPage() {
  return <CatlBookingsClient />;
}
