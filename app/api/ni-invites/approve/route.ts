import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getNiPortalCollection, createOrResetNiInvite } from "@/lib/ni-portal-users";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ success: false, message: "Hiányzó e-mail cím." }, { status: 400 });

  const col = await getNiPortalCollection();
  const pending = await col.findOne({ normalizedEmail: email, inviteStatus: "pending_approval" });
  if (!pending) return NextResponse.json({ success: false, message: "Nincs ilyen jóváhagyásra váró meghívás." }, { status: 404 });

  const { rawToken, user } = await createOrResetNiInvite(email, {
    requireTwoFactor: !!pending.requireTwoFactor,
    invitedByUserId: pending.invitedByUserId || null,
    invitedByEmail: pending.invitedByEmail || null,
  });
  const setupUrl = `${new URL(request.url).origin.replace(":3000", ":3001")}/ni/setup-password?token=${encodeURIComponent(rawToken)}`;
  const mail = await sendEmail({
    to: email,
    subject: "Meghívás az NI Partner Portálra – Pannon Transfer",
    text: `A meghívást jóváhagytuk. Aktiválja fiókját ezen a linken: ${setupUrl}`,
  });
  if (!mail.success) return NextResponse.json({ success: false, message: mail.error || "E-mail küldési hiba." }, { status: 502 });
  await col.updateOne({ _id: user._id }, { $set: { inviteStatus: "active", approvedAt: Date.now(), approvedBy: session.email } });
  return NextResponse.json({ success: true, message: "A meghívás jóváhagyva és elküldve." });
}
