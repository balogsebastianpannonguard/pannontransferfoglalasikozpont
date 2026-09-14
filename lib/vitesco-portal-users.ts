import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const VITESCO_BCRYPT_ROUNDS = 12;
export const VITESCO_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface VitescoPortalUser {
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

const COLLECTION_NAME = "vitesco_portal_users";

export async function getVitescoPortalCollection() {
  return getCollection<VitescoPortalUser>(COLLECTION_NAME);
}

export async function initVitescoUserIndexes() {
  const col = await getVitescoPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeVitescoEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateVitescoInviteToken() {
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

export async function hashVitescoToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetVitescoInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: VitescoPortalUser; rawToken: string }> {
  await initVitescoUserIndexes();
  const normalizedEmail = normalizeVitescoEmail(email);
  const col = await getVitescoPortalCollection();
  const now = Date.now();

  const rawToken = generateVitescoInviteToken();
  const inviteTokenHash = await hashVitescoToken(rawToken);
  const inviteExpiresAt = now + VITESCO_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Vitesco user update failed");
    return { user: fresh as VitescoPortalUser, rawToken };
  }

  const newUser: VitescoPortalUser = {
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
  if (!created) throw new Error("Vitesco user insert failed");
  return { user: created as VitescoPortalUser, rawToken };
}

export async function listVitescoPortalUsers(): Promise<VitescoPortalUser[]> {
  await initVitescoUserIndexes();
  const col = await getVitescoPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as VitescoPortalUser);
}

export async function findVitescoUserByInviteToken(
  rawToken: string
): Promise<VitescoPortalUser | null> {
  await initVitescoUserIndexes();
  const col = await getVitescoPortalCollection();
  const hash = await hashVitescoToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as VitescoPortalUser | null;
  return user;
}

export async function setVitescoUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<VitescoPortalUser | null> {
  const col = await getVitescoPortalCollection();
  const hashed = await bcrypt.hash(password, VITESCO_BCRYPT_ROUNDS);
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
  return (updated as VitescoPortalUser) || null;
}

export async function markVitescoWelcomeEmailSent(id: ObjectId) {
  const col = await getVitescoPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareVitescoPassword(user: VitescoPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteVitescoPortalUser(id: ObjectId) {
  const col = await getVitescoPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordVitescoSuccessfulLogin(id: ObjectId) {
  const col = await getVitescoPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findVitescoUserByEmail(email: string): Promise<VitescoPortalUser | null> {
  await initVitescoUserIndexes();
  const col = await getVitescoPortalCollection();
  const normalizedEmail = normalizeVitescoEmail(email);
  return (await col.findOne({ normalizedEmail })) as VitescoPortalUser | null;
}
