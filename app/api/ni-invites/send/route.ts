import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetNiInvite } from "@/lib/ni-portal-users";

export const dynamic = "force-dynamic";

function buildInviteEmail(
  recipientEmail: string,
  setupUrl: string,
  requireTwoFactor: boolean,
  expiresAt: number,
  opts?: { role?: "admin-ni" | "normal"; recipientName?: string | null }
) {
  const expiresStr = new Date(expiresAt).toLocaleString("hu-HU");
  const isAdmin = opts?.role === "admin-ni";
  const greetingName = opts?.recipientName?.trim();
  const greetingHtml = greetingName
    ? `Kedves ${greetingName}!`
    : "Tisztelt Partnerünk!";
  const introHtml = isAdmin
    ? `${greetingHtml} Ön <strong>adminisztrátori</strong> hozzáférést kapott a Pannon Transfer NI partnerfelületére. Az árstruktúrákhoz, a foglalási rendszerhez és a céges foglalások kezeléséhez kizárólag az alábbi személyes aktiválási linken keresztül biztosítunk hozzáférést.`
    : `Ön meghívást kapott a Pannon Transfer NI partnerfelületére. Az árstruktúrákhoz és a foglalási rendszerhez kizárólag az alábbi személyes aktiválási linken keresztül biztosítunk hozzáférést.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">
NI partner meghívó: aktiválja a hozzáférését a jelszó beállításával, és jelentkezzen be az egyedi linkkel.
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F3F4F6">
  <tr>
    <td align="center" style="padding:32px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;">
        <tr>
          <td style="padding-bottom:16px; text-align:center; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#94A3B8; font-weight:700;">
            Pannon Transfer · NI dedikált partnerhozzáférés
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF; border-radius:28px; overflow:hidden; box-shadow:0 24px 70px rgba(15,23,42,0.10);">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:36px 36px 0 36px; background:linear-gradient(135deg,#34D399 0%,#22C55E 54%,#15803D 100%);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="left">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                          <tr>
                            <td bgcolor="#ECFDF5" style="padding:14px 18px; border-radius:18px; border:1px solid rgba(6,78,59,0.08);">
                              <span style="font-size:20px; font-weight:900; color:#15803D;">NI</span>
                              <span style="font-size:13px; font-weight:800; color:#166534; margin-left:6px; letter-spacing:.04em;">Networks</span>
                            </td>
                          </tr>
                        </table>
                        <div style="display:inline-block; padding:7px 12px; margin-bottom:14px; border-radius:999px; background:rgba(255,255,255,0.72); border:1px solid rgba(6,78,59,0.08); font-size:10px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase; color:#166534;">
                        Biztonságos hozzáférés · NI Partner Portál${isAdmin ? " · Admin" : ""}
                      </div>
                      <h1 style="margin:0; font-size:34px; line-height:1.08; color:#0B2B1B; font-weight:800;">
                        Hozzáférési meghívó az NI dedikált partnerportáljához.
                      </h1>
                      <p style="margin:16px 0 0 0; max-width:480px; font-size:16px; line-height:1.75; color:#234233;">
                        ${introHtml}
                      </p>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:26px; margin-bottom:-26px;">
                          <tr>
                            <td>
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                  <td width="50%" style="padding-right:8px;">
                                    <div style="background:rgba(255,255,255,0.86); border-radius:20px; padding:16px 18px; border:1px solid rgba(6,78,59,0.08);">
                                      <div style="font-size:10px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; color:#166534; margin-bottom:6px;">Belépési fiók</div>
                                      <div style="font-size:14px; line-height:1.6; font-weight:700; color:#0B2B1B; word-break:break-all;">${recipientEmail}</div>
                                    </div>
                                  </td>
                                  <td width="50%" style="padding-left:8px;">
                                    <div style="background:rgba(255,255,255,0.86); border-radius:20px; padding:16px 18px; border:1px solid rgba(6,78,59,0.08);">
                                      <div style="font-size:10px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; color:#166534; margin-bottom:6px;">Érvényesség</div>
                                      <div style="font-size:14px; line-height:1.6; font-weight:700; color:#0B2B1B;">${expiresStr}</div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:54px 36px 34px 36px;">
                        <div style="padding:22px 22px 20px 22px; border-radius:24px; background:linear-gradient(180deg,#F0FDF4 0%,#FFFFFF 100%); border:1px solid #BBF7D0;">
                          <div style="font-size:11px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase; color:#15803D; margin-bottom:8px;">
                            Aktiválási folyamat
                          </div>
                          <div style="font-size:15px; line-height:1.8; color:#475569;">
                              1. Kattintson az alábbi gombra.<br>
                              2. Állítsa be a saját jelszavát.<br>
                              3. ${requireTwoFactor ? "A következő lépésben a kétfaktoros hitelesítés (2FA) beállítása is kötelező." : "Ezt követően a rendszer elküldi Önnek a végleges belépési linket."}
                            </div>
                        </div>
                        ${
                          isAdmin
                            ? `<div style="padding:20px 22px; margin-top:20px; border-radius:24px; background:#0B1F47; color:#E2E8F0;">
                          <div style="font-size:11px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase; color:#4ADE80; margin-bottom:8px;">
                            Admin jogosultság
                          </div>
                          <div style="font-size:14px; line-height:1.8;">
                            Adminisztrátorként Ön hozzáférést kap a céges foglalási link generálásához, valamint az összes, a céges linkről érkező foglalás áttekintéséhez.
                          </div>
                        </div>`
                            : ""
                        }

                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 28px 0;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" bgcolor="#0B1F47" style="border-radius:18px; box-shadow:0 18px 40px rgba(11,31,71,0.22);">
                                    <a href="${setupUrl}" style="display:inline-block; padding:18px 34px; font-size:14px; font-weight:800; color:#FFFFFF; text-decoration:none; letter-spacing:1.4px; text-transform:uppercase; border-radius:18px;">
                                      Jelszó beállítása &amp; belépés
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:26px;">
                          <tr>
                            <td style="padding-right:8px;">
                              <div style="height:100%; border-radius:22px; padding:18px; background:#F8FAFC; border:1px solid #E2E8F0;">
                                <div style="font-size:11px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; color:#94A3B8; margin-bottom:8px;">Biztonság</div>
                                <div style="font-size:14px; line-height:1.8; color:#475569;">
                                  ${requireTwoFactor ? "<strong style='color:#0F172A;'>2FA hitelesítés kötelező</strong> a jelszó beállítása után." : "A hozzáférés jelszóval indul, a 2FA hitelesítés opcionálisan bekapcsolható."}
                                </div>
                              </div>
                            </td>
                            <td style="padding-left:8px;">
                              <div style="height:100%; border-radius:22px; padding:18px; background:#F8FAFC; border:1px solid #E2E8F0;">
                                <div style="font-size:11px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; color:#94A3B8; margin-bottom:8px;">Fontos</div>
                                <div style="font-size:14px; line-height:1.8; color:#475569;">
                                  Az egyedi aktiválási link szigorúan személyes hozzáférés, ezért <strong style="color:#0F172A;">harmadik féllel nem osztható meg</strong>.
                                </div>
                              </div>
                            </td>
                          </tr>
                        </table>

                        <div style="padding:18px 20px; border-radius:22px; background:#0F172A; color:#E2E8F0;">
                          <div style="font-size:11px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase; color:#4ADE80; margin-bottom:8px;">
                            Támogatás
                          </div>
                          <div style="font-size:14px; line-height:1.8;">
                            Amennyiben ezt a meghívót tévedésből kapta, kérjük, hagyja figyelmen kívül. Segítség vagy kérdés esetén forduljon a Pannon Transfer dedikált kapcsolattartójához.
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td bgcolor="#F8FAFC" style="padding:24px 36px 28px 36px; border-top:1px solid #E2E8F0; text-align:center;">
                        <p style="margin:0; font-size:11px; line-height:1.8; color:#94A3B8;">
                          Ezt az üzenetet a Pannon Transfer NI Portál rendszere küldte. Ha nem kérted a meghívást, hagyd figyelmen kívül.<br>
                          © ${new Date().getFullYear()} Pannon Transfer. Minden jog fenntartva.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body></html>
  `;

  const text = [
    "NI Portál - Pannon Transfer",
    "",
    greetingName ? `Kedves ${greetingName}!` : "Tisztelt Partnerünk!",
    "",
    isAdmin
      ? "Ön adminisztrátori meghívást kapott az NI dedikált portálra. Kizárólag az alábbi linken keresztül tudja aktiválni a hozzáférését:"
      : "Ön meghívást kapott az NI dedikált portálra. Kizárólag az alábbi linken keresztül tudja aktiválni a hozzáférését:",
    setupUrl,
    "",
    "Belépési fiókod: " + recipientEmail,
    "Link érvényessége: " + expiresStr,
    requireTwoFactor
      ? "FONTOS: A kétfaktoros hitelesítés (2FA) beállítása kötelező a rendszerhez."
      : "A 2FA hitelesítés opcionális, de javasolt a fiók védelme érdekében.",
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
    const { recipients, requireTwoFactor, loginBaseUrl, inviteRole, recipientName } = body || {};

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

    // Az NI portál meghívó rendszere KIZÁRÓLAG "Admin NI foglaló" jogosultságú felhasználót hozhat
    // létre — normál/egyéni NI-fiókok nem léteznek többé, a munkatársak a Céges foglalási linken
    // (bejelentkezés nélkül) foglalnak.
    const role: "admin-ni" = "admin-ni";
    const trimmedRecipientName = typeof recipientName === "string" ? recipientName.trim() : "";

    if (recipientList.length > 1) {
      return NextResponse.json(
        { success: false, message: "Admin NI foglaló jogosultsággal egyszerre csak egy címzettnek küldhetsz meghívót." },
        { status: 400 }
      );
    }
    if (!trimmedRecipientName) {
      return NextResponse.json(
        { success: false, message: "Admin NI foglaló meghívásához add meg a meghívott nevét." },
        { status: 400 }
      );
    }

    const smtp = await testSmtpConnection();
    if (!smtp.success) {
      console.warn("[SMTP] NI invite: SMTP nem érhető el (teszt mód).", smtp.message);
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

    const setupPath = "/ni/setup-password";

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
        const { user, rawToken } = await createOrResetNiInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
          role,
          displayName: role === "admin-ni" ? trimmedRecipientName : null,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== NI INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("Jogosultság:", role);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("============================\n");

        const { html, text } = buildInviteEmail(
          recipient,
          setupUrl,
          !!requireTwoFactor,
          user.inviteExpiresAt,
          { role, recipientName: role === "admin-ni" ? trimmedRecipientName : null }
        );

        const sendRes = await sendEmail({
          to: recipient,
          subject:
            role === "admin-ni"
              ? "Meghívás az NI Partner Portálra (Admin) – Pannon Transfer"
              : "Meghívás az NI Partner Portálra – Pannon Transfer",
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
    console.error("[ni-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
