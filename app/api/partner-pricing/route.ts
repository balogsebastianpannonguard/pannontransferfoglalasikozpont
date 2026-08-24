import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth";
import {
  getAllPartnerPricing,
  getPartnerPricingByKey,
  createPartnerPricing,
  updatePartnerPricing,
  deletePartnerPricing,
} from "@/lib/partner-pricing";
import type { PartnerPricing } from "@/lib/partner-pricing";

export async function GET(request: Request) {
  try {
    const session = await requireAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Nincs hitelesítve." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const partnerKey = searchParams.get("partnerKey");

    if (partnerKey) {
      const pricing = await getPartnerPricingByKey(partnerKey, { seedIfMissing: true });
      return NextResponse.json({ success: true, data: pricing });
    }

    const all = await getAllPartnerPricing();
    return NextResponse.json({ success: true, data: all });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Nincs hitelesítve." }, { status: 401 });
    }
    const body = (await request.json()) as Omit<PartnerPricing, "_id" | "createdAt" | "updatedAt">;
    if (!body.partnerKey || !body.partnerName) {
      return NextResponse.json(
        { success: false, error: "Hiányzó kötelező mező: partnerKey, partnerName." },
        { status: 400 }
      );
    }
    const created = await createPartnerPricing(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba.";
    if (message.includes("duplicate key") || message.includes("E11000")) {
      return NextResponse.json(
        { success: false, error: "Már létező rekord ehhez a partnerKey-hez." },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Nincs hitelesítve." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const partnerKey = searchParams.get("partnerKey");
    if (!partnerKey) {
      return NextResponse.json(
        { success: false, error: "Hiányzó partnerKey query paraméter." },
        { status: 400 }
      );
    }
    const body = (await request.json()) as Partial<
      Omit<PartnerPricing, "_id" | "createdAt" | "partnerKey">
    >;
    const updated = await updatePartnerPricing(partnerKey, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Nincs ilyen rekord." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Nincs hitelesítve." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const partnerKey = searchParams.get("partnerKey");
    if (!partnerKey) {
      return NextResponse.json(
        { success: false, error: "Hiányzó partnerKey query paraméter." },
        { status: 400 }
      );
    }
    const deleted = await deletePartnerPricing(partnerKey);
    return NextResponse.json({ success: deleted, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
