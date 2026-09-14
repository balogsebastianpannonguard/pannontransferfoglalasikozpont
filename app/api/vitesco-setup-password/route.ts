import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { validatePasswordComplexity } from "@/lib/users";
import {
  findVitescoUserByInviteToken,
  setVitescoUserPasswordAndActivate,
} from "@/lib/vitesco-portal-users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body || {};

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, code: "INVALID_TOKEN", message: "Hiányzó vagy érvénytelen token." },
        { status: 400 }
      );
    }

    const user = await findVitescoUserByInviteToken(token);
    if (!user || !user._id) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TOKEN",
          message: "Érvénytelen vagy lejárt Vitesco meghívó link.",
        },
        { status: 400 }
      );
    }

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

    await setVitescoUserPasswordAndActivate(new ObjectId(String(user._id)), password);

    return NextResponse.json({
      success: true,
      message: "A Vitesco portál jelszava sikeresen beállítva.",
      redirectTo: "/vitesco?activated=1",
      requireTwoFactor: !!user.requireTwoFactor,
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
