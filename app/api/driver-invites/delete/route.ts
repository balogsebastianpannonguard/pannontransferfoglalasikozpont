import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { deleteStaffInvite } from "@/lib/staff-users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body || {};
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hiányzó felhasználó ID" },
        { status: 400 }
      );
    }
    const deleted = await deleteStaffInvite(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Sikertelen törlés" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Felhasználó és hozzáférés sikeresen törölve.",
    });
  } catch (error) {
    console.error("[staff-invites/delete] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
