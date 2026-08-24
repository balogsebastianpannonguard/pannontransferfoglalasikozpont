import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "pannon_admin_session";
export const ADMIN_COOKIE_SECRET =
  process.env.ADMIN_COOKIE_SECRET || "super_secret_admin_cookie_value_pannon_2025";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "balog.sebastian@pannonguard.hu";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "N)430685923833ok";

export interface AdminUser {
  email: string;
  role: "admin" | "user";
  loginAt: number;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!email || !password) {
    return { success: false, message: "Kérjük, adja meg a hozzáférési adatokat." };
  }

  const emailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passwordMatch = password === ADMIN_PASSWORD;

  if (!emailMatch || !passwordMatch) {
    return { success: false, message: "Hibás e-mail cím vagy jelszó." };
  }

  return { success: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: AdminUser): string {
  return jwt.sign(user, ADMIN_COOKIE_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, ADMIN_COOKIE_SECRET) as AdminUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuthSession(): Promise<AdminUser | null> {
  return getCurrentSession();
}
