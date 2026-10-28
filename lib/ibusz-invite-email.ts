/**
 * IBUSZ Hungary Kft. – meghívó e-mail sablon (kétnyelvű: magyar + angol).
 * A levélkeret a pannontransferpartnercegek/lib/ibusz-email-layout.ts másolata
 * (a két alkalmazás külön repó, ezért itt önállóan él).
 */

export const IBUSZ_CONTACT = {
  name: "Balog Sebastian Máté",
  email: "balogh.sebastian@pannonguard.hu",
  phone: "+36 30 665 4135",
  phoneHref: "+36306654135",
};

const BLUE = "#004A8D";
const BLUE_DARK = "#00386B";
const SKY = "#0C6BB5";
const ORANGE = "#F39200";
const ORANGE_SOFT = "#FFF3DF";
const BLUE_SOFT = "#E8F1FA";
const INK = "#0F2238";

export function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ibuszButton(href: string, label: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${BLUE}" style="border-radius:999px; background:linear-gradient(90deg,${BLUE},${SKY});">
<a href="${href}" style="display:inline-block; padding:16px 38px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:.4px; border-radius:999px;">${label} &rarr;</a>
</td></tr></table></td></tr></table>`;
}

export function ibuszInfoRow(
  left: { label: string; value: string },
  right: { label: string; value: string },
) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BLUE_SOFT}; border:1px solid #D3E3F3; border-radius:14px; margin-bottom:22px;"><tr>
<td width="50%" valign="top" style="padding:16px 20px; border-right:1px solid #D3E3F3;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#5D7692; margin-bottom:6px;">${esc(left.label)}</div>
<div style="font-size:14px; font-weight:700; color:${INK}; word-break:break-all;">${esc(left.value)}</div>
</td>
<td width="50%" valign="top" style="padding:16px 20px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#5D7692; margin-bottom:6px;">${esc(right.label)}</div>
<div style="font-size:14px; font-weight:700; color:${INK};">${esc(right.value)}</div>
</td></tr></table>`;
}

/** Hungarian block, a divider, then the English block. */
export function ibuszBilingual(huHtml: string, enHtml: string) {
  return `${huHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 26px 0;"><tr>
<td style="border-top:1px solid #E1E8F0; font-size:0; line-height:0;" width="42%">&nbsp;</td>
<td align="center" style="padding:0 12px; white-space:nowrap;"><span style="display:inline-block; font-size:10px; font-weight:800; letter-spacing:2.2px; color:${ORANGE}; text-transform:uppercase;">English</span></td>
<td style="border-top:1px solid #E1E8F0; font-size:0; line-height:0;" width="42%">&nbsp;</td>
</tr></table>
${enHtml}`;
}

export function ibuszContactBlock(lang: "hu" | "en" | "both") {
  const title =
    lang === "hu" ? "Kapcsolattartó" : lang === "en" ? "Your contact" : "Kapcsolattartó · Your contact";
  const role = lang === "hu" ? "Fejlesztő, Pannon Transfer" : lang === "en" ? "Developer, Pannon Transfer" : "Fejlesztő / Developer, Pannon Transfer";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E1E8F0;"><tr><td style="padding-top:22px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#8497AD; margin-bottom:12px;">${title}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;"><div style="width:46px; height:46px; line-height:46px; text-align:center; background:${BLUE}; border-radius:23px; color:#FFFFFF; font-size:15px; font-weight:700; border:3px solid ${ORANGE_SOFT};">BS</div></td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#4B5F76;">
<div style="font-size:15px; font-weight:700; color:${INK};">${IBUSZ_CONTACT.name}</div>
<div>${role}</div>
<div><a href="mailto:${IBUSZ_CONTACT.email}" style="color:${BLUE}; text-decoration:none;">${IBUSZ_CONTACT.email}</a></div>
<div><a href="tel:${IBUSZ_CONTACT.phoneHref}" style="color:${BLUE}; text-decoration:none;">${IBUSZ_CONTACT.phone}</a></div>
</td></tr></table>
</td></tr></table>`;
}

export type IbuszFooterKind = "invite" | "welcome" | "booking-hu" | "booking-en";

function footerHtml(kind: IbuszFooterKind, year: number) {
  const hu =
    kind === "invite"
      ? "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül."
      : "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte.";
  const en =
    kind === "invite"
      ? "This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it."
      : "This message was sent by the Pannon Transfer Komplex system.";
  if (kind === "booking-hu") {
    return `${hu}<br>&copy; ${year} Pannon Transfer. Minden jog fenntartva.`;
  }
  if (kind === "booking-en") {
    return `${en}<br>&copy; ${year} Pannon Transfer. All rights reserved.`;
  }
  return `${hu}<br>${en}<br>&copy; ${year} Pannon Transfer. Minden jog fenntartva. / All rights reserved.`;
}

/**
 * IBUSZ arculatú levélkeret. `origin` – abszolút URL a logókhoz (üres: szöveges tartalék).
 */
export function ibuszEmailShell(opts: {
  origin: string;
  lang: "hu" | "en" | "both";
  preheader: string;
  eyebrow: string;
  headline: string;
  bodyHtml: string;
  topRight?: string;
  footerKind: IbuszFooterKind;
}) {
  const year = new Date().getFullYear();
  const origin = opts.origin.replace(/\/$/, "");
  const ptLogo = origin ? `${origin}/brand/pannon-transfer-logo.png` : "";
  const ibLogo = origin ? `${origin}/partners/ibusz/logo.png` : "";

  const logos =
    ptLogo && ibLogo
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:10px; padding:9px 14px;"><img src="${ptLogo}" width="116" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:116px;"></td>
<td width="12" style="color:rgba(255,255,255,.55); text-align:center; font-size:16px;">&times;</td>
<td valign="middle" style="background:#FFFFFF; border-radius:10px; padding:6px 14px;"><img src="${ibLogo}" width="68" height="24" alt="IBUSZ" style="display:block; border:0; height:24px; width:68px;"></td>
</tr></table>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr><td style="background:#FFFFFF; border-radius:10px; padding:9px 16px; font-size:16px; font-weight:900; color:${BLUE};">IBUSZ</td></tr></table>`;

  const htmlLang = opts.lang === "en" ? "en" : "hu";

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${esc(opts.headline.replace(/<[^>]+>/g, " ").replace(/&rsquo;/g, "’"))}</title>
</head>
<body style="margin:0; padding:0; background:#EDF2F8; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${esc(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#EDF2F8"><tr><td align="center" style="padding:34px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;">
<tr><td style="padding:0 8px 14px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:12px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:#5D7692;">Pannon Transfer</td>
<td align="right" style="font-size:12px; color:#8497AD;">${esc(opts.topRight || "IBUSZ Hungary Kft.")}</td>
</tr></table>
</td></tr>
<tr><td style="background:#FFFFFF; border-radius:18px; overflow:hidden; box-shadow:0 2px 10px rgba(15,34,56,.08);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="${BLUE}" style="background:${BLUE}; background-image:linear-gradient(135deg,${BLUE_DARK} 0%,${BLUE} 55%,${SKY} 100%); padding:34px 40px 30px 40px; position:relative;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="top">
${logos}
<div style="font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#FFC24D; margin-bottom:8px;">${esc(opts.eyebrow)}</div>
<div style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.28; color:#FFFFFF;">${opts.headline}</div>
</td>
<td width="86" valign="top" align="right" style="padding-left:12px;"><div style="width:76px; height:76px; border-radius:38px; background:${ORANGE}; background-image:radial-gradient(circle at 35% 35%,#FFC24D,${ORANGE} 70%); box-shadow:0 0 0 10px rgba(255,194,77,.18), 0 0 0 22px rgba(255,194,77,.09);"></div></td>
</tr></table>
</td></tr>
<tr><td height="5" style="height:5px; line-height:5px; font-size:0; background:${ORANGE};">&nbsp;</td></tr>
<tr><td style="padding:36px 40px 6px 40px;">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:0 40px 36px 40px;">
${ibuszContactBlock(opts.lang)}
</td></tr>
<tr><td bgcolor="#F6F9FC" style="padding:22px 40px; border-top:1px solid #E1E8F0;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#8497AD; text-align:center;">
${footerHtml(opts.footerKind, year)}
</p>
</td></tr>
</table></td></tr>
</table>
</td></tr></table>
</body></html>`;
}


export function buildIbuszInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number,
) {
  const dt = new Date(expiresAt);
  const huDate = dt.toLocaleString("hu-HU", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Budapest",
  });
  const enDate = dt.toLocaleString("en-GB", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Budapest",
  });
  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}

  const huBody = `
<p style="margin:0 0 14px 0; font-size:16px; font-weight:600; color:${INK};">Kedves Partnerünk!</p>
<p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#3C5068;">
A Pannon Transfer személyes fiókot hozott létre Önnek az IBUSZ dedikált foglalási portálján. A portálon áttekintheti az egyeztetett díjakat, transzfert foglalhat, és egy helyen követheti az összes foglalását.
</p>
<p style="margin:0 0 24px 0; font-size:15px; line-height:1.7; color:#3C5068;">
Kérjük, az alábbi személyes linken állítsa be a jelszavát, és lépjen be először.
</p>
${ibuszButton(setupUrl, "Jelszó beállítása és belépés")}
${ibuszInfoRow({ label: "Belépési fiók", value: recipientEmail }, { label: "A link érvényes eddig", value: huDate })}
<p style="margin:0; font-size:13px; line-height:1.7; color:#6B7F96;">
<strong style="color:${INK};">Biztonság:</strong> ${
    requireTwoFactor
      ? "a fiókhoz kétfaktoros hitelesítés (2FA) <strong>kötelező</strong>, amelyet a jelszó megadása után azonnal beállíthat."
      : "a belépés saját jelszóval történik, a kétfaktoros hitelesítés (2FA) kérésre bekapcsolható."
  } A link személyes és egyszeri célú – kérjük, ne továbbítsa és ne ossza meg senkivel.
</p>`;

  const enBody = `
<p style="margin:0 0 14px 0; font-size:16px; font-weight:600; color:${INK};">Dear Partner,</p>
<p style="margin:0 0 14px 0; font-size:15px; line-height:1.7; color:#3C5068;">
Pannon Transfer has created a personal account for you on the dedicated IBUSZ booking portal. Through it you can review your agreed rate structure, place transfer bookings and follow their status in one place.
</p>
<p style="margin:0 0 24px 0; font-size:15px; line-height:1.7; color:#3C5068;">
Please use the personal link below to choose your password and sign in for the first time.
</p>
${ibuszButton(setupUrl, "Set your password &amp; sign in")}
${ibuszInfoRow({ label: "Your account", value: recipientEmail }, { label: "Link valid until", value: enDate + " (CET/CEST)" })}
<p style="margin:0; font-size:13px; line-height:1.7; color:#6B7F96;">
<strong style="color:${INK};">Security:</strong> ${
    requireTwoFactor
      ? "two-factor authentication (2FA) is <strong>mandatory</strong> for this account and is set up right after you choose your password."
      : "you will sign in with your own password; two-factor authentication (2FA) can be enabled on request."
  } This link is personal and single-purpose &mdash; please do not forward or share it.
</p>`;

  const html = ibuszEmailShell({
    origin,
    lang: "both",
    preheader:
      "Meghívó az IBUSZ dedikált foglalási portálra. / Invitation to the dedicated IBUSZ booking portal.",
    eyebrow: "Meghívó · Invitation",
    headline: "Meghívó az<br>IBUSZ foglalási portálra",
    bodyHtml: ibuszBilingual(huBody, enBody),
    topRight: "IBUSZ Hungary Kft.",
    footerKind: "invite",
  });

  const year = new Date().getFullYear();
  const text = [
    "PANNON TRANSFER x IBUSZ HUNGARY KFT. - MEGHÍVÓ / INVITATION",
    "",
    "Kedves Partnerünk!",
    "A Pannon Transfer személyes fiókot hozott létre Önnek az IBUSZ dedikált foglalási portálján.",
    "Jelszó beállítása és belépés:",
    setupUrl,
    "Belépési fiók: " + recipientEmail,
    "A link érvényes eddig: " + huDate,
    requireTwoFactor
      ? "Biztonság: a fiókhoz kétfaktoros hitelesítés (2FA) kötelező."
      : "Biztonság: a kétfaktoros hitelesítés (2FA) kérésre bekapcsolható.",
    "A link személyes - kérjük, ne továbbítsa.",
    "",
    "----------------------------------------",
    "Dear Partner,",
    "Pannon Transfer has created a personal account for you on the dedicated IBUSZ booking portal.",
    "Set your password and sign in:",
    setupUrl,
    "Your account: " + recipientEmail,
    "Link valid until: " + enDate + " (CET/CEST)",
    requireTwoFactor
      ? "Security: two-factor authentication (2FA) is mandatory for this account."
      : "Security: two-factor authentication (2FA) can be enabled on request.",
    "This link is personal - please do not forward or share it.",
    "",
    `${IBUSZ_CONTACT.name} - Fejlesztő / Developer, Pannon Transfer`,
    IBUSZ_CONTACT.email,
    IBUSZ_CONTACT.phone,
    "",
    "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül.",
    "This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.",
    `© ${year} Pannon Transfer. Minden jog fenntartva. / All rights reserved.`,
  ].join("\n");

  return { html, text };
}
