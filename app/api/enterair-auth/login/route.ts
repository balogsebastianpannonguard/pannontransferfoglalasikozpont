import { NextResponse } from "next/server";
import {
  findEnterAirUserByEmail,
  compareEnterAirPassword,
  recordEnterAirSuccessfulLogin,
} from "@/lib/enterair-portal-users";
import { createSessionToken, AdminUser } from "@/lib/auth";
import { verifyTwoFactorToken } from "@/lib/two-factor";
import type { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, totpCode } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Kérjük, add meg az email címet és a jelszót." },
        { status: 400 }
      );
    }

    const userEmail = email.trim().toLowerCase();
    let user = await findEnterAirUserByEmail(userEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Hibás bejelentkezési adatok." },
        { status: 401 }
      );
    }

    if (!user.isActivated) {
      return NextResponse.json(
        { success: false, message: "A fiók még nincs aktiválva. Kérjük, használd az emailben kapott linket." },
        { status: 403 }
      );
    }

    if (!user.hashedPassword) {
      return NextResponse.json(
        { success: false, message: "A jelszavad még nincs beállítva. Kérjük, használd az emailben kapott meghívó linket." },
        { status: 400 }
      );
    }

    const passwordOk = await compareEnterAirPassword(user, password.trim());
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, message: "Hibás bejelentkezési adatok." },
        { status: 401 }
      );
    }

    const hasEnabledTwoFactor = !!user.twoFactorEnabled && !!user.twoFactorSecret;
    const requiresTwoFactorSetup = !!user.requireTwoFactor;

    if (!hasEnabledTwoFactor && requiresTwoFactorSetup) {
      return NextResponse.json(
        {
          success: false,
          code: "2FA_REQUIRED_SETUP",
          message: "A kétfaktoros hitelesítés még nincs bekapcsolva. Kérjük, vedd fel a kapcsolatot a supporttal.",
        },
        { status: 403 }
      );
    }

    if (hasEnabledTwoFactor && user.twoFactorSecret) {
      const normalizedTotp =
        totpCode && typeof totpCode === "string" ? totpCode.replace(/[^0-9]/g, "").slice(-6) : "";

      if (!/^[0-9]{6}$/.test(normalizedTotp)) {
        return NextResponse.json(
          {
            success: false,
            code: "MISSING_2FA",
            message: "Kérjük, add meg a 6 számjegyű hitelesítő kódot.",
          },
          { status: 400 }
        );
      }

      const totpVerified = verifyTwoFactorToken(user.twoFactorSecret, normalizedTotp, 1);
      if (!totpVerified) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_2FA",
            message: "Hibás vagy lejárt 2FA kód.",
          },
          { status: 401 }
        );
      }
    }

    await recordEnterAirSuccessfulLogin(user._id as any as ObjectId);

    const adminUser: AdminUser = {
      email: user.normalizedEmail,
      role: "user",
      loginAt: Date.now(),
    };

    const AUTH_COOKIE_NAME = "enterair_portal_session";
    const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
    const sessionToken = createSessionToken(adminUser);
    const successResp = NextResponse.json({
      success: true,
      message: "Sikeres bejelentkezés.",
      user: {
        email: adminUser.email,
        role: adminUser.role,
      },
      redirectTo: "/enterair",
    });
    successResp.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
    return successResp;
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
