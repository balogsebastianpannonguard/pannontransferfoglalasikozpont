import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail, testSmtpConnection } from "@/lib/email";
import { createOrResetSchaefflerMotionInvite } from "@/lib/schaefflermotion-portal-users";
import { buildSchaefflerMotionInviteEmail } from "@/lib/schaefflermotion-invite-email";

export const dynamic = "force-dynamic";

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
      console.warn("[SMTP] Schaeffler Motion invite: SMTP nem érhető el (teszt mód).", smtp.message);
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

    const setupPath = "/schaefflermotion/setup-password";

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
        const { user, rawToken } = await createOrResetSchaefflerMotionInvite(recipient, {
          requireTwoFactor: !!requireTwoFactor,
        });

        const setupUrl = finalBase
          ? `${finalBase}${setupPath}?token=${encodeURIComponent(rawToken)}`
          : `${setupPath}?token=${encodeURIComponent(rawToken)}`;

        console.log("\n=== SCHAEFFLERMOTION INVITE (TEST MODE) ===");
        console.log("Címzett:", recipient);
        console.log("2FA kötelező:", !!requireTwoFactor);
        console.log(
          "Setup link (kattintva):",
          finalBase ? setupUrl : `http://localhost:3001${setupUrl}`
        );
        console.log("Lejár:", new Date(user.inviteExpiresAt).toLocaleString("hu-HU"));
        console.log("====================================\n");

        const invite = buildSchaefflerMotionInviteEmail({
          recipientEmail: recipient,
          setupUrl,
          requireTwoFactor: !!requireTwoFactor,
          expiresAt: user.inviteExpiresAt,
        });

        const sendRes = await sendEmail({
          to: recipient,
          subject: invite.subject,
          html: invite.html,
          text: invite.text,
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
    console.error("[schaefflermotion-invites/send] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Hiba" },
      { status: 500 }
    );
  }
}
