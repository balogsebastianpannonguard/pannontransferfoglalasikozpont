import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listSchaefflerInvites } from "@/lib/schaeffler-portal-users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const invites = await listSchaefflerInvites();
    const users = invites.map((u) => ({
      id: typeof u._id === "string" ? u._id : u._id?.toString() ?? null,
      email: u.email,
      requireTwoFactor: !!u.requireTwoFactor,
      isActivated: !!u.isActivated,
      activatedAt: u.activatedAt,
      welcomeEmailSent: !!u.welcomeEmailSent,
      inviteIssuedAt: u.inviteIssuedAt,
      inviteExpiresAt: u.inviteExpiresAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLoginAt: u.lastLoginAt,
      twoFactorEnabled: !!u.twoFactorEnabled,
    }));

    return NextResponse.json({
      success: true,
      users,
      counts: {
        total: users.length,
        activated: users.filter((u) => u.isActivated).length,
        pending: users.filter((u) => !u.isActivated).length,
        require2fa: users.filter((u) => u.requireTwoFactor).length,
      },
      invites,
      count: invites.length,
    });
  } catch (error) {
    console.error("[schaeffler-invites/list] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
