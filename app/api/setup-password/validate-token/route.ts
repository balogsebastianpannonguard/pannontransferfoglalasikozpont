import { NextResponse } from "next/server";
import { validateInviteToken } from "@/lib/invite-tokens";
import { findUserByEmail } from "@/lib/users";
import { getCollection } from "@/lib/db";
import { type DbEmailAdminUser } from "@/lib/email-admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
      const system = searchParams.get("system");

    const validation = await validateInviteToken(token || "");
    if (!validation.valid || !validation.normalizedEmail) {
      return NextResponse.json(
        {
          valid: false,
          message: validation.reason || "Érvénytelen token.",
        },
        { status: 400 }
      );
    }

      if (system === "email-admin") {
        const emailAdminCollection = await getCollection<DbEmailAdminUser>("email_admin_users");
        const emailAdminUser = await emailAdminCollection.findOne({ username: validation.normalizedEmail });

        if (!emailAdminUser) {
          return NextResponse.json(
            { valid: false, message: "Az Email Admin felhasználó nem létezik a rendszerben." },
            { status: 404 }
          );
        }

        return NextResponse.json({
          valid: true,
          email: emailAdminUser.username,
          expiresAt: validation.expiresAt,
          requireTwoFactor: false,
          message: "Token érvényes.",
        });
    }

      const user = await findUserByEmail(validation.normalizedEmail);
      if (!user) {
      return NextResponse.json(
          { valid: false, message: "A felhasználó nem létezik a rendszerben." },
          { status: 404 }
      );
    }

      if (!user.isActive) {
        return NextResponse.json(
          { valid: false, message: "A fiók ki van tiltva. Kérjük, vedd fel a kapcsolatot a supporttal." },
          { status: 403 }
        );
      }

    return NextResponse.json({
      valid: true,
      email: user.email,
      expiresAt: validation.expiresAt,
        requireTwoFactor: !!user.requireTwoFactor,
      message: "Token érvényes.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt.",
      },
      { status: 500 }
    );
  }
}
