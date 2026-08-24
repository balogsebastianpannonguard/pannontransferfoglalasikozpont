import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { createInviteToken } from "@/lib/invite-tokens";
import { sendEmail } from "@/lib/email";
import { type DbEmailAdminUser } from "@/lib/email-admin-auth";

function buildEmailAdminInviteHtml(recipientEmail: string, setupUrl: string, expiresAt: number) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const year = new Date().getFullYear();
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #111;">
      <div style="text-align: center; margin-bottom: 36px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #fff; border-radius: 1.25rem; border: 1px solid #eee; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-bottom: 20px;">
          <span style="font-weight: 900; font-size: 24px; letter-spacing: -0.02em; background: linear-gradient(135deg, #E6B800, #B8860B); -webkit-background-clip: text; background-clip: text; color: transparent;">PT</span>
        </div>
        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">Meghívás az Invite Centerbe</h1>
        <p style="margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #B8860B;">Pannon Transfer • Email Admin</p>
      </div>

      <div style="background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 24px; padding: 32px; margin-bottom: 32px;">
        <p style="margin: 0 0 24px; font-size: 15px; color: #333; line-height: 1.6;">
          Meghívást kaptál a <strong style="color: #B8860B;">Pannon Transfer Email Admin</strong> (Invite Center) rendszerébe.
          Kizárólag az alábbi egyedi linken keresztül tudod beállítani a jelszavad, majd belépni.
        </p>

        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px 20px; padding: 20px; background: #fff; border-radius: 18px; border: 1px solid #F0F0F0; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999; display: flex; align-items: center;">Admin fiók</div>
          <div style="font-size: 15px; font-weight: 600; color: #111; word-break: break-all;">${recipientEmail}</div>

          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999; display: flex; align-items: center;">Link érvényesség</div>
          <div style="font-size: 15px; font-weight: 600; color: #111;">${expiresStr}</div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
          💡 <strong>Fontos:</strong> Az egyedi link másokkal <strong>nem osztható meg</strong>.
          A link 24 óra után lejár, és csak egyszer használatos. Kérjük, másold le a jelszavadat egy biztonságos helyre.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(90deg, #E6B800, #F7C800); color: #111; text-decoration: none; padding: 16px 28px; border-radius: 18px; font-size: 12px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; box-shadow: 0 8px 20px rgba(230,184,0,0.25);">
          Jelszó beállítása &amp; Belépés →
        </a>
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #F0F0F0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #BBB;">
        © ${year} Pannon Transfer. Minden jog fenntartva.
      </div>
    </div>
  `;
}

function buildEmailAdminInviteText(recipientEmail: string, setupUrl: string, expiresAt: number) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const year = new Date().getFullYear();
  return `
PANNON TRANSFER – MEGHÍVÁS AZ EMAIL ADMIN RENDSZERBE
=====================================================

Sikeres meghívást kaptál az Invite Centerbe.
Kizárólag az alábbi egyedi linken keresztül tudod beállítani a jelszavad, majd belépni:

${setupUrl}

Adatok:
• Admin fiók:         ${recipientEmail}
• Link érvényesség:   ${expiresStr}

FONTOS:
• Az egyedi link másokkal NEM osztható meg.
• A link 24 óra után lejár, és csak egyszer használatos.
• Kérjük, másold le a jelszavadat egy biztonságos helyre.

© ${year} Pannon Transfer. Minden jog fenntartva.
  `.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipients, loginBaseUrl } = body || {};

    if (!recipients) {
      return NextResponse.json({ success: false, message: "Hiányzó címzettek." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawList = Array.isArray(recipients) ? recipients : [recipients];
    const recipientList = rawList
      .map((r) => String(r).trim())
      .filter(Boolean);

    for (const email of recipientList) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: "Érvénytelen e-mail cím: " + email },
          { status: 400 }
        );
      }
    }

    if (recipientList.length === 0) {
      return NextResponse.json({ success: false, message: "Nincs érvényes címzett." }, { status: 400 });
    }

    const masterUsername = (process.env.EMAIL_ADMIN_USERNAME || "admin").trim().toLowerCase();
    const finalBase =
      typeof loginBaseUrl === "string" && loginBaseUrl.trim()
        ? loginBaseUrl.trim().replace(/\/$/, "")
        : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    const setupPath = "/email-admin/setup-password";
    const emailAdminCollection = await getCollection<DbEmailAdminUser>("email_admin_users");

    type Result = {
      recipient: string;
      success: boolean;
      error: string | null;
      setupLink: string | null;
      expiresAt: number | null;
    };
    const results: Result[] = [];

    for (const recipient of recipientList) {
      try {
        const normalizedEmail = recipient.trim();
        const normalizedEmailLower = normalizedEmail.toLowerCase();

        // Master collision check
        if (normalizedEmailLower === masterUsername) {
          results.push({
            recipient,
            success: false,
            error: "Ez a fiók a master admin, nem hívható meg.",
            setupLink: null,
            expiresAt: null,
          });
          continue;
        }

        // Létrehozzuk a pending user-t ha nem létezik (null hashedPassword)
        const existing = await emailAdminCollection.findOne({ username: normalizedEmail });
        if (!existing) {
          await emailAdminCollection.insertOne({
            username: normalizedEmail,
            hashedPassword: "__PENDING_INVITE__",
            role: "email_admin",
            createdAt: Date.now(),
          } as any);
        } else if (existing.hashedPassword && existing.hashedPassword !== "__PENDING_INVITE__") {
          // Már létező, aktivált admin user - ne küldjön újra meghívót
          results.push({
            recipient,
            success: false,
            error: "Az e-mail cím már létező Email Admin fiókhoz tartozik, már be tud lépni.",
            setupLink: null,
            expiresAt: null,
          });
          continue;
        }

        // Invite token létrehozása (a közös invite_tokens kollekcióba, így lejárati idő és consume logika OK)
        const { rawToken, expiresAt } = await createInviteToken(normalizedEmail);

        const setupUrl = `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== EMAIL ADMIN INVITE ===");
        console.log("Címzett:", normalizedEmail);
        console.log("Setup link:", setupUrl);
        console.log("Lejár:", new Date(expiresAt).toLocaleString("hu-HU"));
        console.log("==========================\n");

        const html = buildEmailAdminInviteHtml(normalizedEmail, setupUrl, expiresAt);
        const text = buildEmailAdminInviteText(normalizedEmail, setupUrl, expiresAt);

        const sendRes = await sendEmail({
          to: normalizedEmail,
          subject: "Pannon Transfer – Meghívás az Email Admin Rendszerbe",
          html,
          text,
        });

        results.push({
          recipient,
          success: sendRes.success,
          error: sendRes.success ? null : sendRes.error || "Ismeretlen hiba",
          setupLink: setupUrl,
          expiresAt,
        });
      } catch (err) {
        console.error("[EmailAdmin Invite] Hiba:", recipient, err);
        results.push({
          recipient,
          success: false,
          error: err instanceof Error ? err.message : "Ismeretlen hiba",
          setupLink: null,
          expiresAt: null,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;
    const allOk = successCount === totalCount && totalCount > 0;

    return NextResponse.json({
      success: allOk,
      message: `${successCount}/${totalCount} meghívó elküldve.`,
      summary: { total: totalCount, success: successCount, failed: totalCount - successCount },
      results,
    });
  } catch (error) {
    console.error("[Email Admin Invite Send Route] Hiba:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Belső szerverhiba." },
      { status: 500 }
    );
  }
}
