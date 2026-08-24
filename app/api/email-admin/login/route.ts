import { NextResponse } from "next/server";
import {
  verifyEmailAdminCredentials,
  createEmailAdminSessionToken,
  EmailAdminUser,
  EMAIL_AUTH_COOKIE_NAME,
} from "@/lib/email-admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    const verification = await verifyEmailAdminCredentials(email, password);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, message: verification.message || "Hibás bejelentkezési adatok." },
        { status: 401 }
      );
    }

    const user: EmailAdminUser = {
      username: email.trim(),
      role: "email_admin",
      loginAt: Date.now(),
    };

    const token = createEmailAdminSessionToken(user);

    const resp = NextResponse.json({
      success: true,
      message: "Sikeres bejelentkezés.",
      user: {
        username: user.username,
        role: user.role,
      },
      redirectTo: "/email-admin/dashboard",
    });
    resp.cookies.set({
      name: EMAIL_AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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
