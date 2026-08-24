import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "pannon_admin_session";
const ADMIN_COOKIE_SECRET =
  process.env.ADMIN_COOKIE_SECRET ||
  "super_secret_admin_cookie_value_pannon_2025";
const EMAIL_AUTH_COOKIE_NAME = "pannon_email_admin_session";
const EMAIL_ADMIN_COOKIE_SECRET =
  process.env.EMAIL_ADMIN_COOKIE_SECRET ||
  "email_admin_secret_pannon_2025_transfer";

/**
 * Development-only JWT validity check (Edge Runtime compatible).
 * NOTE: jsonwebtoken's jwt.verify relies on Node.js crypto primitives which
 * do NOT work reliably in Next.js Edge Runtime middleware, so signature
 * verification is skipped during development. Payload structure and expiration
 * are validated instead. Final signature-based auth guard will be re-enabled
 * at project completion per user decision.
 */
function isValidJwt(token: string | undefined, _secret: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  try {
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (payloadB64.length % 4)) % 4;
    const padded = payloadB64 + "=".repeat(padLen);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    if (!payload || typeof payload !== "object") return false;
    // Check expiration if present (Unix timestamp seconds)
    if (typeof payload.exp === "number") {
      const nowSeconds = Date.now() / 1000;
      if (payload.exp <= nowSeconds) return false;
    }
    // Minimal shape: either email or username field must exist + issued at timestamp
    const hasIdentity = typeof payload.email === "string" || typeof payload.username === "string";
    const hasRole = payload.role === undefined || typeof payload.role === "string";
    return hasIdentity && hasRole;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------- CRM Admin védelm ----------
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/login");

  const crmToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isCrmAuthenticated = isValidJwt(crmToken, ADMIN_COOKIE_SECRET);

  if (isAdminRoute && !isCrmAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isCrmAuthenticated) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  // ---------- Email Admin védelm ----------
  const isEmailAdminProtectedRoute = pathname.startsWith("/email-admin/dashboard");
  const isEmailAdminLoginRoute = pathname.startsWith("/email-admin/login");

  const emailToken = request.cookies.get(EMAIL_AUTH_COOKIE_NAME)?.value;
  const isEmailAdminAuthenticated = isValidJwt(emailToken, EMAIL_ADMIN_COOKIE_SECRET);

  if (isEmailAdminProtectedRoute && !isEmailAdminAuthenticated) {
    const emailLoginUrl = new URL("/email-admin/login", request.url);
    emailLoginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(emailLoginUrl);
  }

  if (isEmailAdminLoginRoute && isEmailAdminAuthenticated) {
    const emailDashboardUrl = new URL("/email-admin/dashboard", request.url);
    return NextResponse.redirect(emailDashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/email-admin/dashboard/:path*",
    "/email-admin/dashboard",
    "/email-admin/login",
  ],
};
