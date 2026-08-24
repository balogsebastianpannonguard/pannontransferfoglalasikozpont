import { NextResponse } from "next/server";
import { getCurrentEmailAdminSession } from "@/lib/email-admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentEmailAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, message: "Nincs aktív munkamenet." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        username: session.username,
        role: session.role,
        loginAt: session.loginAt,
      },
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
