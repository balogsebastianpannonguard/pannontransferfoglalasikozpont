import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetCatlInvite } from "@/lib/catl-portal-users";

export const dynamic = "force-dynamic";

function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number
) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F3F4F6"><tr><td align="center" style="padding:40px 15px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px; background:#FFFFFF; border-radius:12px; overflow:hidden;">
<tr><td bgcolor="#040914" style="padding:44px 40px; border-bottom:3px solid #0047BA;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;"><tr>
<td width="64" height="64" align="center" valign="middle" bgcolor="#FFFFFF" style="border-radius:14px;">
<span style="font-family:-apple-system, sans-serif; font-size:22px; font-weight:900; color:#0047BA;">CATL</span>
</td></tr></table>
<h1 style="margin:0 0 8px 0; font-family:Georgia, serif; color:#FFFFFF; font-size:26px; letter-spacing:.5px;">CATL Dedikált Portál</h1>
<p style="margin:0; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#60A5FA;">Pannon Transfer Partner</p>
</td></tr>
<tr><td style="padding:44px 40px;">
<h2 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:22px; color:#0F172A;">Kedves Partner!</h2>
<p style="margin:0 0 30px 0; font-size:15px; line-height:1.7; color:#475569;">
Meghívást kaptál a CATL dedikált portálra. Kizárólag az alábbi egyedi linken keresztül tudsz belépni és elérni az árstruktúrát és a foglalásokat.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:30px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#0047BA" style="border-radius:10px;">
<a href="${setupUrl}" style="display:inline-block; padding:18px 40px; font-size:14px; font-weight:800; color:#FFFFFF; text-decoration:none; letter-spacing:1.5px; text-transform:uppercase; border-radius:10px;">
Jelszó beállítása &amp; Belépés
</a>
</td></tr></table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0; margin-bottom:28px;"><tr>
<td width="50%" style="padding:20px 20px 20px 0; border-right:1px solid #E2E8F0;">
<p style="margin:0 0 6px 0; font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8;">Belépési fiók</p>
<p style="margin:0; font-size:14px; font-weight:700; color:#0F172A; word-break:break-all;">${recipientEmail}</p>
</td>
<td width="50%" style="padding:20px 0 20px 20px;">
<p style="margin:0 0 6px 0; font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8;">Link érvényessége</p>
<p style="margin:0; font-size:14px; font-weight:700; color:#0F172A;">${expiresStr}</p>
</td>
</tr></table>
<p style="margin:0; font-size:13px; line-height:1.6; color:#64748B;">
<strong style="color:#0F172A;">Biztonság:</strong> ${requireTwoFactor ? "A bejelentkezéshez <strong>kétfaktoros hitelesítés (2FA) kötelező</strong> lesz a jelszó beállítása után." : "A bejelentkezéshez jelszó szükséges, kérés esetén 2FA aktiválható."} Az egyedi link másokkal <strong>nem osztható meg</strong>.
</p>
</td></tr>
<tr><td bgcolor="#F8FAFC" style="padding:30px 40px; border-top:1px solid #E2E8F0;">
<p style="margin:0; font-size:11px; line-height:1.6; color:#94A3B8; text-align:center;">
Ezt az üzenetet a Pannon Transfer CATL Portál rendszere küldte. Ha nem kérted a meghívást, hagyd figyelmen kívül.<br>
© ${new Date().getFullYear()} Pannon Transfer. Minden jog fenntartva.
</p>
</td></tr>
</table></td></tr></table>
</body></html>
  `;

  const text = [
    "CATL Portál - Pannon Transfer",
    "",
    "Kedves Partner!",
    "",
    "Meghívást kaptál a CATL dedikált portálra. Kizárólag az alábbi linken keresztül tudsz belépni:",
    setupUrl,
    "",
    "Belépési fiókod: " + recipientEmail,
    "Link érvényessége: " + expiresStr,
    requireTwoFactor
      ? "FONTOS: Kétfaktoros hitelesítés (2FA) kötelező a bejelentkezéshez."
      : "2FA opcionális, de ajánlott bekapcsolni.",
    "",
    "Pannon Transfer - Ügyvezető: Balog Sebastian Máté",
  ].join("\n");

  return { html, text };
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipients, requireTwoFactor, loginBaseUrl } = body || {};

    if (!recipients) {
      return NextResponse.json({ success: false, message: "Hiányzó címzettek" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientList: string[] = (Array.isArray(recipients) ? recipients : [recipients])
      .map((r) => String(r).trim())
      .filter(Boolean);

    for (const email of recipientList) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: "Érvénytelen email: " + email },
          { status: 400 }
        );
      }
    }

    if (recipientList.length === 0) {
      return NextResponse.json({ success: false, message: "Nincs címzett" }, { status: 400 });
    }

    const smtp = await testSmtpConnection();
    if (!smtp.success) {
      console.warn("[SMTP] CATL invite: SMTP nem érhető el (teszt mód).", smtp.message);
    }

    let finalBase =
      typeof loginBaseUrl === "string" && loginBaseUrl.trim()
        ? loginBaseUrl.trim().replace(/\/$/, "")
        : "";

    // Safety: ha a kapott base URL localhost-on 3000-es portot használ
    // (pl. CRM port), akkor a CATL partner oldal 3001-es portra kell mutasson
    if (finalBase) {
      try {
        const u = new URL(finalBase);
        if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") && u.port === "3000") {
          u.port = "3001";
          finalBase = u.origin;
        }
      } catch {}
    }

    const setupPath = "/catl/setup-password";

    type R = {
      recipient: string;
      success: boolean;
      error: string | null;
      setupLink: string | null;
      expiresAt: number | null;
    };
    const results: R[] = [];

    for (const recipient of recipientList) {
      try {
        const { user, rawToken } = await createOrResetCatlInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== CATL INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("================================\n");

        const { html, text } = buildInviteEmail(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject: "Meghívás a CATL Dedikált Portálra – Pannon Transfer",
          html,
          text,
        });

        results.push({
          recipient,
          success: sendRes.success,
          error: sendRes.success ? null : sendRes.error || "Ismeretlen hiba",
          setupLink: setupUrl,
          expiresAt: user.inviteExpiresAt,
        });
      } catch (err) {
        results.push({
          recipient,
          success: false,
          error: err instanceof Error ? err.message : "Hiba",
          setupLink: null,
          expiresAt: null,
        });
      }
    }

    const ok = results.filter((r) => r.success).length;
    return NextResponse.json({
      success: ok === results.length,
      message: `${ok}/${results.length} meghívó elküldve.`,
      results,
      summary: { total: results.length, success: ok, failed: results.length - ok },
    });
  } catch (error) {
    console.error("[catl-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
