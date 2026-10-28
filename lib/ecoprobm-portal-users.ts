import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const ECOPROBM_BCRYPT_ROUNDS = 12;
export const ECOPROBM_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface EcoproBmPortalUser {
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

const COLLECTION_NAME = "ecoprobm_portal_users";

export async function getEcoproBmPortalCollection() {
  return getCollection<EcoproBmPortalUser>(COLLECTION_NAME);
}

export async function initEcoproBmUserIndexes() {
  const col = await getEcoproBmPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEcoproBmEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEcoproBmInviteToken() {
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

export async function hashEcoproBmToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetEcoproBmInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: EcoproBmPortalUser; rawToken: string }> {
  await initEcoproBmUserIndexes();
  const normalizedEmail = normalizeEcoproBmEmail(email);
  const col = await getEcoproBmPortalCollection();
  const now = Date.now();

  const rawToken = generateEcoproBmInviteToken();
  const inviteTokenHash = await hashEcoproBmToken(rawToken);
  const inviteExpiresAt = now + ECOPROBM_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Ecopro BM user update failed");
    return { user: fresh as EcoproBmPortalUser, rawToken };
  }

  const newUser: EcoproBmPortalUser = {
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
  if (!created) throw new Error("Ecopro BM user insert failed");
  return { user: created as EcoproBmPortalUser, rawToken };
}

export async function listEcoproBmPortalUsers(): Promise<EcoproBmPortalUser[]> {
  await initEcoproBmUserIndexes();
  const col = await getEcoproBmPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EcoproBmPortalUser);
}

export async function findEcoproBmUserByInviteToken(
  rawToken: string
): Promise<EcoproBmPortalUser | null> {
  await initEcoproBmUserIndexes();
  const col = await getEcoproBmPortalCollection();
  const hash = await hashEcoproBmToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as EcoproBmPortalUser | null;
  return user;
}

export async function setEcoproBmUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<EcoproBmPortalUser | null> {
  const col = await getEcoproBmPortalCollection();
  const hashed = await bcrypt.hash(password, ECOPROBM_BCRYPT_ROUNDS);
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
  return (updated as EcoproBmPortalUser) || null;
}

export async function markEcoproBmWelcomeEmailSent(id: ObjectId) {
  const col = await getEcoproBmPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareEcoproBmPassword(user: EcoproBmPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteEcoproBmPortalUser(id: ObjectId) {
  const col = await getEcoproBmPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordEcoproBmSuccessfulLogin(id: ObjectId) {
  const col = await getEcoproBmPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}
