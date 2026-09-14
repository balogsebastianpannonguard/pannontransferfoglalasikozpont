import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const TAMA_BCRYPT_ROUNDS = 12;
export const TAMA_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TamaPortalUser {
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

const COLLECTION_NAME = "tama_portal_users";

export async function getTamaPortalCollection() {
  return getCollection<TamaPortalUser>(COLLECTION_NAME);
}

export async function initTamaUserIndexes() {
  const col = await getTamaPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeTamaEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateTamaInviteToken() {
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

export async function hashTamaToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetTamaInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: TamaPortalUser; rawToken: string }> {
  await initTamaUserIndexes();
  const normalizedEmail = normalizeTamaEmail(email);
  const col = await getTamaPortalCollection();
  const now = Date.now();

  const rawToken = generateTamaInviteToken();
  const inviteTokenHash = await hashTamaToken(rawToken);
  const inviteExpiresAt = now + TAMA_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Tama user update failed");
    return { user: fresh as TamaPortalUser, rawToken };
  }

  const newUser: TamaPortalUser = {
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
  if (!created) throw new Error("Tama user insert failed");
  return { user: created as TamaPortalUser, rawToken };
}

export async function listTamaPortalUsers(): Promise<TamaPortalUser[]> {
  await initTamaUserIndexes();
  const col = await getTamaPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as TamaPortalUser);
}

export async function findTamaUserByInviteToken(
  rawToken: string
): Promise<TamaPortalUser | null> {
  await initTamaUserIndexes();
  const col = await getTamaPortalCollection();
  const hash = await hashTamaToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as TamaPortalUser | null;
  return user;
}

export async function setTamaUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<TamaPortalUser | null> {
  const col = await getTamaPortalCollection();
  const hashed = await bcrypt.hash(password, TAMA_BCRYPT_ROUNDS);
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
  return (updated as TamaPortalUser) || null;
}

export async function markTamaWelcomeEmailSent(id: ObjectId) {
  const col = await getTamaPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareTamaPassword(user: TamaPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteTamaPortalUser(id: ObjectId) {
  const col = await getTamaPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordTamaSuccessfulLogin(id: ObjectId) {
  const col = await getTamaPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findTamaUserByEmail(email: string): Promise<TamaPortalUser | null> {
  await initTamaUserIndexes();
  const col = await getTamaPortalCollection();
  const normalizedEmail = normalizeTamaEmail(email);
  return (await col.findOne({ normalizedEmail })) as TamaPortalUser | null;
}

export async function listTamaInvites(): Promise<TamaPortalUser[]> {
  await initTamaUserIndexes();
  const col = await getTamaPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as TamaPortalUser);
}

export async function deleteTamaInvite(email: string): Promise<boolean> {
  await initTamaUserIndexes();
  const col = await getTamaPortalCollection();
  const normalizedEmail = normalizeTamaEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
