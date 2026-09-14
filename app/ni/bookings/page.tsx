import NIBookingsClient from "./BookingsClient";

export const metadata = {
  title: "NI Foglalások | Pannon Transfer",
  description: "Kezelje NI transfer foglalásait.",
};

export default function NIBookingsPage() {
  return <NIBookingsClient />;
}
