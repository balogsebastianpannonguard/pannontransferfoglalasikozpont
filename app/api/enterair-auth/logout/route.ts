import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const resp = NextResponse.json({
    success: true,
    message: "Sikeres kijelentkezés.",
  });

  resp.cookies.set({
    name: "enterair_portal_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return resp;
}
