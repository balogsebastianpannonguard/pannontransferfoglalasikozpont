import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const resp = NextResponse.json({
      success: true,
      message: "Sikeres kijelentkezés.",
      redirectTo: "/login",
    });
    resp.cookies.delete({
      name: AUTH_COOKIE_NAME,
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
