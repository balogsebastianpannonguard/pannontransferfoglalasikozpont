import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const ECCOINO_BCRYPT_ROUNDS = 12;
export const ECCOINO_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface EccoinoPortalUser {
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

const COLLECTION_NAME = "eccoino_portal_users";

export async function getEccoinoPortalCollection() {
  return getCollection<EccoinoPortalUser>(COLLECTION_NAME);
}

export async function initEccoinoUserIndexes() {
  const col = await getEccoinoPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEccoinoEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEccoinoInviteToken() {
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

export async function hashEccoinoToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetEccoinoInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: EccoinoPortalUser; rawToken: string }> {
  await initEccoinoUserIndexes();
  const normalizedEmail = normalizeEccoinoEmail(email);
  const col = await getEccoinoPortalCollection();
  const now = Date.now();

  const rawToken = generateEccoinoInviteToken();
  const inviteTokenHash = await hashEccoinoToken(rawToken);
  const inviteExpiresAt = now + ECCOINO_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Eccoino user update failed");
    return { user: fresh as EccoinoPortalUser, rawToken };
  }

  const newUser: EccoinoPortalUser = {
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
  if (!created) throw new Error("Eccoino user insert failed");
  return { user: created as EccoinoPortalUser, rawToken };
}

export async function listEccoinoPortalUsers(): Promise<EccoinoPortalUser[]> {
  await initEccoinoUserIndexes();
  const col = await getEccoinoPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EccoinoPortalUser);
}

export async function findEccoinoUserByInviteToken(
  rawToken: string
): Promise<EccoinoPortalUser | null> {
  await initEccoinoUserIndexes();
  const col = await getEccoinoPortalCollection();
  const hash = await hashEccoinoToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as EccoinoPortalUser | null;
  return user;
}

export async function setEccoinoUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<EccoinoPortalUser | null> {
  const col = await getEccoinoPortalCollection();
  const hashed = await bcrypt.hash(password, ECCOINO_BCRYPT_ROUNDS);
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
  return (updated as EccoinoPortalUser) || null;
}

export async function markEccoinoWelcomeEmailSent(id: ObjectId) {
  const col = await getEccoinoPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareEccoinoPassword(user: EccoinoPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteEccoinoPortalUser(id: ObjectId) {
  const col = await getEccoinoPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordEccoinoSuccessfulLogin(id: ObjectId) {
  const col = await getEccoinoPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findEccoinoUserByEmail(email: string): Promise<EccoinoPortalUser | null> {
  await initEccoinoUserIndexes();
  const col = await getEccoinoPortalCollection();
  const normalizedEmail = normalizeEccoinoEmail(email);
  const user = (await col.findOne({ normalizedEmail })) as EccoinoPortalUser | null;
  return user;
}

export async function setEccoinoTwoFactorSecret(id: ObjectId, secret: string) {
  const col = await getEccoinoPortalCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        twoFactorSecret: secret,
        updatedAt: Date.now(),
      },
    }
  );
}

export async function enableEccoinoTwoFactor(id: ObjectId) {
  const col = await getEccoinoPortalCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        twoFactorEnabled: true,
        updatedAt: Date.now(),
      },
    }
  );
}
