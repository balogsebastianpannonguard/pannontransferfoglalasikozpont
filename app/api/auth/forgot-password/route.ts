import { NextResponse } from "next/server";
import { getUserCollection } from "@/lib/users";
import { createResetToken } from "@/lib/reset-tokens";
import { sendEmail } from "@/lib/email";

function buildResetHtml(resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="hu">
    <head>
      <meta charset="UTF-8" />
      <title>Pannon Transfer CRM – Új Jelszó</title>
    </head>
    <body style="margin:0; padding:0; background-color:#F3F4F6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F3F4F6">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
              <tr>
                <td align="center" bgcolor="#0F172A" style="padding: 60px 40px; border-bottom: 3px solid #D4AF37;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                    <tr>
                      <td align="center" valign="middle" width="70" height="70" bgcolor="#1E293B" style="border: 2px solid #D4AF37; border-radius: 50%;">
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; color: #D4AF37; font-weight: bold; line-height: 70px;">PT</span>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin: 0 0 10px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: normal; color: #FFFFFF; letter-spacing: 0.5px;">
                    Pannon Transfer
                  </h1>
                  <p style="margin: 0; font-size: 11px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #94A3B8;">
                    Biztonsági Központ
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 50px 40px 40px 40px;">
                  <h2 style="margin: 0 0 20px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; color: #0F172A;">
                    Jelszó Visszaállítása
                  </h2>
                  <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.7; color: #475569;">
                    Valaki (remélhetőleg Te) új jelszót kért a Pannon Transfer CRM fiókodhoz.<br><br>
                    Ha Te voltál, kattints az alábbi gombra az új jelszó beállításához. Ha nem Te kérted, hagyd figyelmen kívül ezt az üzenetet.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 40px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center" bgcolor="#0F172A" style="border-radius: 6px;">
                              <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 18px 40px; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: bold; color: #FFFFFF; text-decoration: none; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 6px; border: 1px solid #0F172A;">
                                Új Jelszó Beállítása
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748B; text-align: center;">
                    <strong style="color: #0F172A;">Biztonsági előírások:</strong> A link 2 óráig érvényes. A jelszónak minimum 10 karakter hosszúnak kell lennie (kisbetű, nagybetű, szám, speciális karakter).
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#F8FAFC" style="padding: 40px; border-top: 1px solid #E2E8F0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top: 20px; border-top: 1px dashed #CBD5E1;">
                        <p style="margin: 0 0 10px 0; font-size: 11px; color: #94A3B8; line-height: 1.6;">
                          Ezt az automatikus üzenetet a Pannon Transfer CRM rendszere küldte.
                        </p>
                        <p style="margin: 0; font-size: 11px; font-weight: bold; color: #94A3B8;">
                          &copy; ${new Date().getFullYear()} Pannon Transfer. Minden jog fenntartva.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div style="height: 40px;"></div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Érvénytelen email cím." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const collection = await getUserCollection();
    const user = await collection.findOne({ normalizedEmail });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ success: true, message: "Ha létezik fiók ezzel az email címmel, elküldtük a visszaállító linket." });
    }

    const resetToken = await createResetToken(normalizedEmail);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken.token}`;

    const html = buildResetHtml(resetUrl);
    const text = `Pannon Transfer CRM - Jelszó visszaállítása\n\nKattints a linkre: ${resetUrl}`;

    const emailRes = await sendEmail({
      to: normalizedEmail,
      subject: "Pannon Transfer CRM - Új jelszó kérése",
      html,
      text,
    });

    if (!emailRes.success) {
      console.warn("Failed to send reset email, but continuing.", emailRes.error);
    }

    return NextResponse.json({ success: true, message: "Ha létezik fiók ezzel az email címmel, elküldtük a visszaállító linket." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, message: "Belső hiba történt." }, { status: 500 });
  }
}