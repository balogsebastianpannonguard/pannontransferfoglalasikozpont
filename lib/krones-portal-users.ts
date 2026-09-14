import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const KRONES_BCRYPT_ROUNDS = 12;
export const KRONES_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface KronesPortalUser {
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

const COLLECTION_NAME = "krones_portal_users";

export async function getKronesPortalCollection() {
  return getCollection<KronesPortalUser>(COLLECTION_NAME);
}

export async function initKronesUserIndexes() {
  const col = await getKronesPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeKronesEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateKronesInviteToken() {
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

export async function hashKronesToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetKronesInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: KronesPortalUser; rawToken: string }> {
  await initKronesUserIndexes();
  const normalizedEmail = normalizeKronesEmail(email);
  const col = await getKronesPortalCollection();
  const now = Date.now();

  const rawToken = generateKronesInviteToken();
  const inviteTokenHash = await hashKronesToken(rawToken);
  const inviteExpiresAt = now + KRONES_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Krones user update failed");
    return { user: fresh as KronesPortalUser, rawToken };
  }

  const newUser: KronesPortalUser = {
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
  if (!created) throw new Error("Krones user insert failed");
  return { user: created as KronesPortalUser, rawToken };
}

export async function listKronesPortalUsers(): Promise<KronesPortalUser[]> {
  await initKronesUserIndexes();
  const col = await getKronesPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as KronesPortalUser);
}

export async function findKronesUserByInviteToken(
  rawToken: string
): Promise<KronesPortalUser | null> {
  await initKronesUserIndexes();
  const col = await getKronesPortalCollection();
  const hash = await hashKronesToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as KronesPortalUser | null;
  return user;
}

export async function setKronesUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<KronesPortalUser | null> {
  const col = await getKronesPortalCollection();
  const hashed = await bcrypt.hash(password, KRONES_BCRYPT_ROUNDS);
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
  return (updated as KronesPortalUser) || null;
}

export async function markKronesWelcomeEmailSent(id: ObjectId) {
  const col = await getKronesPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareKronesPassword(user: KronesPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteKronesPortalUser(id: ObjectId) {
  const col = await getKronesPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordKronesSuccessfulLogin(id: ObjectId) {
  const col = await getKronesPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findKronesUserByEmail(email: string): Promise<KronesPortalUser | null> {
  await initKronesUserIndexes();
  const col = await getKronesPortalCollection();
  const normalizedEmail = normalizeKronesEmail(email);
  return (await col.findOne({ normalizedEmail })) as KronesPortalUser | null;
}

export async function listKronesInvites(): Promise<KronesPortalUser[]> {
  await initKronesUserIndexes();
  const col = await getKronesPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as KronesPortalUser);
}

export async function deleteKronesInvite(email: string): Promise<boolean> {
  await initKronesUserIndexes();
  const col = await getKronesPortalCollection();
  const normalizedEmail = normalizeKronesEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
