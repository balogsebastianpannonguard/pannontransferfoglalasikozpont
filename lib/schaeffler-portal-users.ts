import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const SCHAEFFLER_BCRYPT_ROUNDS = 12;
export const SCHAEFFLER_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SchaefflerPortalUser {
  _id?: string | ObjectId;
  email: string;
  normalizedEmail: string;
  hashedPassword: string | null;
  inviteRawToken: string;
  inviteTokenHash: string;
  inviteIssuedAt: number;
  inviteExpiresAt: number;
  isActivated: boolean;
  activatedAt: number | null;
  requireTwoFactor: boolean;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  welcomeEmailSent: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

const COLLECTION_NAME = "schaeffler_portal_users";

export async function getSchaefflerPortalCollection() {
  return getCollection<SchaefflerPortalUser>(COLLECTION_NAME);
}

export async function initSchaefflerUserIndexes() {
  const col = await getSchaefflerPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeSchaefflerEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateSchaefflerInviteToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let token = "";
  const arr = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < arr.length; i++) token += chars[arr[i] % chars.length];
  return token;
}

export async function hashSchaefflerToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetSchaefflerInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: SchaefflerPortalUser; rawToken: string }> {
  await initSchaefflerUserIndexes();
  const normalizedEmail = normalizeSchaefflerEmail(email);
  const col = await getSchaefflerPortalCollection();
  const now = Date.now();

  const rawToken = generateSchaefflerInviteToken();
  const inviteTokenHash = await hashSchaefflerToken(rawToken);
  const inviteExpiresAt = now + SCHAEFFLER_INVITE_TOKEN_TTL_MS;

  const existing = await col.findOne({ normalizedEmail });
  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          hashedPassword: null,
          isActivated: false,
          activatedAt: null,
          requireTwoFactor: !!opts.requireTwoFactor,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          welcomeEmailSent: false,
          inviteRawToken: rawToken,
          inviteTokenHash,
          inviteIssuedAt: now,
          inviteExpiresAt,
          updatedAt: now,
        },
      }
    );
    const fresh = await col.findOne({ _id: existing._id });
    if (!fresh) throw new Error("Schaeffler user update failed");
    return { user: fresh as SchaefflerPortalUser, rawToken };
  }

  const newUser: SchaefflerPortalUser = {
    email: email.trim(),
    normalizedEmail,
    hashedPassword: null,
    inviteRawToken: rawToken,
    inviteTokenHash,
    inviteIssuedAt: now,
    inviteExpiresAt,
    isActivated: false,
    activatedAt: null,
    requireTwoFactor: !!opts.requireTwoFactor,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    welcomeEmailSent: false,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };
  const r = await col.insertOne(newUser as any);
  const created = await col.findOne({ _id: r.insertedId });
  if (!created) throw new Error("Schaeffler user insert failed");
  return { user: created as SchaefflerPortalUser, rawToken };
}

export async function listSchaefflerPortalUsers(): Promise<SchaefflerPortalUser[]> {
  await initSchaefflerUserIndexes();
  const col = await getSchaefflerPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerPortalUser);
}

export async function findSchaefflerUserByInviteToken(
  rawToken: string
): Promise<SchaefflerPortalUser | null> {
  await initSchaefflerUserIndexes();
  const col = await getSchaefflerPortalCollection();
  const hash = await hashSchaefflerToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as SchaefflerPortalUser | null;
  return user;
}

export async function setSchaefflerUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<SchaefflerPortalUser | null> {
  const col = await getSchaefflerPortalCollection();
  const hashed = await bcrypt.hash(password, SCHAEFFLER_BCRYPT_ROUNDS);
  const now = Date.now();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        hashedPassword: hashed,
        isActivated: true,
        activatedAt: now,
        updatedAt: now,
        inviteRawToken: "",
        inviteTokenHash: "",
        inviteIssuedAt: now,
        inviteExpiresAt: now - 1,
      },
    }
  );
  const updated = await col.findOne({ _id: id });
  return (updated as SchaefflerPortalUser) || null;
}

export async function markSchaefflerWelcomeEmailSent(id: ObjectId) {
  const col = await getSchaefflerPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareSchaefflerPassword(user: SchaefflerPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteSchaefflerPortalUser(id: ObjectId) {
  const col = await getSchaefflerPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordSchaefflerSuccessfulLogin(id: ObjectId) {
  const col = await getSchaefflerPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findSchaefflerUserByEmail(email: string): Promise<SchaefflerPortalUser | null> {
  await initSchaefflerUserIndexes();
  const col = await getSchaefflerPortalCollection();
  const normalizedEmail = normalizeSchaefflerEmail(email);
  return (await col.findOne({ normalizedEmail })) as SchaefflerPortalUser | null;
}

export async function listSchaefflerInvites(): Promise<SchaefflerPortalUser[]> {
  await initSchaefflerUserIndexes();
  const col = await getSchaefflerPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerPortalUser);
}

export async function deleteSchaefflerInvite(email: string): Promise<boolean> {
  await initSchaefflerUserIndexes();
  const col = await getSchaefflerPortalCollection();
  const normalizedEmail = normalizeSchaefflerEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
