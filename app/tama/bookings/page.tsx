import TamaBookingsClient from "./BookingsClient";

export const metadata = {
  title: "TAMA Hungary Kft. Foglalások | Pannon Transfer",
  description: "Kezelje TAMA Hungary Kft. transfer foglalásait.",
};

export default function TamaBookingsPage() {
  return <TamaBookingsClient />;
}
