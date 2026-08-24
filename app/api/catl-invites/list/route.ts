import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listCatlPortalUsers, type CatlPortalUser } from "@/lib/catl-portal-users";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const users = await listCatlPortalUsers();
    const serializable = users.map((u: CatlPortalUser) => ({
      id: u._id ? (u._id as ObjectId).toString() : null,
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
      users: serializable,
      counts: {
        total: serializable.length,
        activated: serializable.filter((u) => u.isActivated).length,
        pending: serializable.filter((u) => !u.isActivated).length,
        require2fa: serializable.filter((u) => u.requireTwoFactor).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba",
      },
      { status: 500 }
    );
  }
}
