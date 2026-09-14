import KronesBookingsClient from "./BookingsClient";

export const metadata = {
  title: "Krones Foglalások | Pannon Transfer",
  description: "Kezelje Krones transfer foglalásait.",
};

export default function KronesBookingsPage() {
  return <KronesBookingsClient />;
}
