import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listStaffUsers, deleteStaffInvite } from "@/lib/staff-users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const users = await listStaffUsers({ role: "driver" });
    const counts = {
      total: users.length,
      activated: users.filter((u) => u.isActivated).length,
      pending: users.filter((u) => !u.isActivated).length,
      require2fa: users.filter((u) => u.requireTwoFactor).length,
    };
    const transformed = users.map((u) => ({
      id: u._id ? String(u._id) : undefined,
      email: u.email,
      name: u.name,
      role: u.role,
      isActivated: u.status === "active" || u.isActivated,
      activatedAt: u.activatedAt,
      requireTwoFactor: u.requireTwoFactor,
      twoFactorEnabled: u.twoFactorEnabled,
      hasPassword: !!u.hashedPassword,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      inviteIssuedAt: u.inviteIssuedAt,
      inviteExpiresAt: u.inviteExpiresAt,
    }));
    return NextResponse.json({
      success: true,
      users: transformed,
      counts,
    });
  } catch (error) {
    console.error("[staff-invites/list] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
