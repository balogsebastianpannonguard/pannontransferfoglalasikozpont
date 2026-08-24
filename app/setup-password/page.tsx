import { Suspense } from "react";
import SetupPasswordClient from "./SetupPasswordClient";

export const metadata = {
  title: "Jelszó Beállítása | Pannon Transfer CRM",
  description: "Állítsd be a hozzáférési jelszavad a Pannon Transfer CRM rendszerhez.",
};

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
      Betöltés...
    </div>}>
      <SetupPasswordClient />
    </Suspense>
  );
}
