import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetEcoproBmInvite } from "@/lib/ecoprobm-portal-users";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const C = {
  navy: "#071B38",
  blue: "#1E73BE",
  blueLight: "#8CC4F5",
  orange: "#F28C28",
  orangeLight: "#FFB366",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  panel: "#F5F8FC",
  page: "#EAF0F8",
};

function infoRow(left: { label: string; value: string }, right: { label: string; value: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.panel}; border:1px solid ${C.line}; border-radius:10px; margin:0 0 24px 0;"><tr>
<td width="50%" valign="top" style="padding:16px 18px; border-right:1px solid ${C.line};">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${C.faint}; margin-bottom:6px;">${esc(left.label)}</div>
<div style="font-size:14px; font-weight:700; color:${C.ink}; word-break:break-all;">${esc(left.value)}</div>
</td>
<td width="50%" valign="top" style="padding:16px 18px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${C.faint}; margin-bottom:6px;">${esc(right.label)}</div>
<div style="font-size:14px; font-weight:700; color:${C.ink};">${esc(right.value)}</div>
</td></tr></table>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 30px 0;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${C.orange}" style="border-radius:10px;">
<a href="${href}" style="display:inline-block; padding:16px 40px; font-size:14px; font-weight:800; color:#050F20; text-decoration:none; letter-spacing:.5px; border-radius:10px;">${label}</a>
</td></tr></table></td></tr></table>`;
}

function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number
) {
  const expiresHu = new Date(expiresAt).toLocaleString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  });
  const expiresEn =
    new Date(expiresAt).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Budapest",
    }) + " (CET/CEST)";
  const expiresKo = new Date(expiresAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Budapest",
  });
  const year = new Date().getFullYear();

  let origin = "";
  try {
    origin = new URL(setupUrl).origin;
  } catch {}
  const logoRow = origin
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td valign="middle" style="background:#FFFFFF; border-radius:9px; padding:9px 14px;"><img src="${origin}/brand/pannon-transfer-logo.png" width="118" height="24" alt="Pannon Transfer" style="display:block; border:0; height:24px; width:118px;"></td>
<td width="12"></td>
<td valign="middle" style="background:#FFFFFF; border-radius:9px; padding:10px 14px;"><img src="${origin}/partners/ecoprobm/logo.png" width="104" height="23" alt="Ecopro BM" style="display:block; border:0; height:23px; width:104px;"></td>
</tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr><td style="background:#FFFFFF; border-radius:9px; padding:10px 16px; font-size:16px; font-weight:900; color:${C.blue};">Ecopro <span style="color:${C.orange};">BM</span></td></tr></table>`;

  const p = (t: string, last = false) =>
    `<p style="margin:0 0 ${last ? 26 : 14}px 0; font-size:15px; line-height:1.75; color:${C.text}; word-break:keep-all;">${t}</p>`;
  const hi = (t: string) => `<p style="margin:0 0 14px 0; font-size:16px; font-weight:700; color:${C.ink};">${t}</p>`;

  const huBody =
    hi("Tisztelt Partnerünk!") +
    p("A Pannon Transfer személyes fiókot hozott létre Önnek az Ecopro BM dedikált portálján. A portálon áttekintheti a megállapodott díjszabást, transzfert foglalhat, és egy helyen követheti a foglalásait.") +
    p("Kérjük, az alábbi személyes linken válasszon jelszót, és lépjen be első alkalommal.", true) +
    button(setupUrl, "Jelszó beállítása és belépés") +
    infoRow({ label: "Az Ön fiókja", value: recipientEmail }, { label: "A link érvényes eddig", value: expiresHu }) +
    `<p style="margin:0 0 24px 0; font-size:13px; line-height:1.7; color:${C.muted};"><strong style="color:${C.ink};">Biztonság:</strong> ${
      requireTwoFactor
        ? "a fiókhoz <strong>kétfaktoros hitelesítés (2FA) kötelező</strong>, amelyet a jelszó beállítása után azonnal beállíthat."
        : "a belépés saját jelszóval történik; kérésre kétfaktoros hitelesítés (2FA) is bekapcsolható."
    } A link személyes, kérjük, ne ossza meg senkivel.</p>`;

  const enBody =
    hi("Dear Partner,") +
    p("Pannon Transfer has created a personal account for you on the dedicated Ecopro BM portal. There you can review the agreed rates, book transfers and follow all your bookings in one place.") +
    p("Please use your personal link below to choose a password and sign in for the first time.", true) +
    button(setupUrl, "Set your password &amp; sign in") +
    infoRow({ label: "Your account", value: recipientEmail }, { label: "Link valid until", value: expiresEn }) +
    `<p style="margin:0 0 24px 0; font-size:13px; line-height:1.7; color:${C.muted};"><strong style="color:${C.ink};">Security:</strong> ${
      requireTwoFactor
        ? "this account requires <strong>two-factor authentication (2FA)</strong>, which you can set up right after choosing your password."
        : "you will sign in with your own password; two-factor authentication (2FA) can be enabled on request."
    } This link is personal – please do not share it with anyone.</p>`;

  const koBody =
    hi("고객님께,") +
    p("Pannon Transfer가 Ecopro BM 전용 포털에 고객님의 개인 계정을 만들었습니다. 포털에서 합의된 요금 체계를 확인하고, 이동을 예약하고, 모든 예약을 한곳에서 확인하실 수 있습니다.") +
    p("아래 개인 링크에서 비밀번호를 설정하고 처음으로 로그인해 주세요.", true) +
    button(setupUrl, "비밀번호 설정 및 로그인") +
    infoRow({ label: "계정", value: recipientEmail }, { label: "링크 유효 기간", value: expiresKo }) +
    `<p style="margin:0 0 24px 0; font-size:13px; line-height:1.7; color:${C.muted};"><strong style="color:${C.ink};">보안 안내:</strong> ${
      requireTwoFactor
        ? "이 계정에는 <strong>2단계 인증(2FA)이 필수</strong>이며, 비밀번호 설정 직후 바로 설정하실 수 있습니다."
        : "본인의 비밀번호로 로그인하며, 요청 시 2단계 인증(2FA)을 추가로 사용할 수 있습니다."
    } 이 링크는 개인 전용이므로 다른 사람과 공유하지 마세요.</p>`;

  const divider = (label: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px 0;"><tr>
<td style="border-top:1px solid ${C.line}; height:1px; font-size:0; line-height:0;" width="42%">&nbsp;</td>
<td align="center" style="padding:0 12px; white-space:nowrap;"><span style="display:inline-block; padding:4px 12px; border-radius:20px; background:${C.panel}; border:1px solid ${C.line}; font-size:10px; font-weight:800; letter-spacing:1.6px; color:${C.muted};">${label}</span></td>
<td style="border-top:1px solid ${C.line}; height:1px; font-size:0; line-height:0;" width="42%">&nbsp;</td>
</tr></table>`;

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>Meghívó az Ecopro BM portálra / Invitation to the Ecopro BM portal / Ecopro BM 포털 초대</title>
</head>
<body style="margin:0; padding:0; background:${C.page}; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, 'Malgun Gothic', 'Apple SD Gothic Neo', Arial, sans-serif; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">Meghívást kapott az Ecopro BM dedikált portálra. / You have been invited to the dedicated Ecopro BM portal. / Ecopro BM 전용 포털에 초대되었습니다.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.page}"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
<tr><td style="padding:0 6px 14px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:12px; font-weight:700; letter-spacing:2.4px; text-transform:uppercase; color:${C.muted};">Pannon Transfer</td>
<td align="right" style="font-size:12px; color:${C.faint};">Meghívó · Invitation · 초대</td>
</tr></table>
</td></tr>
<tr><td style="background:#FFFFFF; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(7,27,56,.10);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="${C.orange}" height="5" style="height:5px; font-size:0; line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="${C.navy}" style="padding:34px 40px 32px 40px; border-bottom:4px solid ${C.blue};">
${logoRow}
<div style="font-size:11px; font-weight:700; letter-spacing:2.6px; text-transform:uppercase; color:${C.orangeLight}; margin-bottom:10px;">Dedikált portál · Dedicated portal · 전용 포털</div>
<div style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.28; color:#FFFFFF;">Meghívó az<br>Ecopro BM portálra</div>
<div style="margin-top:8px; font-size:15px; line-height:1.4; color:${C.blueLight};">Invitation to the Ecopro BM portal · Ecopro BM 전용 포털 초대장</div>
</td></tr>
<tr><td style="padding:38px 40px 6px 40px;">
${huBody}
${divider("ENGLISH")}
${enBody}
${divider("한국어")}
${koBody}
</td></tr>
<tr><td style="padding:0 40px 36px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};"><tr><td style="padding-top:22px;">
<div style="font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:${C.faint}; margin-bottom:12px;">Kapcsolattartó · Your contact · 담당자 연락처</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="46" valign="top" style="width:46px;"><div style="width:46px; height:46px; line-height:46px; text-align:center; background:${C.navy}; border-radius:23px; color:${C.orangeLight}; font-size:16px; font-weight:700;">BS</div></td>
<td valign="top" style="padding-left:14px; font-size:13px; line-height:1.65; color:#475569;">
<div style="font-size:15px; font-weight:700; color:${C.ink};">Balog Sebastian M&aacute;t&eacute;</div>
<div>Fejlesztő&nbsp;&middot;&nbsp;Developer&nbsp;&middot;&nbsp;개발자, Pannon Transfer</div>
<div><a href="mailto:balogh.sebastian@pannonguard.hu" style="color:${C.blue}; text-decoration:none;">balogh.sebastian@pannonguard.hu</a></div>
<div><a href="tel:+36306654135" style="color:${C.blue}; text-decoration:none;">+36 30 665 4135</a></div>
</td></tr></table>
</td></tr></table>
</td></tr>
<tr><td bgcolor="${C.panel}" style="padding:22px 40px; border-top:1px solid ${C.line};">
<p style="margin:0; font-size:11px; line-height:1.7; color:${C.faint}; text-align:center;">
Ezt az üzenetet a Pannon Transfer Komplex rendszere küldte. Ha nem kérte a meghívást, kérjük, hagyja figyelmen kívül.<br>
This message was sent by the Pannon Transfer Komplex system. If you did not request this invitation, please disregard it.<br>
이 메일은 Pannon Transfer Komplex 시스템에서 발송되었습니다. 초대를 요청하지 않으셨다면 무시해 주세요.<br>
&copy; ${year} Pannon Transfer. Minden jog fenntartva. / All rights reserved. / 모든 권리 보유.
</p>
</td></tr>
</table></td></tr></table>
</td></tr></table>
</body></html>`;

  const text = [
    "PANNON TRANSFER - ECOPRO BM",
    "",
    "Tisztelt Partnerünk!",
    "",
    "Meghívást kapott az Ecopro BM dedikált portálra. Személyes link a jelszó beállításához és a belépéshez:",
    setupUrl,
    "",
    "Fiók: " + recipientEmail,
    "A link érvényes eddig: " + expiresHu,
    requireTwoFactor
      ? "Fontos: a belépéshez kétfaktoros hitelesítés (2FA) kötelező."
      : "A 2FA opcionális, de ajánlott.",
    "",
    "--------------------",
    "",
    "Dear Partner,",
    "",
    "You have been invited to the dedicated Ecopro BM portal. Your personal link to set your password and sign in:",
    setupUrl,
    "",
    "Account: " + recipientEmail,
    "Link valid until: " + expiresEn,
    requireTwoFactor
      ? "Important: two-factor authentication (2FA) is required to sign in."
      : "2FA is optional but recommended.",
    "",
    "--------------------",
    "",
    "고객님께,",
    "",
    "Ecopro BM 전용 포털에 초대되었습니다. 비밀번호 설정 및 로그인을 위한 개인 링크:",
    setupUrl,
    "",
    "계정: " + recipientEmail,
    "링크 유효 기간: " + expiresKo,
    requireTwoFactor ? "중요: 로그인에는 2단계 인증(2FA)이 필수입니다." : "2단계 인증(2FA)은 선택 사항이지만 권장합니다.",
    "",
    "--------------------",
    "Balog Sebastian Máté - Fejlesztő / Developer / 개발자, Pannon Transfer",
    "balogh.sebastian@pannonguard.hu",
    "+36 30 665 4135",
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
      console.warn("[SMTP] Ecopro BM invite: SMTP nem érhető el (teszt mód).", smtp.message);
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

    const setupPath = "/ecoprobm/setup-password";

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
        const { user, rawToken } = await createOrResetEcoproBmInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== ECOPROBM INVITE (TEST MODE) ===");
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
          subject: "Meghívó · Invitation · 초대 – Ecopro BM portal – Pannon Transfer",
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
    console.error("[ecoprobm-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
