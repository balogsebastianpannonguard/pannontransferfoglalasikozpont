import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/db";
import { testSmtpConnection } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbStatus = await testDatabaseConnection();
    const smtpStatus = await testSmtpConnection();

    return NextResponse.json({
      success: true,
      services: {
        database: dbStatus,
        smtp: smtpStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Ismeretlen hiba történt.",
      },
      { status: 500 }
    );
  }
}
