import crypto from "crypto";
import { OTP, generateSecret, verifySync, generateURI } from "otplib";
import QRCode from "qrcode";

const totp = new OTP({ strategy: "totp" });

export interface TwoFactorSecretResult {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUrl: string;
}

export function generateBase32Secret(_length: number = 32): string {
  const byteLength = 20;
  return generateSecret({ length: byteLength });
}

export function buildOtpAuthUri(
  secret: string,
  userEmail: string,
  appIssuer: string = "Pannon Transfer CRM"
): string {
  return generateURI({
    strategy: "totp",
    issuer: appIssuer,
    label: userEmail,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}

export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 1,
    color: {
      dark: "#18181B",
      light: "#FFFFFF",
    },
  });
}

export async function generateTwoFactorSetup(userEmail: string): Promise<TwoFactorSecretResult> {
  const secret = generateBase32Secret(32);
  const otpAuthUri = buildOtpAuthUri(secret, userEmail, "Pannon Transfer CRM");
  const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUri);
  return { secret, otpAuthUri, qrCodeDataUrl };
}

export function verifyTwoFactorToken(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  if (!secret || !token) return false;
  try {
    const epochTolerance = Math.max(0, window) * 30;
    const result = verifySync({
      strategy: "totp",
      secret,
      token: token.trim(),
      algorithm: "sha1",
      digits: 6,
      period: 30,
      epochTolerance: epochTolerance > 0 ? [epochTolerance, epochTolerance] : 0,
    });
    return (result as any).valid === true || (result as any).ok === true;
  } catch {
    return false;
  }
}

// totp compat metódusok (csak hogy a linter ne panaszkodjon a nem használt importra)
void totp;


export function generateRecoveryCodes(count: number = 8, bytesPerCode: number = 5): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex = crypto.randomBytes(bytesPerCode).toString("hex");
    // 4-4 karakternként csoportosítjuk (pl. a1b2-c3d4-e5f6)
    const parts: string[] = [];
    for (let j = 0; j < hex.length; j += 4) {
      parts.push(hex.substring(j, j + 4));
    }
    codes.push(parts.join("-"));
  }
  return codes;
}
