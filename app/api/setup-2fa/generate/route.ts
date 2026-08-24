import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  TWO_FA_SETUP_COOKIE_NAME,
  TWO_FA_SETUP_COOKIE_SECRET,
  signTwoFactorSetupToken,
} from "@/app/api/setup-password/route";
import { findUserByEmail, setUserTwoFactor } from "@/lib/users";
import { generateTwoFactorSetup, verifyTwoFactorToken } from "@/lib/two-factor";
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
        { success: false, code: "SESSION_EXPIRED", message: ctx.error },
        { status: 401 }
      );
    }
    const user = ctx.user;

    // Új 2FA secret generálás (ha userhez)
    const setup = await generateTwoFactorSetup(user.email);

    // Előzetes 2FA secret a userhez (draft, 2FA enabled=false)
    // Ha valaki félbe hagyta a folyamatot, újra tud generálódik.
    await setUserTwoFactor(user._id! as ObjectId, setup.secret, false);

    // A 2FA setup session refresh: ne vesszen el => újragenerálásnál nem zavarja a tokent
    // de azért ne kelljen újra jelszót beírni
    const refreshed = signTwoFactorSetupToken(user._id!.toString(), user.email);

    const resp = NextResponse.json({
      success: true,
      message: "2FA beállítási QR és kulcs generálva.",
      qrCodeDataUrl: setup.qrCodeDataUrl,
      otpAuthUri: setup.otpAuthUri,
      secret: setup.secret,
      email: user.email,
    });
    resp.cookies.set({
      name: TWO_FA_SETUP_COOKIE_NAME,
      value: refreshed,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 20,
    });
    return resp;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba.",
      },
      { status: 500 }
    );
  }
}
