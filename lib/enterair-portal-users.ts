import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const ENTERAIR_BCRYPT_ROUNDS = 12;
export const ENTERAIR_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface EnterAirPortalUser {
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

const COLLECTION_NAME = "enterair_portal_users";

export async function getEnterAirPortalCollection() {
  return getCollection<EnterAirPortalUser>(COLLECTION_NAME);
}

export async function initEnterAirUserIndexes() {
  const col = await getEnterAirPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEnterAirEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEnterAirInviteToken() {
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

export async function hashEnterAirToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetEnterAirInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: EnterAirPortalUser; rawToken: string }> {
  await initEnterAirUserIndexes();
  const normalizedEmail = normalizeEnterAirEmail(email);
  const col = await getEnterAirPortalCollection();
  const now = Date.now();

  const rawToken = generateEnterAirInviteToken();
  const inviteTokenHash = await hashEnterAirToken(rawToken);
  const inviteExpiresAt = now + ENTERAIR_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Enter Air user update failed");
    return { user: fresh as EnterAirPortalUser, rawToken };
  }

  const newUser: EnterAirPortalUser = {
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
  if (!created) throw new Error("Enter Air user insert failed");
  return { user: created as EnterAirPortalUser, rawToken };
}

export async function listEnterAirPortalUsers(): Promise<EnterAirPortalUser[]> {
  await initEnterAirUserIndexes();
  const col = await getEnterAirPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EnterAirPortalUser);
}

export async function findEnterAirUserByInviteToken(
  rawToken: string
): Promise<EnterAirPortalUser | null> {
  await initEnterAirUserIndexes();
  const col = await getEnterAirPortalCollection();
  const hash = await hashEnterAirToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as EnterAirPortalUser | null;
  return user;
}

export async function setEnterAirUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<EnterAirPortalUser | null> {
  const col = await getEnterAirPortalCollection();
  const hashed = await bcrypt.hash(password, ENTERAIR_BCRYPT_ROUNDS);
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
  return (updated as EnterAirPortalUser) || null;
}

export async function markEnterAirWelcomeEmailSent(id: ObjectId) {
  const col = await getEnterAirPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareEnterAirPassword(user: EnterAirPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteEnterAirPortalUser(id: ObjectId) {
  const col = await getEnterAirPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordEnterAirSuccessfulLogin(id: ObjectId) {
  const col = await getEnterAirPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findEnterAirUserByEmail(email: string): Promise<EnterAirPortalUser | null> {
  await initEnterAirUserIndexes();
  const col = await getEnterAirPortalCollection();
  const normalizedEmail = normalizeEnterAirEmail(email);
  return (await col.findOne({ normalizedEmail })) as EnterAirPortalUser | null;
}

export async function listEnterAirInvites(): Promise<EnterAirPortalUser[]> {
  await initEnterAirUserIndexes();
  const col = await getEnterAirPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EnterAirPortalUser);
}

export async function deleteEnterAirInvite(email: string): Promise<boolean> {
  await initEnterAirUserIndexes();
  const col = await getEnterAirPortalCollection();
  const normalizedEmail = normalizeEnterAirEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
