import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetSchaefflerDebrecenInvite } from "@/lib/schaefflerdebrecen-portal-users";

export const dynamic = "force-dynamic";

function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number
) {
  const fmt = (locale: string) =>
    new Date(expiresAt).toLocaleString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    });
  const expiresHu = fmt("hu-HU");
  const expiresEn = fmt("en-GB") + " (CET/CEST)";
  const year = new Date().getFullYear();
  const GREEN = "#00893D";
  const FOREST = "#0B3D2A";

  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}
  const logoRow = origin
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:8px; padding:9px 14px;"><img src="${origin}/brand/pannon-transfer-logo.png" width="120" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:120px;"></td>
<td width="14"></td>
<td valign="middle" style="background:#FFFFFF; border-radius:8px; padding:8px 14px;"><img src="${origin}/partners/schaefflerdebrecen/logo.png" width="96" height="24" alt="Schaeffler" style="display:block; border:0; height:24px; width:96px;"></td>
</tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr><td style="background:#FFFFFF; border-radius:8px; padding:9px 16px; font-size:15px; font-weight:800; color:${GREEN}; letter-spacing:1px;">SCHAEFFLER</td></tr></table>`;

  const securityHu = requireTwoFactor
    ? "A belépéshez <strong>kétfaktoros hitelesítés (2FA) kötelező</strong>, amelyet a jelszó megadása után azonnal beállíthat."
    : "A belépés saját jelszóval történik; kérésre kétfaktoros hitelesítés (2FA) is bekapcsolható.";
  const securityEn = requireTwoFactor
    ? "Two-factor authentication (2FA) is <strong>mandatory</strong> and will be set up right after you choose your password."
    : "You will sign in with your own password. Two-factor authentication (2FA) can be enabled on request.";

  const infoRow = (l1: string, v1: string, l2: string, v2: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F8F4; border:1px solid #D9EBE0; border-radius:10px; margin-bottom:22px;"><tr>
<td width="58%" valign="top" style="padding:16px 18px; border-right:1px solid #D9EBE0;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#6F8C7C; margin-bottom:5px;">${l1}</div>
<div style="font-size:14px; font-weight:600; color:#0E1A14; word-break:break-word; overflow-wrap:anywhere;">${v1}</div>
</td>
<td width="42%" valign="top" style="padding:16px 18px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#6F8C7C; margin-bottom:5px;">${l2}</div>
<div style="font-size:14px; font-weight:600; color:#0E1A14;">${v2}</div>
</td></tr></table>`;

  const button = (label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${GREEN}" style="border-radius:8px;">
<a href="${setupUrl}" style="display:inline-block; padding:16px 40px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:.5px; border-radius:8px;">${label}</a>
</td></tr></table></td></tr></table>`;

  const huBlock = `
<p style="margin:0 0 14px 0; font-size:16px; font-weight:600; color:#0E1A14;">Kedves Partnerünk!</p>
<p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#334155;">
A Pannon Transfer személyes fiókot hozott létre Önnek a dedikált Schaeffler Debrecen portálon. Itt áttekintheti a megállapodott díjszabást, transzfert foglalhat, és egy helyen követheti az összes foglalását.
</p>
<p style="margin:0 0 22px 0; font-size:15px; line-height:1.7; color:#334155;">
Kérjük, az alábbi személyes linken állítsa be a jelszavát, és lépjen be először.
</p>
${button("Jelszó beállítása és belépés")}
${infoRow("Az Ön fiókja", recipientEmail, "A link érvényes eddig", expiresHu)}
<p style="margin:0 0 22px 0; font-size:13px; line-height:1.7; color:#64748B;">
<strong style="color:#0E1A14;">Biztonság:</strong> ${securityHu} A link személyes és egyszer használatos &mdash; kérjük, ne továbbítsa és ne ossza meg senkivel.
</p>`;

  const enBlock = `
<p style="margin:0 0 14px 0; font-size:16px; font-weight:600; color:#0E1A14;">Dear Partner,</p>
<p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#334155;">
Pannon Transfer has created a personal account for you on the dedicated Schaeffler Debrecen portal. Through it you can review your agreed rate structure, place transfer bookings and follow their status in one place.
</p>
<p style="margin:0 0 22px 0; font-size:15px; line-height:1.7; color:#334155;">
Please use the personal link above to choose your password and sign in for the first time.
</p>
${infoRow("Your account", recipientEmail, "Link valid until", expiresEn)}
<p style="margin:0 0 28px 0; font-size:13px; line-height:1.7; color:#64748B;">
<strong style="color:#0E1A14;">Security:</strong> ${securityEn} This link is personal and single-purpose &mdash; please do not forward or share it with anyone.
</p>`;

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>Meghívó · Invitation – Schaeffler Debrecen</title>
</head>
<body style="margin:0; padding:0; background:#EEF3EF; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">Meghívást kapott a Schaeffler Debrecen dedikált portálra. · You have been invited to the dedicated Schaeffler Debrecen portal.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#EEF3EF"><tr><td align="center" style="padding:34px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">

<tr><td style="padding:0 6px 14px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:12px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:#5F7469;">Pannon Transfer</td>
<td align="right" style="font-size:12px; color:#8AA095;">Partnerportál · Partner portal</td>
</tr></table>
</td></tr>

<tr><td style="background:#FFFFFF; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(11,61,42,.10);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

<tr><td bgcolor="${FOREST}" style="padding:32px 40px 30px 40px; border-bottom:4px solid ${GREEN};">
${logoRow}
<div style="font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#7BE0A6; margin-bottom:9px;">Meghívó · Invitation</div>
<div style="font-size:25px; line-height:1.28; font-weight:600; color:#FFFFFF; letter-spacing:-0.2px;">Meghívjuk a Schaeffler Debrecen portálra<br><span style="font-weight:400; color:#BFE9D0;">You&rsquo;re invited to the Schaeffler Debrecen portal</span></div>
</td></tr>

<tr><td style="padding:36px 40px 8px 40px;">
${huBlock}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;"><tr>
<td style="border-top:1px solid #E3E9E5; height:1px; font-size:0; line-height:0;">&nbsp;</td>
<td width="1" style="white-space:nowrap; padding:0 12px; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#8AA095;">English</td>
<td style="border-top:1px solid #E3E9E5; height:1px; font-size:0; line-height:0;">&nbsp;</td>
</tr></table>
${enBlock}
</td></tr>

<tr><td style="padding:0 40px 36px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E3E9E5;"><tr><td style="padding-top:22px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#8AA095; margin-bottom:12px;">Kapcsolat · Your contact</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;"><div style="width:46px; height:46px; line-height:46px; text-align:center; background:${FOREST}; border-radius:23px; color:#FFFFFF; font-size:16px; font-weight:700;">BS</div></td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#4A5D53;">
<div style="font-size:15px; font-weight:700; color:#0E1A14;">Balog Sebastian M&aacute;t&eacute;</div>
<div>Fejlesztő · Developer, Pannon Transfer</div>
<div><a href="mailto:balogh.sebastian@pannonguard.hu" style="color:${GREEN}; text-decoration:none;">balogh.sebastian@pannonguard.hu</a></div>
<div><a href="tel:+36306654135" style="color:${GREEN}; text-decoration:none;">+36 30 665 4135</a></div>
</td></tr></table>
<p style="margin:14px 0 0 0; font-size:12px; line-height:1.6; color:#8AA095;">Kérdése van a hozzáféréssel kapcsolatban? Válaszoljon erre a levélre, vagy keressen közvetlenül. · Questions about your access? Just reply to this email or get in touch directly.</p>
</td></tr></table>
</td></tr>

<tr><td bgcolor="#F5F8F6" style="padding:22px 40px; border-top:1px solid #E3E9E5;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#8AA095; text-align:center;">
Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem Ön kérte a meghívást, kérjük, hagyja figyelmen kívül.<br>
This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.<br>
&copy; ${year} Pannon Transfer. Minden jog fenntartva. · All rights reserved.
</p>
</td></tr>

</table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    "SCHAEFFLER DEBRECEN – DEDIKÁLT PORTÁL / DEDICATED PORTAL",
    "",
    "Kedves Partnerünk!",
    "A Pannon Transfer személyes fiókot hozott létre Önnek a dedikált Schaeffler Debrecen portálon.",
    "Jelszó beállítása és belépés:",
    setupUrl,
    "",
    "Fiók: " + recipientEmail,
    "A link érvényes eddig: " + expiresHu,
    requireTwoFactor ? "Fontos: a kétfaktoros hitelesítés (2FA) kötelező." : "A 2FA kérésre bekapcsolható.",
    "A link személyes, kérjük, ne ossza meg senkivel.",
    "",
    "-----",
    "Dear Partner,",
    "Pannon Transfer has created a personal account for you on the dedicated Schaeffler Debrecen portal.",
    "Set your password and sign in using the link above.",
    "Account: " + recipientEmail,
    "Link valid until: " + expiresEn,
    requireTwoFactor ? "Important: two-factor authentication (2FA) is mandatory." : "2FA can be enabled on request.",
    "This link is personal – please do not share it.",
    "",
    "Balog Sebastian Máté – Fejlesztő / Developer, Pannon Transfer",
    "balogh.sebastian@pannonguard.hu · +36 30 665 4135",
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
      console.warn("[SMTP] Schaeffler Debrecen invite: SMTP nem érhető el (teszt mód).", smtp.message);
    }

    let finalBase =
      typeof loginBaseUrl === "string" && loginBaseUrl.trim()
        ? loginBaseUrl.trim().replace(/\/$/, "")
        : "";

    if (finalBase) {
      try {
        const u = new URL(finalBase);
        if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") && u.port === "3000") {
          u.port = "3001";
          finalBase = u.origin;
        }
      } catch {}
    }

    const setupPath = "/schaefflerdebrecen/setup-password";

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
        const { user, rawToken } = await createOrResetSchaefflerDebrecenInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== SCHAEFFLERDEBRECEN INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("====================================\n");

        const { html, text } = buildInviteEmail(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject: "Meghívó a Schaeffler Debrecen portálra · Invitation to the Schaeffler Debrecen portal – Pannon Transfer",
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
    console.error("[schaefflerdebrecen-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
