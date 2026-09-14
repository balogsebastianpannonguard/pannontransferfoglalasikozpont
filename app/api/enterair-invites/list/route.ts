import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listEnterAirInvites } from "@/lib/enterair-portal-users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const invites = await listEnterAirInvites();

    return NextResponse.json({
      success: true,
      invites,
      count: invites.length,
    });
  } catch (error) {
    console.error("[enterair-invites/list] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
