import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { consumeInviteToken, validateInviteToken } from "@/lib/invite-tokens";
import { validatePasswordComplexity } from "@/lib/users";
import { type DbEmailAdminUser } from "@/lib/email-admin-auth";

const PASSWORD_BCRYPT_ROUNDS = 12;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body || {};

    // 1. token validálás (a közös invite_tokens kollekcióból)
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

    // 3. password komplexitás ellenőrzés
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

    // 4. user keresés az email_admin_users kollekcióban az email alapján
    const emailAdminCollection = await getCollection<DbEmailAdminUser>("email_admin_users");
    const user = await emailAdminCollection.findOne({ username: tokenValidation.normalizedEmail });
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "Az Email Admin felhasználó nem létezik a rendszerben.",
        },
        { status: 404 }
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

    // 6. beállítjuk a jelszót (bcrypt hash)
    const hashedPassword = await bcrypt.hash(password, PASSWORD_BCRYPT_ROUNDS);
    await emailAdminCollection.updateOne(
      { username: tokenValidation.normalizedEmail },
      { $set: { hashedPassword, updatedAt: Date.now() } }
    );

    return NextResponse.json({
      success: true,
      message: "A jelszó sikeresen beállítva. Most már be tudsz lépni az Email Admin rendszerbe.",
      redirectTo: "/email-admin/login",
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
