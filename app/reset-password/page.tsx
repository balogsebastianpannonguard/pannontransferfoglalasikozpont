import React, { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Új Jelszó Beállítása | Pannon Transfer CRM",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Betöltés...</p></div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}