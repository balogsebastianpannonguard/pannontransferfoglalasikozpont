import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { deleteEcoproBmPortalUser } from "@/lib/ecoprobm-portal-users";
import { ObjectId } from "mongodb";
import { getEcoproBmPortalCollection } from "@/lib/ecoprobm-portal-users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    let id = String(body?.id || "");
    const email = String(body?.email || "").trim().toLowerCase();
    if (!id && email) {
      const col = await getEcoproBmPortalCollection();
      const found = await col.findOne({ email });
      if (found?._id) id = String(found._id);
    }
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Hiányzó felhasználó azonosító." },
        { status: 400 }
      );
    }
    const ok = await deleteEcoproBmPortalUser(new ObjectId(id));
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "A felhasználó nem található vagy már törölve lett." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Ecopro BM felhasználó és a hozzá tartozó meghívó sikeresen törölve.",
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
