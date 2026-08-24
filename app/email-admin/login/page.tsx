import EmailAdminLoginClient from "./EmailAdminLoginClient";

export const metadata = {
  title: "Email Admin Bejelentkezés | Pannon Transfer",
  description: "Jelentkezz be az email küldő admin felületre.",
};

export default function EmailAdminLoginPage() {
  return <EmailAdminLoginClient />;
}
