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
  const expiresStr =
    new Date(expiresAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    }) + " (CET/CEST)";
  const year = new Date().getFullYear();

  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}
  const logoRow = origin
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:8px; padding:9px 14px;"><img src="${origin}/brand/pannon-transfer-logo.png" width="120" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:120px;"></td>
<td width="14"></td>
<td valign="middle" style="background:#FFFFFF; border-radius:8px; padding:7px 14px;"><img src="${origin}/partners/catl/logo.png" width="70" height="23" alt="CATL" style="display:block; border:0; height:23px; width:70px;"></td>
</tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr><td style="background:#FFFFFF; border-radius:8px; padding:9px 16px; font-size:16px; font-weight:900; color:#0047BA;">CATL</td></tr></table>`;

  const securityNote = requireTwoFactor
    ? "Two-factor authentication (2FA) is <strong>mandatory</strong> and will be set up right after you choose your password."
    : "You will sign in with your own password. Two-factor authentication (2FA) can be enabled on request.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>Invitation to the CATL Dedicated Portal</title>
</head>
<body style="margin:0; padding:0; background:#EEF1F6; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">You have been invited to the CATL dedicated booking portal operated by Pannon Transfer. Set your password to get started.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#EEF1F6"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">

<tr><td style="padding:0 6px 14px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:12px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:#64748B;">Pannon Transfer</td>
<td align="right" style="font-size:12px; color:#94A3B8;">Partner Portal Invitation</td>
</tr></table>
</td></tr>

<tr><td style="background:#FFFFFF; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,.08);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

<tr><td bgcolor="#0B1220" style="padding:38px 40px 34px 40px; border-bottom:4px solid #0047BA;">
${logoRow}
<div style="font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#60A5FA; margin-bottom:8px;">Dedicated Portal</div>
<div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; line-height:1.3; color:#FFFFFF;">You&rsquo;re invited to the<br>CATL Booking Portal</div>
</td></tr>

<tr><td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 16px 0; font-size:16px; font-weight:600; color:#0F172A;">Dear Partner,</p>
<p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#334155;">
Pannon Transfer has created a personal account for you on the dedicated CATL portal. Through it you can review your agreed rate structure, place transfer bookings and follow their status in one place.
</p>
<p style="margin:0 0 28px 0; font-size:15px; line-height:1.7; color:#334155;">
Please use the personal link below to choose your password and sign in for the first time.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#0047BA" style="border-radius:8px;">
<a href="${setupUrl}" style="display:inline-block; padding:16px 42px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:.6px; border-radius:8px;">Set your password &amp; sign in</a>
</td></tr></table>
</td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; margin-bottom:26px;"><tr>
<td width="50%" valign="top" style="padding:18px 20px; border-right:1px solid #E2E8F0;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#94A3B8; margin-bottom:6px;">Your account</div>
<div style="font-size:14px; font-weight:600; color:#0F172A; word-break:break-all;">${recipientEmail}</div>
</td>
<td width="50%" valign="top" style="padding:18px 20px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#94A3B8; margin-bottom:6px;">Link valid until</div>
<div style="font-size:14px; font-weight:600; color:#0F172A;">${expiresStr}</div>
</td>
</tr></table>

<p style="margin:0 0 30px 0; font-size:13px; line-height:1.7; color:#64748B;">
<strong style="color:#0F172A;">Security:</strong> ${securityNote} This link is personal and single-purpose &mdash; please do not forward or share it with anyone.
</p>
</td></tr>

<tr><td style="padding:0 40px 38px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E2E8F0;"><tr><td style="padding-top:24px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#94A3B8; margin-bottom:12px;">Your contact</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;">
<div style="width:46px; height:46px; line-height:46px; text-align:center; background:#0B1220; border-radius:23px; color:#FFFFFF; font-size:16px; font-weight:700;">BS</div>
</td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#475569;">
<div style="font-size:15px; font-weight:700; color:#0F172A;">Balog Sebastian M&aacute;t&eacute;</div>
<div>Developer, Pannon Transfer</div>
<div><a href="mailto:balogh.sebastian@pannonguard.hu" style="color:#0047BA; text-decoration:none;">balogh.sebastian@pannonguard.hu</a></div>
<div><a href="tel:+36306654135" style="color:#0047BA; text-decoration:none;">+36 30 665 4135</a></div>
</td>
</tr></table>
<p style="margin:14px 0 0 0; font-size:12px; line-height:1.6; color:#94A3B8;">Questions about your access or the portal? Just reply to this email or get in touch directly.</p>
</td></tr></table>
</td></tr>

<tr><td bgcolor="#F8FAFC" style="padding:24px 40px; border-top:1px solid #E2E8F0;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#94A3B8; text-align:center;">
This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.<br>
&copy; ${year} Pannon Transfer. All rights reserved.
</p>
</td></tr>

</table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    "PANNON TRANSFER - CATL DEDICATED PORTAL",
    "",
    "Dear Partner,",
    "",
    "Pannon Transfer has created a personal account for you on the dedicated CATL portal, where you can review your agreed rate structure, place transfer bookings and follow their status.",
    "",
    "Set your password and sign in using your personal link:",
    setupUrl,
    "",
    "Your account: " + recipientEmail,
    "Link valid until: " + expiresStr,
    requireTwoFactor
      ? "Security: Two-factor authentication (2FA) is mandatory and will be set up right after you choose your password."
      : "Security: You will sign in with your own password. Two-factor authentication (2FA) can be enabled on request.",
    "This link is personal - please do not forward or share it.",
    "",
    "YOUR CONTACT",
    "Balog Sebastian Máté - Developer, Pannon Transfer",
    "balogh.sebastian@pannonguard.hu",
    "+36 30 665 4135",
    "",
    "This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.",
    "© " + year + " Pannon Transfer. All rights reserved.",
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
          subject: "Invitation to the CATL Dedicated Portal – Pannon Transfer",
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
