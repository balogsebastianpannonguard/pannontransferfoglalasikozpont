import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  AdminUser,
} from "@/lib/auth";
import {
  findUserByEmail,
  createPendingInviteUser,
  compareUserPassword,
  isUserLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  PASSWORD_BCRYPT_ROUNDS,
  FAILED_LOGIN_THRESHOLD,
  FAILED_LOGIN_LOCK_MINUTES,
  getUserCollection,
} from "@/lib/users";
import {
  signTwoFactorSetupToken,
} from "@/app/api/setup-password/route";
import { verifyTwoFactorToken } from "@/lib/two-factor";
import type { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

function formatLockSeconds(secs: number): string {
  const min = Math.floor(secs / 60);
  const s = secs % 60;
  if (min <= 0) return `${s} mp`;
  return `${min} perc${s > 0 ? ` ${s} mp` : ""}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, totpCode } = body || {};

    // 1. Input validáció
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Kérjük, add meg az email címet és a jelszót." },
        { status: 400 }
      );
    }

    const userEmail = email.trim().toLowerCase();

    // 2. User keresés MongoDB-ben
    let user = await findUserByEmail(userEmail);

    // 3. ADMIN fallback (.env-ben megadott admin) – ha nincs a MongoDB-ben, hozzuk létre első bejelentkezésnél
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "";

    if (!user && envAdminEmail && userEmail === envAdminEmail && envAdminPassword) {
      // Admin user létrehozása MongoDB-ben a jelszavával
      const created = await createPendingInviteUser(userEmail);
      const hashed = await bcrypt.hash(envAdminPassword, PASSWORD_BCRYPT_ROUNDS);
      const collection = await getUserCollection();
      await collection.updateOne(
        { _id: created._id },
        {
          $set: {
            hashedPassword: hashed,
            isInviteAccepted: true,
              requireTwoFactor: true,
            role: "admin",
            updatedAt: Date.now(),
          },
        }
      );
      user = (await collection.findOne({ _id: created._id })) as any;
    }

    if (!user) {
      // Nem létező user - ne jelezzük, hogy létezik-e a user (timing attack védelem)
      return NextResponse.json(
        { success: false, message: "Hibás bejelentkezési adatok." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "A fiók ki van tiltva. Kérjük, vedd fel a kapcsolatot a supporttal." },
        { status: 403 }
      );
    }

    // 4. Lock ellenőrzés
    const lockCheck = await isUserLocked(user);
    if (lockCheck.locked) {
      return NextResponse.json(
        {
          success: false,
          code: "LOCKED",
          message: `Túl sok sikertelen bejelentkezési kísérlet. Kérjük, próbálj újra ${formatLockSeconds(lockCheck.remainingSeconds)} múlva.`,
          remainingSeconds: lockCheck.remainingSeconds,
        },
        { status: 429 }
      );
    }

    if (!user.hashedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "A jelszavad még nincs beállítva. Kérjük, használd az emailben kapott meghívó linket.",
        },
        { status: 400 }
      );
    }

    // 5. Jelszó ellenőrzés
    const passwordOk = await compareUserPassword(user, password.trim());
    if (!passwordOk) {
      const lockResult = await recordFailedLogin(user);
      if (lockResult.locked) {
        return NextResponse.json(
          {
            success: false,
            code: "LOCKED",
            message: `${FAILED_LOGIN_THRESHOLD} sikertelen kísérlet után a fiók zárolt ${FAILED_LOGIN_LOCK_MINUTES} percre.`,
            remainingSeconds: lockResult.remainingSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Hibás bejelentkezési adatok." },
        { status: 401 }
      );
    }

      const hasEnabledTwoFactor = !!user.twoFactorEnabled && !!user.twoFactorSecret;
      const requiresTwoFactorSetup = !!user.requireTwoFactor;

      // 6. Ha a usernek kötelező a 2FA, de még nincs bekapcsolva -> átállítjuk a setup folyamatba
      if (!hasEnabledTwoFactor && requiresTwoFactorSetup) {
        const TWO_FA_SETUP_COOKIE_NAME = "pannon_2fa_setup_session";
        const TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS = 60 * 20;
        const setupToken = signTwoFactorSetupToken(user._id!.toString(), user.email);
        const resp = NextResponse.json({
          success: false,
          code: "2FA_REQUIRED_SETUP",
          message: "A kétfaktoros hitelesítés még nincs bekapcsolva. Tovább a beállításhoz...",
          redirectTo: "/setup-2fa",
        });
        resp.cookies.set({
          name: TWO_FA_SETUP_COOKIE_NAME,
          value: setupToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: TWO_FA_SETUP_TOKEN_MAX_AGE_SECONDS,
        });
        return resp;
      }

      // 7. Ha a 2FA be van kapcsolva, akkor a TOTP kód kötelező
      if (hasEnabledTwoFactor && user.twoFactorSecret) {
        const normalizedTotp =
          totpCode && typeof totpCode === "string" ? totpCode.replace(/[^0-9]/g, "").slice(-6) : "";

        if (!/^[0-9]{6}$/.test(normalizedTotp)) {
          // 2FA kód megadása kötelező – de ne növeljük a failed próbálkozások számát, mert a jelszó jó volt.
        return NextResponse.json(
          {
            success: false,
              code: "MISSING_2FA",
              message:
                "Kérjük, add meg a 6 számjegyű hitelesítő kódot is (Google Authenticator vagy hasonló alkalmazás).",
          },
            { status: 400 }
        );
      }

        const totpVerified = verifyTwoFactorToken(user.twoFactorSecret, normalizedTotp, 1);
        if (!totpVerified) {
          // Hibás 2FA kód: szintén failed login számítás
          const lockResult = await recordFailedLogin(user);
          if (lockResult.locked) {
            return NextResponse.json(
              {
                success: false,
                code: "LOCKED",
                message: `${FAILED_LOGIN_THRESHOLD} sikertelen kísérlet után a fiók zárolt ${FAILED_LOGIN_LOCK_MINUTES} percre.`,
                remainingSeconds: lockResult.remainingSeconds,
              },
              { status: 429 }
            );
          }
          return NextResponse.json(
            {
              success: false,
              code: "INVALID_2FA",
              message: "Hibás vagy lejárt 2FA kód. Ellenőrizd az alkalmazásodban a kijelzett számokat és a telefonod óráját.",
            },
            { status: 401 }
          );
        }
    }

    // 8. Minden rendben -> sikeres login
    await recordSuccessfulLogin(user._id as ObjectId);

    const adminUser: AdminUser = {
      email: user.normalizedEmail,
      role: user.role === "admin" ? "admin" : "user",
      loginAt: Date.now(),
    };

    const AUTH_COOKIE_NAME = "pannon_admin_session";
    const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
    const sessionToken = createSessionToken(adminUser);
    const successResp = NextResponse.json({
      success: true,
      message: "Sikeres bejelentkezés.",
      user: {
        email: adminUser.email,
        role: adminUser.role,
      },
      redirectTo: "/admin",
    });
    successResp.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
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
