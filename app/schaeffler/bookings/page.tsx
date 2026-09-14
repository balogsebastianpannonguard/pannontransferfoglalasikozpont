import SchaefflerBookingsClient from "./BookingsClient";

export const metadata = {
  title: "Schaeffler Foglalások | Pannon Transfer",
  description: "Kezelje Schaeffler transfer foglalásait.",
};

export default function SchaefflerBookingsPage() {
  return <SchaefflerBookingsClient />;
}
