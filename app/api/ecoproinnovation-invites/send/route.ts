import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetEcoproInnovationInvite } from "@/lib/ecoproinnovation-portal-users";

export const dynamic = "force-dynamic";

/* Ecopro Innovation e-mail identity (kept in sync with partnercegek/lib/ecoproinnovation-email-layout.ts) */
type Lang = "hu" | "ko";

const ECO_CONTACT = {
  name: "Balog Sebastian Máté",
  email: "balogh.sebastian@pannonguard.hu",
  phone: "+36 30 665 4135",
  phoneHref: "+36306654135",
};

const FONT =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** `**bold**` fragments → <strong>, everything else escaped. */
function rich(s: string) {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) =>
      p.startsWith("**") && p.endsWith("**")
        ? `<strong style="color:#0B2540;">${esc(p.slice(2, -2))}</strong>`
        : esc(p),
    )
    .join("");
}

function ecoPara(text: string, opts?: { size?: number; color?: string; margin?: string }) {
  const size = opts?.size ?? 15;
  const color = opts?.color ?? "#334155";
  const margin = opts?.margin ?? "0 0 14px 0";
  return `<p style="margin:${margin}; font-size:${size}px; line-height:1.7; color:${color};">${rich(text)}</p>`;
}

function ecoButton(href: string, label: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 30px 0;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#0E86D4" style="border-radius:12px; background-image:linear-gradient(135deg,#0E86D4 0%,#00A3D9 100%);">
<a href="${href}" style="display:inline-block; padding:16px 38px; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; letter-spacing:.4px; border-radius:12px;">${esc(label)}</a>
</td></tr></table></td></tr></table>`;
}

function ecoInfoRow(left: { label: string; value: string }, right: { label: string; value: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F8FD; border:1px solid #DCEBF7; border-radius:12px; margin-bottom:24px;"><tr>
<td width="50%" valign="top" style="padding:16px 18px; border-right:1px solid #DCEBF7;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#7A93AB; margin-bottom:5px;">${esc(left.label)}</div>
<div style="font-size:14px; font-weight:600; color:#0B2540; word-break:break-all;">${esc(left.value)}</div>
</td>
<td width="50%" valign="top" style="padding:16px 18px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#7A93AB; margin-bottom:5px;">${esc(right.label)}</div>
<div style="font-size:14px; font-weight:600; color:#0B2540;">${esc(right.value)}</div>
</td></tr></table>`;
}

/** Hungarian block, a clear divider, then the Korean block. */
function ecoBilingual(huHtml: string, koHtml: string) {
  return `${huHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px 0;"><tr>
<td style="border-top:1px solid #DCEBF7; font-size:0; line-height:0;" height="1">&nbsp;</td>
<td width="1" style="padding:0 12px; white-space:nowrap; font-size:10px; font-weight:700; letter-spacing:1.6px; color:#0E86D4; text-transform:uppercase;">한국어</td>
<td style="border-top:1px solid #DCEBF7; font-size:0; line-height:0;" height="1">&nbsp;</td>
</tr></table>
${koHtml}`;
}

function contactBlock(label: string, role: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #DCEBF7;"><tr><td style="padding-top:22px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#7A93AB; margin-bottom:12px;">${esc(label)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;"><div style="width:46px; height:46px; line-height:46px; text-align:center; background:#0B3F8F; border-radius:23px; color:#FFFFFF; font-size:15px; font-weight:700;">BS</div></td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#475569;">
<div style="font-size:15px; font-weight:700; color:#0B2540;">${esc(ECO_CONTACT.name)}</div>
<div>${esc(role)}</div>
<div><a href="mailto:${ECO_CONTACT.email}" style="color:#0E86D4; text-decoration:none;">${ECO_CONTACT.email}</a></div>
<div><a href="tel:${ECO_CONTACT.phoneHref}" style="color:#0E86D4; text-decoration:none;">${ECO_CONTACT.phone}</a></div>
</td></tr></table>
</td></tr></table>`;
}

const FOOTERS: Record<Lang, { sent: string; rights: string }> = {
  hu: {
    sent: "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem Ön kérte, kérjük, hagyja figyelmen kívül.",
    rights: "Minden jog fenntartva.",
  },
  ko: {
    sent: "이 메시지는 Pannon Transfer Komplex 시스템에서 발송되었습니다. 본인이 요청하지 않으셨다면 이 메일을 무시해 주십시오.",
    rights: "모든 권리 보유.",
  },
};

/** Branded e-mail shell. `langs` decides footer language(s) and contact label. */
function ecoEmailShell(opts: {
  origin: string;
  preheader: string;
  eyebrow: string;
  headline: string;
  subHeadline?: string;
  bodyHtml: string;
  langs: Lang[] | "bi";
  topRight?: string;
}) {
  const year = new Date().getFullYear();
  const origin = opts.origin.replace(/\/$/, "");
  const ptLogo = origin ? `${origin}/brand/pannon-transfer-logo.png` : "";
  const ecoLogo = origin ? `${origin}/partners/ecoproinnovation/logo.png` : "";
  const langs: Lang[] = opts.langs === "bi" ? ["hu", "ko"] : opts.langs;
  const primary = langs[0];

  const logos =
    ptLogo && ecoLogo
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:10px; padding:9px 14px;"><img src="${ptLogo}" width="120" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:120px;"></td>
<td width="12"></td>
<td valign="middle" style="background:#FFFFFF; border-radius:10px; padding:10px 14px;"><img src="${ecoLogo}" width="92" height="22" alt="Ecopro Innovation" style="display:block; border:0; height:22px; width:92px;"></td>
</tr></table>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr><td style="background:#FFFFFF; border-radius:10px; padding:10px 16px; font-size:15px; font-weight:800; color:#0E86D4;">Ecopro Innovation</td></tr></table>`;

  const contactLabel = opts.langs === "bi" ? "Kapcsolat · 문의" : primary === "ko" ? "담당자" : "Kapcsolattartó";
  const contactRole = opts.langs === "bi" ? "Fejlesztő · 개발자" : primary === "ko" ? "개발자" : "Fejlesztő";

  const footerBlocks = langs
    .map(
      (l) =>
        `${esc(FOOTERS[l].sent)}<br>&copy; ${year} Pannon Transfer. ${esc(FOOTERS[l].rights)}`,
    )
    .join(`<br><span style="display:block; height:8px; line-height:8px;">&nbsp;</span>`);

  return `<!DOCTYPE html>
<html lang="${primary}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${esc(opts.headline.replace(/<[^>]+>/g, " "))}</title>
</head>
<body style="margin:0; padding:0; background:#EAF3FB; font-family:${FONT}; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${esc(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#EAF3FB"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
<tr><td style="padding:0 6px 14px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:12px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:#5B7691;">Pannon Transfer</td>
<td align="right" style="font-size:12px; color:#7A93AB;">${esc(opts.topRight || "Ecopro Innovation Portal")}</td>
</tr></table>
</td></tr>
<tr><td style="background:#FFFFFF; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(14,134,212,.12);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="#0E86D4" style="padding:34px 40px 34px 40px; background-image:linear-gradient(135deg,#0B3F8F 0%,#0E86D4 58%,#00B4D8 100%);">
${logos}
<div style="font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:#BFE6F8; margin-bottom:10px;">${esc(opts.eyebrow)}</div>
<div style="font-size:26px; line-height:1.25; font-weight:700; color:#FFFFFF;">${opts.headline}</div>
${opts.subHeadline ? `<div style="margin-top:8px; font-size:15px; line-height:1.4; font-weight:500; color:#D7F0FB;">${opts.subHeadline}</div>` : ""}
</td></tr>
<tr><td style="padding:36px 40px 6px 40px;">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:0 40px 36px 40px;">
${contactBlock(contactLabel, contactRole)}
</td></tr>
<tr><td bgcolor="#F6FAFE" style="padding:22px 40px; border-top:1px solid #DCEBF7;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#7A93AB; text-align:center;">
${footerBlocks}
</p>
</td></tr>
</table></td></tr></table>
</td></tr></table>
</body></html>`;
}


function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number
) {
  const year = new Date().getFullYear();
  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}

  const expiresStr =
    new Intl.DateTimeFormat("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    }).format(new Date(expiresAt)) + " (CET/CEST)";

  const hu =
    ecoPara("Tisztelt Partnerünk!", { size: 16, color: "#0B2540", margin: "0 0 14px 0" }) +
    ecoPara(
      "A Pannon Transfer személyes fiókot hozott létre Önnek az Ecopro Innovation dedikált portálján. A portálon megtekintheti a megállapodás szerinti díjszabást, transzfert foglalhat, és egy helyen követheti a foglalásait."
    ) +
    ecoPara("Kérjük, az alábbi személyes linkre kattintva állítsa be a jelszavát, és lépjen be első alkalommal.", {
      margin: "0 0 10px 0",
    });

  const ko =
    ecoPara("안녕하세요, 파트너님.", { size: 16, color: "#0B2540", margin: "0 0 14px 0" }) +
    ecoPara(
      "Pannon Transfer가 Ecopro Innovation 전용 포털에 개인 계정을 생성했습니다. 이 포털에서 협의된 요금표를 확인하고, 이동 서비스를 예약하며, 예약 현황을 한곳에서 관리할 수 있습니다."
    ) +
    ecoPara("아래 개인 링크를 눌러 비밀번호를 설정하고 처음 로그인해 주세요.", { margin: "0 0 10px 0" });

  const secHu =
    "**Biztonság:** " +
    (requireTwoFactor
      ? "A fiókjához kétfaktoros hitelesítés (2FA) kötelező, amelyet a jelszó beállítása után azonnal beállíthat."
      : "A belépéshez saját jelszavát használja; kérésre kétfaktoros hitelesítés (2FA) is bekapcsolható.") +
    " A link személyes – kérjük, ne ossza meg senkivel.";
  const secKo =
    "**보안:** " +
    (requireTwoFactor
      ? "계정에는 2단계 인증(2FA)이 필수이며, 비밀번호 설정 직후 바로 설정하실 수 있습니다."
      : "본인이 설정한 비밀번호로 로그인하며, 요청 시 2단계 인증(2FA)도 활성화할 수 있습니다.") +
    " 이 링크는 개인 전용이므로 다른 사람과 공유하지 마세요.";

  const bodyHtml =
    ecoBilingual(hu, ko) +
    ecoButton(setupUrl, "Jelszó beállítása és belépés · 비밀번호 설정 및 로그인") +
    ecoInfoRow(
      { label: "Belépési fiók · 로그인 계정", value: recipientEmail },
      { label: "Link érvényes eddig · 링크 유효 기한", value: expiresStr }
    ) +
    ecoPara(secHu, { size: 13, color: "#64748B", margin: "0 0 10px 0" }) +
    ecoPara(secKo, { size: 13, color: "#64748B", margin: "0 0 28px 0" });

  const html = ecoEmailShell({
    origin,
    preheader:
      "Meghívást kapott az Ecopro Innovation dedikált portálra. · Ecopro Innovation 전용 포털에 초대되었습니다.",
    eyebrow: "Meghívó · 초대",
    headline: "Meghívást kapott az Ecopro Innovation portálra",
    subHeadline: "Ecopro Innovation 전용 포털에 초대되었습니다",
    bodyHtml,
    langs: "bi",
    topRight: "Partner portal · 파트너 포털",
  });

  const text = [
    "PANNON TRANSFER – ECOPRO INNOVATION DEDIKÁLT PORTÁL",
    "",
    "Tisztelt Partnerünk!",
    "A Pannon Transfer személyes fiókot hozott létre Önnek az Ecopro Innovation dedikált portálján.",
    "Jelszó beállítása és belépés:",
    setupUrl,
    "Belépési fiók: " + recipientEmail,
    "A link érvényes eddig: " + expiresStr,
    requireTwoFactor ? "Fontos: a belépéshez kétfaktoros hitelesítés (2FA) kötelező." : "A 2FA kérésre bekapcsolható.",
    "",
    "안녕하세요, 파트너님.",
    "Pannon Transfer가 Ecopro Innovation 전용 포털에 개인 계정을 생성했습니다.",
    "비밀번호 설정 및 로그인:",
    setupUrl,
    "로그인 계정: " + recipientEmail,
    "링크 유효 기한: " + expiresStr,
    requireTwoFactor ? "중요: 로그인에는 2단계 인증(2FA)이 필수입니다." : "2단계 인증(2FA)은 요청 시 활성화할 수 있습니다.",
    "",
    "Balog Sebastian Máté – Fejlesztő / 개발자",
    "balogh.sebastian@pannonguard.hu",
    "+36 30 665 4135",
    "",
    "Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem Ön kérte, kérjük, hagyja figyelmen kívül.",
    "이 메시지는 Pannon Transfer Komplex 시스템에서 발송되었습니다. 본인이 요청하지 않으셨다면 이 메일을 무시해 주십시오.",
    `© ${year} Pannon Transfer. Minden jog fenntartva. / 모든 권리 보유.`,
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
      console.warn("[SMTP] Ecopro Innovation invite: SMTP nem érhető el (teszt mód).", smtp.message);
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

    const setupPath = "/ecoproinnovation/setup-password";

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
        const { user, rawToken } = await createOrResetEcoproInnovationInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== ECOPROINNOVATION INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("==================================\n");

        const { html, text } = buildInviteEmail(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject: "Meghívó az Ecopro Innovation portálra · Ecopro Innovation 포털 초대 – Pannon Transfer",
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
    console.error("[ecoproinnovation-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
