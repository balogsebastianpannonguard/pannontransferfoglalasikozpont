import TamaBookingsClient from "./BookingsClient";

export const metadata = {
  title: "Tama Foglalások | Pannon Transfer",
  description: "Kezelje Tama transfer foglalásait.",
};

export default function TamaBookingsPage() {
  return <TamaBookingsClient />;
}
