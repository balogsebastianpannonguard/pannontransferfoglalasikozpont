import { NextResponse } from "next/server";
import { getUserCollection, setUserPassword } from "@/lib/users";
import { verifyAndConsumeResetToken } from "@/lib/reset-tokens";
import { validatePasswordComplexity } from "@/lib/password-rules";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, message: "Hiányzó token." }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      return NextResponse.json({ success: false, message: "Kérjük, add meg az új jelszót és a megerősítését is." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "A két jelszó nem egyezik meg." }, { status: 400 });
    }

    const complexityCheck = validatePasswordComplexity(password);
    if (!complexityCheck.valid) {
      return NextResponse.json({ success: false, message: complexityCheck.reason || "A jelszó nem elég erős." }, { status: 400 });
    }

    const email = await verifyAndConsumeResetToken(token);
    if (!email) {
      return NextResponse.json({ success: false, message: "Érvénytelen vagy lejárt visszaállító link." }, { status: 400 });
    }

    const collection = await getUserCollection();
    const user = await collection.findOne({ normalizedEmail: email });
    if (!user) {
      return NextResponse.json({ success: false, message: "Felhasználó nem található." }, { status: 404 });
    }

    await setUserPassword(user._id, password);

    // Also unlock the user if they were locked
    await collection.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockedUntil: null, updatedAt: Date.now() } }
    );

    return NextResponse.json({ success: true, message: "Jelszó sikeresen visszaállítva! Most már bejelentkezhetsz." });
  } catch (error) {
    console.error("[POST /api/auth/reset-password] error:", error);
    return NextResponse.json({ success: false, message: "Belső hiba történt a jelszó beállítása során." }, { status: 500 });
  }
}