import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetStaffInvite, type StaffRole } from "@/lib/staff-users";

export const dynamic = "force-dynamic";

function buildDispatcherInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number,
  inviteName?: string
) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const displayName =
    inviteName && inviteName.trim().length > 0 ? inviteName.trim() : recipientEmail.split("@")[0];
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#F7F9FC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F7F9FC"><tr><td align="center" style="padding:40px 15px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background:#FFFFFF; border-radius:14px; overflow:hidden; border:1px solid #E5E7EB;">
<tr><td bgcolor="linear-gradient(135deg,#040914 0%,#1E293B 100%)" style="background:linear-gradient(135deg,#040914 0%,#1E293B 100%); padding:48px 44px; border-bottom:3px solid #0056D2;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
<td width="68" height="68" align="center" valign="middle" bgcolor="#FFFFFF" style="border-radius:16px; position:relative;">
<span style="font-family:Georgia, serif; font-size:24px; font-weight:900; color:#0056D2;">PD</span>
<div style="position:absolute; bottom:-3px; right:-3px; width:18px; height:18px; border-radius:999px; background:linear-gradient(135deg,#FFD700 0%,#E6B800 100%); border:2px solid #FFFFFF;"></div>
</td></tr></table>
<h1 style="margin:0 0 10px 0; font-family:Georgia, serif; color:#FFFFFF; font-size:28px; letter-spacing:.4px;">Pannon Diszpécser Központ</h1>
<p style="margin:0; font-size:11px; font-weight:800; letter-spacing:4px; text-transform:uppercase; color:#60A5FA;">Hozzáférés meghívó</p>
</td></tr>
<tr><td style="padding:46px 44px;">
<h2 style="margin:0 0 22px 0; font-family:Georgia, serif; font-size:23px; color:#0F172A;">Kedves ${displayName}!</h2>
<p style="margin:0 0 32px 0; font-size:15px; line-height:1.75; color:#475569;">
Sikeresen meghívtunk a Pannon Transfer Diszpécser Központjába. A fiókodat az alábbi egyedi linken keresztül tudod aktiválni és beállítani a saját hozzáférési adataidat. Ezután a diszpécser dashboardon személyre szabottan fogadunk.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:34px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#0056D2" style="border-radius:12px; box-shadow:0 6px 20px rgba(0,86,210,0.25);">
<a href="${setupUrl}" style="display:inline-block; padding:19px 44px; font-size:13px; font-weight:900; color:#FFFFFF; text-decoration:none; letter-spacing:2px; text-transform:uppercase; border-radius:12px;">
Fiók aktiválása &amp; Belépés
</a>
</td></tr></table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #E5E7EB; border-bottom:1px solid #E5E7EB; margin-bottom:30px;"><tr>
<td width="50%" style="padding:22px 22px 22px 0; border-right:1px solid #E5E7EB;">
<p style="margin:0 0 7px 0; font-size:10px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; color:#94A3B8;">Belépési fiók</p>
<p style="margin:0; font-size:14px; font-weight:800; color:#0F172A; word-break:break-all;">${recipientEmail}</p>
</td>
<td width="50%" style="padding:22px 0 22px 22px;">
<p style="margin:0 0 7px 0; font-size:10px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; color:#94A3B8;">Link érvényessége</p>
<p style="margin:0; font-size:14px; font-weight:800; color:#0F172A;">${expiresStr}</p>
</td>
</tr></table>
<p style="margin:0; font-size:13px; line-height:1.65; color:#64748B;">
<strong style="color:#0F172A;">Biztonság:</strong> ${requireTwoFactor ? "A bejelentkezéshez <strong>kétfaktoros hitelesítés (2FA) kötelező</strong> lesz a jelszó beállítása után." : "A bejelentkezéshez jelszó szükséges, 2FA opcionálisan aktiválható. Ajánlott bekapcsolni a maximális biztonság érdekében."} Az egyedi link másokkal <strong>nem osztható meg</strong>.
</p>
</td></tr>
<tr><td bgcolor="#F8FAFC" style="padding:32px 44px; border-top:1px solid #E5E7EB;">
<p style="margin:0; font-size:11px; line-height:1.7; color:#94A3B8; text-align:center;">
Ezt az üzenetet a Pannon Transfer Diszpécser Központ rendszere küldte.<br>
Ha nem kérted a meghívást, hagyd figyelmen kívül.<br>
© ${new Date().getFullYear()} Pannon Transfer - Minden jog fenntartva. Ügyvezető: Balog Sebastian Máté
</p>
</td></tr>
</table></td></tr></table>
</body></html>
  `;

  const text = [
    "Pannon Diszpécser Központ - Hozzáférés meghívó",
    "",
    `Kedves ${displayName}!`,
    "",
    "Meghívást kaptál a Pannon Transfer Diszpécser Központjába. A fiókodat az alábbi linken keresztül tudod aktiválni:",
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

function buildAdminInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number,
  inviteName?: string
) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const displayName =
    inviteName && inviteName.trim().length > 0 ? inviteName.trim() : recipientEmail.split("@")[0];
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F3F4F6"><tr><td align="center" style="padding:40px 15px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px; background:#FFFFFF; border-radius:12px; overflow:hidden;">
<tr><td bgcolor="#0B1220" style="padding:44px 40px; border-bottom:3px solid #6B7280;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;"><tr>
<td width="64" height="64" align="center" valign="middle" bgcolor="#FFFFFF" style="border-radius:14px;">
<span style="font-family:-apple-system, sans-serif; font-size:20px; font-weight:900; color:#111827;">⚙ ADMIN</span>
</td></tr></table>
<h1 style="margin:0 0 8px 0; font-family:Georgia, serif; color:#FFFFFF; font-size:26px; letter-spacing:.5px;">CRM Admin Hozzáférés</h1>
<p style="margin:0; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#9CA3AF;">Pannon Transfer Rendszergazda</p>
</td></tr>
<tr><td style="padding:44px 40px;">
<h2 style="margin:0 0 20px 0; font-family:Georgia, serif; font-size:22px; color:#0F172A;">Kedves ${displayName}!</h2>
<p style="margin:0 0 30px 0; font-size:15px; line-height:1.7; color:#475569;">
Új CRM Adminisztrátori fiók lett létrehozva neked a Pannon Transfernél. Kérlek állítsd be a hozzáférési adataidat az alábbi, biztonságos linken keresztül a CRM rendszerhez való hozzáférés érdekében.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:30px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#111827" style="border-radius:10px;">
<a href="${setupUrl}" style="display:inline-block; padding:18px 40px; font-size:14px; font-weight:800; color:#FFFFFF; text-decoration:none; letter-spacing:1.5px; text-transform:uppercase; border-radius:10px;">
Admin fiók aktiválása
</a>
</td></tr></table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0; margin-bottom:28px;"><tr>
<td width="50%" style="padding:20px 20px 20px 0; border-right:1px solid #E2E8F0;">
<p style="margin:0 0 6px 0; font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8;">Admin fiók</p>
<p style="margin:0; font-size:14px; font-weight:700; color:#0F172A; word-break:break-all;">${recipientEmail}</p>
</td>
<td width="50%" style="padding:20px 0 20px 20px;">
<p style="margin:0 0 6px 0; font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8;">Link érvényessége</p>
<p style="margin:0; font-size:14px; font-weight:700; color:#0F172A;">${expiresStr}</p>
</td>
</tr></table>
<p style="margin:0; font-size:13px; line-height:1.6; color:#64748B;">
<strong style="color:#0F172A;">Biztonság:</strong> ${requireTwoFactor ? "Az admin bejelentkezéshez <strong>kétfaktoros hitelesítés (2FA) kötelező</strong> lesz a jelszó beállítása után." : "A bejelentkezéshez jelszó szükséges, 2FA opcionálisan aktiválható, de erősen ajánlott."}
</p>
</td></tr>
<tr><td bgcolor="#F8FAFC" style="padding:30px 40px; border-top:1px solid #E2E8F0;">
<p style="margin:0; font-size:11px; line-height:1.6; color:#94A3B8; text-align:center;">
Ezt az üzenetet a Pannon Transfer CRM Admin rendszere küldte.<br>
© ${new Date().getFullYear()} Pannon Transfer. Minden jog fenntartva.
</p>
</td></tr>
</table></td></tr></table>
</body></html>
  `;

  const text = [
    "CRM Admin Hozzáférés - Pannon Transfer",
    "",
    `Kedves ${displayName}!`,
    "",
    "Új CRM Adminisztrátori fiók lett létrehozva neked. Az alábbi linken keresztül tudod aktiválni:",
    setupUrl,
    "",
    "Admin fiókod: " + recipientEmail,
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
    const { recipients, requireTwoFactor, loginBaseUrl, role, name } = body || {};
    const staffRole: StaffRole = role === "dispatcher" ? "dispatcher" : "admin";

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
      console.warn(
        `[SMTP] Staff invite (${staffRole}): SMTP nem érhető el (teszt mód).`,
        smtp.message
      );
    }

    let finalBase =
      typeof loginBaseUrl === "string" && loginBaseUrl.trim()
        ? loginBaseUrl.trim().replace(/\/$/, "")
        : "";

    if (staffRole === "dispatcher") {
      if (finalBase) {
        try {
          const u = new URL(finalBase);
          if (
            (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
            (u.port === "3000" || u.port === "3001")
          ) {
            u.port = "3002";
            finalBase = u.origin;
          }
        } catch {}
      }
    }

    const setupPath =
      staffRole === "dispatcher" ? "/setup-password" : "/admin/setup-password";

    type R = {
      recipient: string;
      role: StaffRole;
      success: boolean;
      error: string | null;
      setupLink: string | null;
      expiresAt: number | null;
    };
    const results: R[] = [];

    for (const recipient of recipientList) {
      try {
        const { user, rawToken } = await createOrResetStaffInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
          role: staffRole,
          name: typeof name === "string" ? name : undefined,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}&role=${staffRole}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}&role=${staffRole}`;

        const fallbackPort = staffRole === "dispatcher" ? 3002 : 3000;
        console.log(`\n=== ${staffRole.toUpperCase()} STAFF INVITE (TEST MODE) ===`);
        console.log("Címzett:", recipient);
        console.log("Szerepkör:", staffRole);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:${fallbackPort}${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("================================\n");

        const emailBuilder =
          staffRole === "dispatcher" ? buildDispatcherInviteEmail : buildAdminInviteEmail;
        const subject =
          staffRole === "dispatcher"
            ? "Meghívás a Pannon Diszpécser Központba – Fiók aktiválása"
            : "Meghívás a CRM Admin Panellbe – Admin fiók aktiválása";

        const { html, text } = emailBuilder(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt,
          typeof name === "string" ? name : undefined
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject,
          html,
          text,
        });

        results.push({
          recipient,
          role: staffRole,
          success: sendRes.success,
          error: sendRes.success ? null : sendRes.error || "Ismeretlen hiba",
          setupLink: setupUrl,
          expiresAt: user.inviteExpiresAt,
        });
      } catch (err) {
        results.push({
          recipient,
          role: staffRole,
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
      message: `${ok}/${results.length} meghívó elküldve (${staffRole}).`,
      results,
      summary: { total: results.length, success: ok, failed: results.length - ok },
    });
  } catch (error) {
    console.error("[staff-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
