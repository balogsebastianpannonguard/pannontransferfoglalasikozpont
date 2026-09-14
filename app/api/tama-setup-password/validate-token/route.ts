import { NextResponse } from "next/server";
import { findTamaUserByInviteToken } from "@/lib/tama-portal-users";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Hiányzó token." },
        { status: 400 }
      );
    }

    const user = await findTamaUserByInviteToken(token);

    if (!user || !user._id) {
      return NextResponse.json(
        { valid: false, message: "Érvénytelen vagy lejárt meghívó link." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.normalizedEmail,
      requireTwoFactor: !!user.requireTwoFactor,
    });
  } catch (error) {
    console.error("[tama-setup-password/validate-token] error", error);
    return NextResponse.json(
      { valid: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
