import { Suspense } from "react";
import EmailAdminSetupPasswordClient from "./EmailAdminSetupPasswordClient";

export const metadata = {
  title: "Jelszó Beállítása | Email Admin",
  description: "Állítsd be a hozzáférési jelszavad a Pannon Transfer Email Admin rendszerhez.",
};

export default function EmailAdminSetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-admin-gray-500 font-semibold tracking-wide">
      Betöltés...
    </div>}>
      <EmailAdminSetupPasswordClient />
    </Suspense>
  );
}
