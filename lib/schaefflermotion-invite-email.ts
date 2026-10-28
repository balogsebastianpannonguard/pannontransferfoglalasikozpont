/**
 * Schaeffler Motion invitation e-mail (bilingual HU + EN). The e-mail shell mirrors
 * pannontransferpartnercegek/lib/schaefflermotion-email-layout.ts; the logo images are
 * served by the partner portal app (absolute URLs derived from the setup link origin).
 */

/**
 * Schaeffler Motion e-mail design: graphite header with Schaeffler-green signal bar,
 * monospace technical labels, dark contact footer. All markup is table based and inline
 * styled so it renders consistently in Outlook, Gmail and Apple Mail.
 */

export const MX_CONTACT = {
  name: "Balog Sebastian Máté",
  roleHu: "Fejlesztő, Pannon Transfer",
  roleEn: "Developer, Pannon Transfer",
  email: "balogh.sebastian@pannonguard.hu",
  phone: "+36 30 665 4135",
  phoneHref: "+36306654135",
};

export type MxMailLang = "hu" | "en";

const GREEN = "#00893D";
const NEON = "#3DDC84";
const GRAPHITE = "#0E1412";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

export function mxEsc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mxMailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0;"><tr>
<td bgcolor="${GREEN}" style="border-radius:5px;">
<a href="${href}" style="display:inline-block; padding:16px 36px; font-family:${MONO}; font-size:12px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:2px; text-transform:uppercase; border-radius:5px;">${label} &rarr;</a>
</td></tr></table>`;
}

/** Two "spec" cells (label + value) side by side. */
export function mxMailSpecPair(left: { label: string; value: string }, right: { label: string; value: string }) {
  const cell = (c: { label: string; value: string }, border: boolean) => `<td width="50%" valign="top" style="padding:16px 18px;${border ? " border-right:1px solid #DDE5E0;" : ""}">
<div style="font-family:${MONO}; font-size:10px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#7A8A82; margin-bottom:6px;">${mxEsc(c.label)}</div>
<div style="font-size:14px; font-weight:700; color:${GRAPHITE}; word-break:break-word; overflow-wrap:anywhere;">${mxEsc(c.value)}</div>
</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F8F5; border:1px solid #DDE5E0; border-left:4px solid ${GREEN}; border-radius:6px; margin-bottom:24px;"><tr>${cell(left, true)}${cell(right, false)}</tr></table>`;
}

/** Group heading + key/value rows. */
export function mxMailRows(title: string, rows: [string, string][]) {
  const body = rows
    .filter(([, v]) => v !== "")
    .map(
      ([k, v]) => `<tr><td style="padding:10px 0; border-bottom:1px solid #E7EDE9; font-size:13px; color:#6B7B73; width:40%; vertical-align:top;">${mxEsc(k)}</td><td style="padding:10px 0; border-bottom:1px solid #E7EDE9; font-size:14px; font-weight:600; color:${GRAPHITE}; vertical-align:top;">${v}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:${MONO}; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${GREEN}; margin:0 0 4px 0;">${mxEsc(title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">${body}</table>`;
}

export function mxMailPara(html: string, opts?: { size?: number; color?: string; mb?: number; weight?: number }) {
  return `<p style="margin:0 0 ${opts?.mb ?? 16}px 0; font-size:${opts?.size ?? 15}px; line-height:1.7; color:${opts?.color ?? "#33423B"};${opts?.weight ? ` font-weight:${opts.weight};` : ""}">${html}</p>`;
}

/** Hungarian block, divider, English block. */
export function mxMailBilingual(hu: string, en: string, enLabel = "English") {
  return `${hu}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 26px 0;"><tr>
<td style="border-top:1px solid #DDE5E0; font-size:0; line-height:0;" width="42%">&nbsp;</td>
<td align="center" style="padding:0 12px; font-family:${MONO}; font-size:10px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:#7A8A82; white-space:nowrap;">${mxEsc(enLabel)}</td>
<td style="border-top:1px solid #DDE5E0; font-size:0; line-height:0;" width="42%">&nbsp;</td>
</tr></table>
${en}`;
}

export function mxMailFooterNote(lang: MxMailLang | "both", invite = false) {
  const hu = invite
    ? "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül."
    : "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte.";
  const en = invite
    ? "This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it."
    : "This message was sent by the Pannon Transfer Komplex system.";
  const year = new Date().getFullYear();
  const rights = lang === "hu" ? "Minden jog fenntartva." : lang === "en" ? "All rights reserved." : "Minden jog fenntartva. / All rights reserved.";
  const text = lang === "hu" ? hu : lang === "en" ? en : `${hu}<br>${en}`;
  return `${text}<br>&copy; ${year} Pannon Transfer. ${rights}`;
}

export function mxMailShell(opts: {
  origin: string;
  preheader: string;
  eyebrow: string;
  headline: string;
  bodyHtml: string;
  lang: MxMailLang | "both";
  invite?: boolean;
  topRight?: string;
}) {
  const origin = (opts.origin || "").replace(/\/$/, "");
  const ptLogo = origin ? `${origin}/brand/pannon-transfer-logo.png` : "";
  const schLogo = origin ? `${origin}/partners/schaefflermotion/logo.png` : "";

  const logos =
    ptLogo && schLogo
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:5px; padding:9px 14px;"><img src="${ptLogo}" width="120" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:120px;"></td>
<td width="12"></td>
<td valign="middle" style="background:#FFFFFF; border-radius:5px; padding:11px 14px;"><img src="${schLogo}" width="104" height="26" alt="Schaeffler" style="display:block; border:0; height:26px; width:104px;"></td>
</tr></table>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr><td style="background:#FFFFFF; border-radius:5px; padding:10px 16px; font-size:15px; font-weight:800; color:${GREEN}; letter-spacing:1px;">SCHAEFFLER</td></tr></table>`;

  const contactRole = opts.lang === "en" ? MX_CONTACT.roleEn : opts.lang === "hu" ? MX_CONTACT.roleHu : "Fejlesztő / Developer, Pannon Transfer";
  const contactTitle = opts.lang === "en" ? "Your contact" : opts.lang === "hu" ? "Kapcsolattartó" : "Kapcsolattartó / Your contact";
  const pageLang = opts.lang === "en" ? "en" : "hu";

  return `<!DOCTYPE html>
<html lang="${pageLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${mxEsc(opts.headline.replace(/<[^>]+>/g, " ").replace(/&rsquo;/g, "’"))}</title>
</head>
<body style="margin:0; padding:0; background:#E9EEEA; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${mxEsc(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#E9EEEA"><tr><td align="center" style="padding:34px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;">

<tr><td style="padding:0 2px 12px 2px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${MONO}; font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#52645B;">Pannon Transfer</td>
<td align="right" style="font-family:${MONO}; font-size:11px; letter-spacing:1.6px; text-transform:uppercase; color:#7A8A82;">${mxEsc(opts.topRight || "Schaeffler Motion")}</td>
</tr></table>
</td></tr>

<tr><td style="background:#FFFFFF; border-radius:10px; overflow:hidden; box-shadow:0 2px 6px rgba(14,20,18,.10);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

<tr><td height="6" style="background:${GREEN}; font-size:0; line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="${GRAPHITE}" style="padding:34px 40px 34px 40px;">
${logos}
<div style="font-family:${MONO}; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:${NEON}; margin-bottom:12px;">${mxEsc(opts.eyebrow)}</div>
<div style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.28; color:#FFFFFF;">${opts.headline}</div>
</td></tr>
<tr><td height="3" style="background:linear-gradient(90deg,${GREEN},${NEON}); background-color:${GREEN}; font-size:0; line-height:0;">&nbsp;</td></tr>

<tr><td style="padding:38px 40px 14px 40px;">
${opts.bodyHtml}
</td></tr>

<tr><td bgcolor="${GRAPHITE}" style="padding:28px 40px;">
<div style="font-family:${MONO}; font-size:10px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:${NEON}; margin-bottom:14px;">${contactTitle}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="44" valign="top"><div style="width:44px; height:44px; line-height:44px; text-align:center; background:${GREEN}; border-radius:5px; color:#FFFFFF; font-size:15px; font-weight:800;">BS</div></td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#AEBBB4;">
<div style="font-size:15px; font-weight:700; color:#FFFFFF;">${MX_CONTACT.name}</div>
<div>${contactRole}</div>
<div><a href="mailto:${MX_CONTACT.email}" style="color:${NEON}; text-decoration:none;">${MX_CONTACT.email}</a> &nbsp;·&nbsp; <a href="tel:${MX_CONTACT.phoneHref}" style="color:${NEON}; text-decoration:none;">${MX_CONTACT.phone}</a></div>
</td></tr></table>
</td></tr>
<tr><td bgcolor="#0A0F0D" style="padding:20px 40px;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#6B7B73; text-align:center;">${mxMailFooterNote(opts.lang, opts.invite)}</p>
</td></tr>

</table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}


function budapestStamp(ms: number): string {
  return (
    new Date(ms).toLocaleString("sv-SE", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) + " (CET/CEST)"
  );
}

export function buildSchaefflerMotionInviteEmail(params: {
  recipientEmail: string;
  setupUrl: string;
  requireTwoFactor: boolean;
  expiresAt: number;
}) {
  const { recipientEmail, setupUrl, requireTwoFactor, expiresAt } = params;
  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}
  const expires = budapestStamp(expiresAt);

  const hu =
    mxMailPara("Tisztelt Partnerünk!", { size: 16, weight: 600, color: "#0E1412" }) +
    mxMailPara(
      "Meghívást kapott a Schaeffler Motion dedikált foglalási portáljára. A portálon megtekintheti a megállapodott árakat, transzfert foglalhat, és egy helyen követheti az összes foglalását.",
    ) +
    mxMailPara("Kérjük, az alábbi személyes linken állítsa be a jelszavát, majd lépjen be.", { mb: 22 }) +
    mxMailButton(setupUrl, "Jelszó beállítása és belépés") +
    mxMailSpecPair({ label: "Belépési fiók", value: recipientEmail }, { label: "A link érvényes eddig", value: expires }) +
    mxMailPara(
      `<strong style="color:#0E1412;">Biztonság:</strong> ${
        requireTwoFactor
          ? "a jelszó beállítása után <strong>kétfaktoros hitelesítés (2FA) kötelező</strong> lesz a belépéshez."
          : "a belépéshez jelszó szükséges, kérésre kétfaktoros hitelesítés (2FA) is bekapcsolható."
      } A személyes link <strong>nem osztható meg</strong> másokkal.`,
      { size: 13, color: "#6B7B73", mb: 8 },
    );

  const en =
    mxMailPara("Dear Partner,", { size: 16, weight: 600, color: "#0E1412" }) +
    mxMailPara(
      "You have been invited to the dedicated Schaeffler Motion booking portal. There you can review your agreed rate structure, book transfers and follow every booking in one place.",
    ) +
    mxMailPara("Please use your personal link below to choose a password and sign in.", { mb: 22 }) +
    mxMailButton(setupUrl, "Set password & sign in") +
    mxMailPara(
      `<strong style="color:#0E1412;">Security:</strong> ${
        requireTwoFactor
          ? "two-factor authentication (2FA) is <strong>mandatory</strong> and will be set up right after you choose your password."
          : "you will sign in with your own password; two-factor authentication (2FA) can be enabled on request."
      } This link is personal &mdash; please <strong>do not share it</strong> with anyone.`,
      { size: 13, color: "#6B7B73", mb: 26 },
    );

  const html = mxMailShell({
    origin,
    preheader:
      "Meghívás a Schaeffler Motion partnerportálra. / You have been invited to the Schaeffler Motion partner portal.",
    eyebrow: "Meghívó · Invitation",
    headline: "Meghívás a Schaeffler Motion<br>foglalási portálra",
    bodyHtml: mxMailBilingual(hu, en),
    lang: "both",
    invite: true,
    topRight: "Partner Portal",
  });

  const text = [
    "PANNON TRANSFER - SCHAEFFLER MOTION PARTNERPORTÁL / PARTNER PORTAL",
    "",
    "Tisztelt Partnerünk!",
    "Meghívást kapott a Schaeffler Motion dedikált foglalási portáljára.",
    "Állítsa be a jelszavát és lépjen be a személyes linken:",
    setupUrl,
    "Belépési fiók: " + recipientEmail,
    "A link érvényes eddig: " + expires,
    requireTwoFactor ? "Kétfaktoros hitelesítés (2FA) kötelező." : "2FA kérésre bekapcsolható.",
    "A személyes link nem osztható meg.",
    "",
    "Dear Partner,",
    "You have been invited to the dedicated Schaeffler Motion booking portal.",
    "Set your password and sign in using your personal link:",
    setupUrl,
    "Account: " + recipientEmail,
    "Link valid until: " + expires,
    requireTwoFactor ? "Two-factor authentication (2FA) is mandatory." : "2FA can be enabled on request.",
    "This link is personal - please do not share it.",
    "",
    `${MX_CONTACT.name} - ${MX_CONTACT.roleEn}`,
    MX_CONTACT.email,
    MX_CONTACT.phone,
    "",
    "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül.",
    "This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.",
    `© ${new Date().getFullYear()} Pannon Transfer.`,
  ].join("\n");

  return {
    subject: "Meghívás a Schaeffler Motion portálra / Invitation to the Schaeffler Motion portal – Pannon Transfer",
    html,
    text,
  };
}
