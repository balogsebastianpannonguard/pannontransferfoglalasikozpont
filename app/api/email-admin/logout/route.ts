import { NextResponse } from "next/server";
import { EMAIL_AUTH_COOKIE_NAME } from "@/lib/email-admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const resp = NextResponse.json({
      success: true,
      message: "Sikeres kijelentkezés.",
      redirectTo: "/email-admin/login",
    });
    resp.cookies.delete({
      name: EMAIL_AUTH_COOKIE_NAME,
      path: "/",
    });
    return resp;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
