import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const CATL_BCRYPT_ROUNDS = 12;
export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CatlPortalUser {
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

const COLLECTION_NAME = "catl_portal_users";

export async function getCatlPortalCollection() {
  return getCollection<CatlPortalUser>(COLLECTION_NAME);
}

export async function initCatlUserIndexes() {
  const col = await getCatlPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateInviteToken() {
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

export async function hashToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetCatlInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: CatlPortalUser; rawToken: string }> {
  await initCatlUserIndexes();
  const normalizedEmail = normalizeEmail(email);
  const col = await getCatlPortalCollection();
  const now = Date.now();

  const rawToken = generateInviteToken();
  const inviteTokenHash = await hashToken(rawToken);
  const inviteExpiresAt = now + INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("CATL user update failed");
    return { user: fresh as CatlPortalUser, rawToken };
  }

  const newUser: CatlPortalUser = {
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
  if (!created) throw new Error("CATL user insert failed");
  return { user: created as CatlPortalUser, rawToken };
}

export async function listCatlPortalUsers(): Promise<CatlPortalUser[]> {
  await initCatlUserIndexes();
  const col = await getCatlPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as CatlPortalUser);
}

export async function findCatlUserByInviteToken(
  rawToken: string
): Promise<CatlPortalUser | null> {
  await initCatlUserIndexes();
  const col = await getCatlPortalCollection();
  const hash = await hashToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as CatlPortalUser | null;
  return user;
}

export async function setCatlUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<CatlPortalUser | null> {
  const col = await getCatlPortalCollection();
  const hashed = await bcrypt.hash(password, CATL_BCRYPT_ROUNDS);
  await col.updateOne(
    { _id: id },
    {
      $set: {
        hashedPassword: hashed,
        isActivated: true,
        activatedAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
  const updated = await col.findOne({ _id: id });
  return (updated as CatlPortalUser) || null;
}

export async function markCatlWelcomeEmailSent(id: ObjectId) {
  const col = await getCatlPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareCatlPassword(user: CatlPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteCatlPortalUser(id: ObjectId) {
  const col = await getCatlPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordCatlSuccessfulLogin(id: ObjectId) {
  const col = await getCatlPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}
