import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getCollection } from "./db";

export const EMAIL_AUTH_COOKIE_NAME = "pannon_email_admin_session";
export const EMAIL_ADMIN_COOKIE_SECRET =
  process.env.EMAIL_ADMIN_COOKIE_SECRET || "email_admin_secret_pannon_2025_transfer";

const EMAIL_ADMIN_USERNAME = process.env.EMAIL_ADMIN_USERNAME || "admin";
const EMAIL_ADMIN_PASSWORD = process.env.EMAIL_ADMIN_PASSWORD || "admin";

export interface EmailAdminUser {
  username: string;
  role: "email_admin";
  loginAt: number;
}

export interface DbEmailAdminUser {
  _id?: import("mongodb").ObjectId;
  username: string;
  hashedPassword?: string;
  role: "email_admin";
  createdAt: number;
}

export async function verifyEmailAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!email || !password) {
    return { success: false, message: "Kérjük, adja meg a hozzáférési adatokat." };
  }

  const normalizedEmail = email.trim();

  // 1. Env check (master admin)
  const envUsernameMatch = normalizedEmail === EMAIL_ADMIN_USERNAME;
  const envPasswordMatch = password === EMAIL_ADMIN_PASSWORD;

  if (envUsernameMatch && envPasswordMatch) {
    return { success: true };
  }

  // 2. Database check (username mezőben tároljuk az emailt a korábbi kompatibilitás miatt)
  try {
    const collection = await getCollection<DbEmailAdminUser>("email_admin_users");
    const user = await collection.findOne({ username: normalizedEmail });
    
    if (user && user.hashedPassword) {
      const dbPasswordMatch = await bcrypt.compare(password, user.hashedPassword);
      if (dbPasswordMatch) {
        return { success: true };
      }
    }
  } catch (e) {
    console.error("DB check failed for email admin:", e);
  }

  return { success: false, message: "Hibás e-mail cím vagy jelszó." };
}

export function createEmailAdminSessionToken(user: EmailAdminUser): string {
  return jwt.sign(user, EMAIL_ADMIN_COOKIE_SECRET, { expiresIn: "7d" });
}

export function verifyEmailAdminSessionToken(token: string): EmailAdminUser | null {
  try {
    return jwt.verify(token, EMAIL_ADMIN_COOKIE_SECRET) as EmailAdminUser;
  } catch {
    return null;
  }
}

export async function setEmailAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(EMAIL_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearEmailAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(EMAIL_AUTH_COOKIE_NAME);
}

export async function getCurrentEmailAdminSession(): Promise<EmailAdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMAIL_AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyEmailAdminSessionToken(token);
}
