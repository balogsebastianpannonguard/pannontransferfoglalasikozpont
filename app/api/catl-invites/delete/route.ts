import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { deleteCatlPortalUser } from "@/lib/catl-portal-users";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hiányzó felhasználó azonosító." },
        { status: 400 }
      );
    }
    const ok = await deleteCatlPortalUser(new ObjectId(id));
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "A felhasználó nem található vagy már törölve lett." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Felhasználó és a hozzá tartozó meghívó sikeresen törölve.",
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
