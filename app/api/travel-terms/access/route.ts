import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createInviteToken } from "@/lib/invite-tokens";
import { sendEmail } from "@/lib/email";
import { createPendingInviteUser } from "@/lib/users";
import {
  listTravelTermsAccessUsers,
  resolveTravelTermsAccessForSession,
  upsertTravelTermsAccessUser,
  type TravelTermsRole,
} from "@/lib/travel-terms";
import { publishTravelTermsEvent } from "@/lib/travel-terms-realtime";

export const dynamic = "force-dynamic";

function isValidRole(role: unknown): role is TravelTermsRole {
  return role === "owner" || role === "editor" || role === "viewer";
}

function buildInviteEmail(setupUrl: string, displayName: string, role: TravelTermsRole) {
  const subject = "Pannon Transfer - utazási feltételek hozzáférés";
  const text = [
    `Kedves ${displayName}!`,
    "",
    "Hozzáférést kaptál a Pannon Transfer utazási feltételek felületéhez.",
    `Jogosultság: ${role}`,
    `Jelszó beállítása: ${setupUrl}`,
    "",
    "A link egyszer használható, majd a szokásos bejelentkezéssel érhető el a felület.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827">
      <h1 style="font-size:24px;margin:0 0 16px">Utazási feltételek hozzáférés</h1>
      <p style="font-size:15px;line-height:1.7">Kedves ${displayName}!</p>
      <p style="font-size:15px;line-height:1.7">
        Hozzáférést kaptál a Pannon Transfer dedikált utazási feltételek felületéhez.
        Jogosultságod: <strong>${role}</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${setupUrl}" style="display:inline-block;padding:14px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700">
          Jelszó beállítása
        </a>
      </p>
      <p style="font-size:13px;color:#6B7280;line-height:1.7">
        A jelszó beállítása után a meglévő belépési oldalon tudsz bejelentkezni, majd megnyitni a dedikált utazási feltételek linket.
      </p>
    </div>
  `;

  return { subject, text, html };
}

async function requireOwner() {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ success: false, message: "Nincs aktív munkamenet." }, { status: 401 }) };
  }

  const accessUser = await resolveTravelTermsAccessForSession(session);
  if (!accessUser || accessUser.role !== "owner") {
    return {
      error: NextResponse.json(
        { success: false, message: "Csak tulajdonos jogosultsággal kezelhető a hozzáférési lista." },
        { status: 403 }
      ),
    };
  }

  return { session, accessUser };
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const displayName = String(body?.displayName || "").trim();
    const role = body?.role;
    const sendInvite = !!body?.sendInvite;

    if (!email) {
      return NextResponse.json({ success: false, message: "Hiányzik az e-mail cím." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Érvénytelen e-mail cím." }, { status: 400 });
    }

    if (!isValidRole(role)) {
      return NextResponse.json({ success: false, message: "Érvénytelen jogosultsági szint." }, { status: 400 });
    }

    const accessUser = await upsertTravelTermsAccessUser({
      email,
      displayName,
      role,
      actorEmail: auth.session.email,
      isActive: body?.isActive ?? true,
    });

    let invite: { setupUrl: string; expiresAt: number } | null = null;

    if (sendInvite) {
      await createPendingInviteUser(email, { requireTwoFactor: true });
      const { rawToken, expiresAt } = await createInviteToken(email);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
        new URL(request.url).origin;
      const setupUrl = `${baseUrl}/setup-password?token=${encodeURIComponent(rawToken)}`;

      const mail = buildInviteEmail(
        setupUrl,
        accessUser.displayName || displayName || email.split("@")[0],
        role
      );

      await sendEmail({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      invite = { setupUrl, expiresAt };
    }

    const accessUsers = await listTravelTermsAccessUsers();
    publishTravelTermsEvent({
      type: "access_updated",
      payload: { accessUsers },
    });

    return NextResponse.json({
      success: true,
      accessUser,
      accessUsers,
      invite,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Nem sikerült menteni a hozzáférést." },
      { status: 500 }
    );
  }
}
