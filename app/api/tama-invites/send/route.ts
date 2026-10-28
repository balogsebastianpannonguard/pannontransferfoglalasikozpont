import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetTamaInvite } from "@/lib/tama-portal-users";

export const dynamic = "force-dynamic";

const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif";
const SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";

function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number
) {
  const year = new Date().getFullYear();
  const expiresHu = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Budapest",
  }).format(new Date(expiresAt));
  const expiresEn =
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    }).format(new Date(expiresAt)) + " (CET/CEST)";

  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}

  const logos = origin
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="background:#FFFFFF; border:1px solid #E4DDC7; border-radius:999px; padding:9px 16px;"><img src="${origin}/brand/pannon-transfer-logo.png" width="116" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:116px;"></td>
<td width="12"></td>
<td valign="middle" style="padding:0 4px;"><img src="${origin}/partners/tama/logo.png" width="62" height="24" alt="TAMA Hungary Kft." style="display:block; border:0; height:24px; width:62px;"></td>
</tr></table>`
    : `<div style="font-family:${SANS}; font-size:16px; font-weight:800; color:#5F8016; letter-spacing:1px;">TAMA</div>`;

  const p = (html: string, mb = 14) =>
    `<p style="margin:0 0 ${mb}px 0; font-family:${SANS}; font-size:15px; line-height:1.7; color:#3B4530;">${html}</p>`;
  const infoRow = (l: { label: string; value: string }, r: { label: string; value: string }) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF8EC; border:1px solid #EEE5C6; border-radius:16px; margin-bottom:22px;"><tr>
<td width="50%" valign="top" style="padding:16px 18px; border-right:1px solid #EEE5C6;">
<div style="font-family:${SANS}; font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#8B917D; margin-bottom:6px;">${l.label}</div>
<div style="font-family:${SANS}; font-size:14px; font-weight:600; color:#26301B; word-break:break-all;">${l.value}</div>
</td>
<td width="50%" valign="top" style="padding:16px 18px;">
<div style="font-family:${SANS}; font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#8B917D; margin-bottom:6px;">${r.label}</div>
<div style="font-family:${SANS}; font-size:14px; font-weight:600; color:#26301B;">${r.value}</div>
</td></tr></table>`;
  const button = (label: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#5F8016" style="border-radius:999px;">
<a href="${setupUrl}" style="display:inline-block; padding:16px 44px; font-family:${SANS}; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:.5px; border-radius:999px;">${label}</a>
</td></tr></table></td></tr></table>`;

  const secHu = requireTwoFactor
    ? "A kétfaktoros hitelesítés (2FA) <strong>kötelező</strong>: a jelszó megadása után rögtön beállítjuk."
    : "A belépés saját jelszóval történik; kérésre kétfaktoros hitelesítés (2FA) is bekapcsolható.";
  const secEn = requireTwoFactor
    ? "Two-factor authentication (2FA) is <strong>mandatory</strong> and will be set up right after you choose your password."
    : "You will sign in with your own password. Two-factor authentication (2FA) can be enabled on request.";

  const huBlock = `
${p('<strong style="color:#26301B;">Kedves Partnerünk!</strong>', 12)}
${p("A Pannon Transfer személyes fiókot hozott létre Önnek a <strong>TAMA Hungary Kft.</strong> dedikált foglalási portálján. Itt megtekintheti a megállapodott árakat, transzfert foglalhat, és egy helyen követheti az összes foglalását.", 14)}
${p("Kérjük, az alábbi személyes linken válasszon jelszót, és lépjen be először.", 18)}
${button("Jelszó beállítása és belépés")}
${infoRow({ label: "Az Ön fiókja", value: recipientEmail }, { label: "A link érvényes eddig", value: expiresHu })}
${p(`<strong style="color:#26301B;">Biztonság:</strong> ${secHu} A link személyes és egyszeri célú – kérjük, ne ossza meg senkivel.`, 6)}`;

  const enBlock = `
${p('<strong style="color:#26301B;">Dear Partner,</strong>', 12)}
${p("Pannon Transfer has created a personal account for you on the dedicated <strong>TAMA Hungary Kft.</strong> booking portal. There you can review your agreed rates, book transfers and follow every booking in one place.", 14)}
${p("Please use the personal button above to choose your password and sign in for the first time.", 14)}
${infoRow({ label: "Your account", value: recipientEmail }, { label: "Link valid until", value: expiresEn })}
${p(`<strong style="color:#26301B;">Security:</strong> ${secEn} This link is personal and single-purpose — please do not forward or share it.`, 6)}`;

  const divider = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 24px 0;"><tr>
<td style="border-top:1px solid #E4DDC7;" width="40%"></td>
<td align="center" style="padding:0 12px; font-family:${SANS}; font-size:10px; font-weight:700; letter-spacing:2px; color:#C9A24D; white-space:nowrap;">ENGLISH</td>
<td style="border-top:1px solid #E4DDC7;" width="40%"></td></tr></table>`;

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>Meghívás a TAMA portálra · Invitation to the TAMA portal</title>
</head>
<body style="margin:0; padding:0; background:#F1EDDD; font-family:${SANS}; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">Meghívást kapott a TAMA Hungary Kft. dedikált foglalási portáljára. / You have been invited to the dedicated TAMA Hungary Kft. booking portal.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F1EDDD"><tr><td align="center" style="padding:34px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;">
<tr><td style="background:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 2px 10px rgba(70,80,30,.10);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

<tr><td bgcolor="#FBF9F3" style="padding:22px 36px; border-bottom:1px solid #EEE5C6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle">${logos}</td>
<td valign="middle" align="right" style="font-family:${SANS}; font-size:11px; color:#8B917D; letter-spacing:.4px;">Meghívó · Invitation</td>
</tr></table>
</td></tr>

<tr><td bgcolor="#4B6A0E" style="padding:38px 40px 34px 40px; border-bottom:4px solid #C9A24D;">
<div style="font-family:${SANS}; font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#CFDDA0; margin-bottom:10px;">Dedikált portál · Dedicated portal</div>
<div style="font-family:${SERIF}; font-size:28px; line-height:1.25; color:#FFFFFF;">Meghívás a TAMA<br>foglalási portálra</div>
<div style="font-family:${SERIF}; font-size:16px; line-height:1.4; color:#DDE8B8; margin-top:8px; font-style:italic;">You&rsquo;re invited to the TAMA booking portal</div>
</td></tr>

<tr><td style="padding:36px 40px 6px 40px;">
${huBlock}${divider}${enBlock}
</td></tr>

<tr><td style="padding:0 40px 36px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EEE5C6;"><tr><td style="padding-top:22px;">
<div style="font-family:${SANS}; font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#8B917D; margin-bottom:12px;">Az Ön kapcsolattartója · Your contact</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;"><div style="width:46px; height:46px; line-height:46px; text-align:center; background:#4B6A0E; border-radius:23px; color:#FFFFFF; font-family:${SANS}; font-size:16px; font-weight:700;">BS</div></td>
<td valign="top" style="padding-left:14px; font-family:${SANS}; font-size:13px; line-height:1.65; color:#5B6450;">
<div style="font-size:15px; font-weight:700; color:#26301B;">Balog Sebastian M&aacute;t&eacute;</div>
<div>Fejlesztő / Developer, Pannon Transfer</div>
<div><a href="mailto:balogh.sebastian@pannonguard.hu" style="color:#4B6A0E; text-decoration:none;">balogh.sebastian@pannonguard.hu</a></div>
<div><a href="tel:+36306654135" style="color:#4B6A0E; text-decoration:none;">+36 30 665 4135</a></div>
</td></tr></table>
</td></tr></table>
</td></tr>

<tr><td bgcolor="#F6F2E4" style="padding:22px 40px; border-top:1px solid #EEE5C6;">
<p style="margin:0; font-family:${SANS}; font-size:11px; line-height:1.7; color:#8B917D; text-align:center;">
Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül.<br>
This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.<br>
&copy; ${year} Pannon Transfer. Minden jog fenntartva. / All rights reserved.
</p>
</td></tr>

</table></td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    "PANNON TRANSFER – TAMA HUNGARY KFT. DEDIKÁLT PORTÁL",
    "",
    "Kedves Partnerünk!",
    "A Pannon Transfer személyes fiókot hozott létre Önnek a TAMA Hungary Kft. dedikált foglalási portálján.",
    "Jelszó beállítása és belépés (személyes link):",
    setupUrl,
    "",
    "Az Ön fiókja: " + recipientEmail,
    "A link érvényes eddig: " + expiresHu,
    requireTwoFactor ? "A kétfaktoros hitelesítés (2FA) kötelező." : "A 2FA kérésre bekapcsolható.",
    "",
    "----- ENGLISH -----",
    "Dear Partner,",
    "Pannon Transfer has created a personal account for you on the dedicated TAMA Hungary Kft. booking portal.",
    "Set your password and sign in (personal link):",
    setupUrl,
    "",
    "Your account: " + recipientEmail,
    "Link valid until: " + expiresEn,
    requireTwoFactor ? "Two-factor authentication (2FA) is mandatory." : "2FA can be enabled on request.",
    "",
    "Balog Sebastian Máté – Fejlesztő / Developer, Pannon Transfer",
    "balogh.sebastian@pannonguard.hu · +36 30 665 4135",
    "",
    "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. / This message was sent by the Pannon Transfer Komplex system.",
    `© ${year} Pannon Transfer.`,
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
      console.warn("[SMTP] TAMA Hungary Kft. invite: SMTP nem érhető el (teszt mód).", smtp.message);
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

    const setupPath = "/tama/setup-password";

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
        const { user, rawToken } = await createOrResetTamaInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== TAMA INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("==============================\n");

        const { html, text } = buildInviteEmail(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject: "Meghívás a TAMA portálra · Invitation to the TAMA portal – Pannon Transfer",
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
    console.error("[tama-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
