import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const ECOPRO_BCRYPT_ROUNDS = 12;
export const ECOPRO_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface EcoproPortalUser {
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

const COLLECTION_NAME = "ecopro_portal_users";

export async function getEcoproPortalCollection() {
  return getCollection<EcoproPortalUser>(COLLECTION_NAME);
}

export async function initEcoproUserIndexes() {
  const col = await getEcoproPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEcoproEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEcoproInviteToken() {
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

export async function hashEcoproToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetEcoproInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: EcoproPortalUser; rawToken: string }> {
  await initEcoproUserIndexes();
  const normalizedEmail = normalizeEcoproEmail(email);
  const col = await getEcoproPortalCollection();
  const now = Date.now();

  const rawToken = generateEcoproInviteToken();
  const inviteTokenHash = await hashEcoproToken(rawToken);
  const inviteExpiresAt = now + ECOPRO_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("EcoPro user update failed");
    return { user: fresh as EcoproPortalUser, rawToken };
  }

  const newUser: EcoproPortalUser = {
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
  if (!created) throw new Error("EcoPro user insert failed");
  return { user: created as EcoproPortalUser, rawToken };
}

export async function listEcoproPortalUsers(): Promise<EcoproPortalUser[]> {
  await initEcoproUserIndexes();
  const col = await getEcoproPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EcoproPortalUser);
}

export async function findEcoproUserByInviteToken(
  rawToken: string
): Promise<EcoproPortalUser | null> {
  await initEcoproUserIndexes();
  const col = await getEcoproPortalCollection();
  const hash = await hashEcoproToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as EcoproPortalUser | null;
  return user;
}

export async function setEcoproUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<EcoproPortalUser | null> {
  const col = await getEcoproPortalCollection();
  const hashed = await bcrypt.hash(password, ECOPRO_BCRYPT_ROUNDS);
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
  return (updated as EcoproPortalUser) || null;
}

export async function markEcoproWelcomeEmailSent(id: ObjectId) {
  const col = await getEcoproPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareEcoproPassword(user: EcoproPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteEcoproPortalUser(id: ObjectId) {
  const col = await getEcoproPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordEcoproSuccessfulLogin(id: ObjectId) {
  const col = await getEcoproPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}
