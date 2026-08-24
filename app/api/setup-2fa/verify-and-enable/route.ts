import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  TWO_FA_SETUP_COOKIE_NAME,
  TWO_FA_SETUP_COOKIE_SECRET,
} from "@/app/api/setup-password/route";
import { findUserByEmail, setUserTwoFactor, recordSuccessfulLogin } from "@/lib/users";
import { verifyTwoFactorToken } from "@/lib/two-factor";
import type { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

async function getCurrentSetupUserOr401() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TWO_FA_SETUP_COOKIE_NAME)?.value;
  if (!token) {
    return { error: "A 2FA beállítási munkamenet lejárt vagy hiányzik.", user: null };
  }

  try {
    const decoded = jwt.verify(token, TWO_FA_SETUP_COOKIE_SECRET) as any;
    if (decoded.purpose !== "2fa_setup") {
      return { error: "Érvénytelen munkamenet.", user: null };
    }
    const user = await findUserByEmail(decoded.email);
    if (!user || !user._id) {
      return { error: "A felhasználó nem található.", user: null };
    }
    if (user._id.toString() !== decoded.userId.toString()) {
      return { error: "Érvénytelen munkamenet-adat.", user: null };
    }
    if (!user.isActive) {
      return { error: "A fiók ki van tiltva.", user: null };
    }
    return { error: null, user };
  } catch {
    return { error: "A 2FA beállítási munkamenet lejárt.", user: null };
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentSetupUserOr401();
    if (!ctx.user) {
      return NextResponse.json(
        { success: false, code: "SESSION_EXPIRED", message: ctx.error, redirectTo: "/setup-password" },
        { status: 401 }
      );
    }
    const user = ctx.user;

    const body = await request.json();
    const { totpCode } = body || {};

    if (!totpCode || typeof totpCode !== "string" || !/^[0-9]{6}$/.test(totpCode.trim())) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CODE_FORMAT",
          message: "Kérjük, add meg a hitelesítő alkalmazás 6 számjegyű kódját.",
        },
        { status: 400 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_SECRET",
          message: "Először generáld meg a 2FA QR-kódot. Kattints az Újragenerálás gombra.",
        },
        { status: 400 }
      );
    }

    const verified = verifyTwoFactorToken(user.twoFactorSecret, totpCode.trim(), 1);
    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CODE",
          message: "Hibás 2FA kód. Kérjük, ellenőrizd a beírt számokat és a hitelesítő alkalmazásodban.",
        },
        { status: 401 }
      );
    }

    // Sikeres validáció: 2FA bekapcsolása
    await setUserTwoFactor(user._id as ObjectId, user.twoFactorSecret, true);

    // Első login után sikeres 2FA beállítás: sikertelen próbálkozások reset
    await recordSuccessfulLogin(user._id as ObjectId);

    // Setup munkamenet törlése
    const resp = NextResponse.json({
      success: true,
      message: "A kétfaktoros hitelesítés sikeresen bekapcsolva. Most már be tudsz jelentkezni.",
      redirectTo: "/login",
    });
    resp.cookies.delete({
      name: TWO_FA_SETUP_COOKIE_NAME,
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
