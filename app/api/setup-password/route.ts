import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { consumeInviteToken, validateInviteToken } from "@/lib/invite-tokens";
import {
  findUserByEmail,
  setUserPassword,
  validatePasswordComplexity,
} from "@/lib/users";

export const dynamic = "force-dynamic";

export const TWO_FA_SETUP_COOKIE_NAME = "pannon_2fa_setup_session";
export const TWO_FA_SETUP_COOKIE_SECRET =
  process.env.TWO_FA_SETUP_COOKIE_SECRET || "pannon_2fa_setup_cookie_secret_v1_2025";
export const TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS = 60 * 20; // 20 perc

interface TwoFactorSetupPayload {
  userId: string;
  email: string;
  purpose: "2fa_setup";
  createdAt: number;
}

export function signTwoFactorSetupToken(userId: string, email: string) {
  const payload: TwoFactorSetupPayload = {
    userId,
    email,
    purpose: "2fa_setup",
    createdAt: Date.now(),
  };
  return jwt.sign(payload, TWO_FA_SETUP_COOKIE_SECRET, {
    expiresIn: `${TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS}s`,
  });
}

export function verifyTwoFactorSetupToken(token: string): TwoFactorSetupPayload | null {
  try {
    const decoded = jwt.verify(token, TWO_FA_SETUP_COOKIE_SECRET) as TwoFactorSetupPayload;
    if (decoded.purpose !== "2fa_setup") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function setTwoFactorSetupCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FA_SETUP_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearTwoFactorSetupCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FA_SETUP_COOKIE_NAME);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body || {};

    // 1. token validálás
    const tokenValidation = await validateInviteToken(token || "");
    if (!tokenValidation.valid || !tokenValidation.normalizedEmail) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TOKEN",
          message: tokenValidation.reason || "Érvénytelen vagy lejárt meghívó link.",
        },
        { status: 400 }
      );
    }

    // 2. passwordok létezése és egyezés
    if (!password || typeof password !== "string" || !confirmPassword || typeof confirmPassword !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PASSWORDS",
          message: "Kérjük, add meg az új jelszót és megerősítését is.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_MISMATCH",
          message: "A két jelszó nem egyezik meg.",
        },
        { status: 400 }
      );
    }

    // 3. password komplexitás ellenőrzés (a validatePasswordComplexity visszatér a pontosan okával)
    const complexityCheck = validatePasswordComplexity(password);
    if (!complexityCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          code: "WEAK_PASSWORD",
          message: complexityCheck.reason,
          details: complexityCheck.checks,
        },
        { status: 400 }
      );
    }

    // 4. user keresés az email alapján (tokenhez tartozó email)
    const user = await findUserByEmail(tokenValidation.normalizedEmail);
    if (!user || !user._id) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "A felhasználó nem létezik a rendszerben.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_DISABLED",
          message: "A fiók ki van tiltva. Kérjük, vedd fel a kapcsolatot a supporttal.",
        },
        { status: 403 }
      );
    }

    // 5. consume the token (mark usedAt)
    const consumeResult = await consumeInviteToken(token);
    if (!consumeResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: "TOKEN_CONSUME_FAILED",
          message: "A link felhasználása sikertelen. Kérj új meghívót.",
        },
        { status: 400 }
      );
    }

    // 6. beállítjuk a jelszót (bcrypt hash) és isInviteAccepted=true
    await setUserPassword(user._id, password);

      if (user.requireTwoFactor) {
        // 7. 2FA setup session cookie beállítása (átmeneti, 20 perces, HttpOnly)
        const setupToken = signTwoFactorSetupToken(user._id.toString(), user.email);
        const twoFaResp = NextResponse.json({
          success: true,
          message: "A jelszó sikeresen beállítva. Tovább a kétfaktoros hitelesítés beállításához.",
          redirectTo: "/setup-2fa",
          requireTwoFactor: true,
        });
        twoFaResp.cookies.set({
          name: TWO_FA_SETUP_COOKIE_NAME,
          value: setupToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS,
        });
        return twoFaResp;
      }

      return NextResponse.json({
        success: true,
        message: "A jelszó sikeresen beállítva. Most már be tudsz jelentkezni a CRM rendszerbe.",
        redirectTo: "/login",
        requireTwoFactor: false,
      });
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
