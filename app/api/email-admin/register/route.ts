import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { type DbEmailAdminUser } from "@/lib/email-admin-auth";
import { sendEmail } from "@/lib/email";

function buildWelcomeEmailHtml(systemName: string, email: string, password: string, loginUrl: string) {
  const year = new Date().getFullYear();
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #111;">
      <div style="text-align: center; margin-bottom: 36px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #fff; border-radius: 1.25rem; border: 1px solid #eee; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-bottom: 20px;">
          <span style="font-weight: 900; font-size: 24px; letter-spacing: -0.02em; background: linear-gradient(135deg, #E50914, #E6B800); -webkit-background-clip: text; background-clip: text; color: transparent;">PT</span>
        </div>
        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">Fiókod elkészült</h1>
        <p style="margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #888;">Pannon Transfer • ${systemName}</p>
      </div>

      <div style="background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 24px; padding: 32px; margin-bottom: 32px;">
        <p style="margin: 0 0 24px; font-size: 15px; color: #333; line-height: 1.6;">
          Sikeresen létrehoztunk neked egy hozzáférést a <strong style="color: #E50914;">${systemName}</strong> rendszerhez.
          Az alábbi adatokkal tudsz belépni a kezdőoldalról.
        </p>

        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px 20px; padding: 20px; background: #fff; border-radius: 18px; border: 1px solid #F0F0F0; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999; display: flex; align-items: center;">E-mail</div>
          <div style="font-size: 15px; font-weight: 600; color: #111; word-break: break-all;">${email}</div>

          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999; display: flex; align-items: center;">Jelszó</div>
          <div style="font-size: 15px; font-weight: 600; color: #111; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${password}</div>

          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999; display: flex; align-items: center;">Belépés</div>
          <a href="${loginUrl}" style="font-size: 15px; font-weight: 700; color: #E50914; text-decoration: none;">${loginUrl}</a>
        </div>

          <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">
            💡 <strong>Fontos:</strong> A belépés azonnal használható e-mail címmel és jelszóval.
            Az Email Admin rendszerben jelenleg nincs kötelező 2FA lépés.
          </p>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(90deg, #E50914, #111); color: #fff; text-decoration: none; padding: 16px 28px; border-radius: 18px; font-size: 12px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; box-shadow: 0 8px 20px rgba(229,9,20,0.2);">
          Belépés most →
        </a>
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #F0F0F0; text-align: center; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #BBB;">
        © ${year} Pannon Transfer. Minden jog fenntartva.
      </div>
    </div>
  `;
}

function buildWelcomeEmailText(systemName: string, email: string, password: string, loginUrl: string) {
  const year = new Date().getFullYear();
  return `
PANNON TRANSFER – FIÓK ELKÉSZÜLT (${systemName})
================================================

Sikeresen létrehoztunk neked egy hozzáférést a ${systemName} rendszerhez.

Belépési adatok:
• E-mail:   ${email}
• Jelszó:   ${password}
• Belépés:  ${loginUrl}

  A belépés azonnal használható e-mail címmel és jelszóval.
  Az Email Admin rendszerben jelenleg nincs kötelező 2FA lépés.

© ${year} Pannon Transfer – Minden jog fenntartva.
  `.trim();
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Hiányzó e-mail cím vagy jelszó." }, { status: 400 });
    }

    const collection = await getCollection<DbEmailAdminUser>("email_admin_users");
    const normalizedEmail = email.trim();

    const masterUsername = process.env.EMAIL_ADMIN_USERNAME || "admin";
    const existing = await collection.findOne({ username: normalizedEmail });
    if (existing || normalizedEmail === masterUsername) {
      return NextResponse.json({ success: false, message: "Ez az e-mail cím már létezik az Email Admin rendszerben." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser: DbEmailAdminUser = {
      username: normalizedEmail,
      hashedPassword,
      role: "email_admin",
      createdAt: Date.now()
    };
    
    await collection.insertOne(newUser as any);

    // Welcome email küldés (nem blokkoljuk a választ, ha email hiba lenne)
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/email-admin/login`;
    const html = buildWelcomeEmailHtml("Email Küldő (Invite Center)", normalizedEmail, password, loginUrl);
    const text = buildWelcomeEmailText("Email Küldő (Invite Center)", normalizedEmail, password, loginUrl);

    sendEmail({
      to: normalizedEmail,
      subject: "Pannon Transfer – Email Admin fiókod elkészült",
      html,
      text,
    }).catch((e) => console.error("[EmailAdmin Register] Welcome email küldés sikertelen:", e));

    return NextResponse.json({ success: true, message: "Email Admin felhasználó sikeresen létrehozva. A belépési adatok elküldésre kerültek az e-mail címre." });
  } catch (error) {
    console.error("[Email Admin Register] Hiba:", error);
    return NextResponse.json({ success: false, message: "Belső szerverhiba történt." }, { status: 500 });
  }
}
