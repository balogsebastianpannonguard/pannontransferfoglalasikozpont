import { NextResponse } from "next/server";
import { findVitescoUserByInviteToken } from "@/lib/vitesco-portal-users";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json({ valid: false, message: "Hiányzó token." }, { status: 400 });
    }

    const user = await findVitescoUserByInviteToken(token);
    if (!user) {
      return NextResponse.json(
        { valid: false, message: "Érvénytelen vagy lejárt Vitesco meghívó link." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      expiresAt: user.inviteExpiresAt,
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
