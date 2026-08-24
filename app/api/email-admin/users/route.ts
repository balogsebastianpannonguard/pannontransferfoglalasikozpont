import { NextResponse, NextRequest } from "next/server";
import { getCurrentEmailAdminSession } from "@/lib/email-admin-auth";
import { listAllUsers, deleteUserById, type CrmUser } from "@/lib/users";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentEmailAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Nem vagy hitelesítve. Jelentkezz be újra." },
        { status: 401 }
      );
    }

    const users = await listAllUsers();

    const serializable = users.map((u) => ({
      id: u._id ? (u._id as ObjectId).toString() : null,
      email: u.email,
      normalizedEmail: u.normalizedEmail,
      isInviteAccepted: !!u.isInviteAccepted,
      twoFactorEnabled: !!u.twoFactorEnabled,
      hasPassword: !!u.hashedPassword,
      failedLoginAttempts: u.failedLoginAttempts || 0,
      isLocked: !!(u.lockedUntil && u.lockedUntil > Date.now()),
      lockedUntil: u.lockedUntil || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLoginAt: u.lastLoginAt,
      role: u.role,
    }));

    return NextResponse.json({
      success: true,
      users: serializable,
      counts: {
        total: serializable.length,
        pending: serializable.filter((u) => !u.isInviteAccepted).length,
        active: serializable.filter((u) => u.isInviteAccepted).length,
      },
    });
  } catch (error) {
    console.error("[GET /api/email-admin/users] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentEmailAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Nem vagy hitelesítve. Jelentkezz be újra." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const id = body?.id || body?.userId;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "Hiányzó felhasználó azonosító (id)." },
        { status: 400 }
      );
    }

    const res = await deleteUserById(id);
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: "A felhasználó nem található vagy nem törölhető." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...res,
      success: true,
      message: `Felhasználó sikeresen törölve. (${res.tokensDeleted} kapcsolódó invite token törölve.)`,
    });
  } catch (error) {
    console.error("[DELETE /api/email-admin/users] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt a törlés során.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminSession = await getCurrentEmailAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isLocked } = body;

    if (!id || typeof id !== "string" || typeof isLocked !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Hiányzó vagy érvénytelen paraméterek (id, isLocked)." },
        { status: 400 }
      );
    }

    const { updateUserLockStatus } = await import("@/lib/users");
    const success = await updateUserLockStatus(id, isLocked);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "A felhasználó nem található vagy nem módosítható." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Felhasználó sikeresen ${isLocked ? "zárolva" : "feloldva"}.`,
    });
  } catch (error) {
    console.error("[PATCH /api/email-admin/users] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt a módosítás során.",
      },
      { status: 500 }
    );
  }
}
