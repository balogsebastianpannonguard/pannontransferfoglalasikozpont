import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const IBUSZ_BCRYPT_ROUNDS = 12;
export const IBUSZ_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface IbuszPortalUser {
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

const COLLECTION_NAME = "ibusz_portal_users";

export async function getIbuszPortalCollection() {
  return getCollection<IbuszPortalUser>(COLLECTION_NAME);
}

export async function initIbuszUserIndexes() {
  const col = await getIbuszPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeIbuszEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateIbuszInviteToken() {
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

export async function hashIbuszToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetIbuszInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: IbuszPortalUser; rawToken: string }> {
  await initIbuszUserIndexes();
  const normalizedEmail = normalizeIbuszEmail(email);
  const col = await getIbuszPortalCollection();
  const now = Date.now();

  const rawToken = generateIbuszInviteToken();
  const inviteTokenHash = await hashIbuszToken(rawToken);
  const inviteExpiresAt = now + IBUSZ_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("IBUSZ Hungary Kft. user update failed");
    return { user: fresh as IbuszPortalUser, rawToken };
  }

  const newUser: IbuszPortalUser = {
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
  if (!created) throw new Error("IBUSZ Hungary Kft. user insert failed");
  return { user: created as IbuszPortalUser, rawToken };
}

export async function listIbuszPortalUsers(): Promise<IbuszPortalUser[]> {
  await initIbuszUserIndexes();
  const col = await getIbuszPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as IbuszPortalUser);
}

export async function findIbuszUserByInviteToken(
  rawToken: string
): Promise<IbuszPortalUser | null> {
  await initIbuszUserIndexes();
  const col = await getIbuszPortalCollection();
  const hash = await hashIbuszToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as IbuszPortalUser | null;
  return user;
}

export async function setIbuszUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<IbuszPortalUser | null> {
  const col = await getIbuszPortalCollection();
  const hashed = await bcrypt.hash(password, IBUSZ_BCRYPT_ROUNDS);
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
  return (updated as IbuszPortalUser) || null;
}

export async function markIbuszWelcomeEmailSent(id: ObjectId) {
  const col = await getIbuszPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareIbuszPassword(user: IbuszPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteIbuszPortalUser(id: ObjectId) {
  const col = await getIbuszPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordIbuszSuccessfulLogin(id: ObjectId) {
  const col = await getIbuszPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findIbuszUserByEmail(email: string): Promise<IbuszPortalUser | null> {
  await initIbuszUserIndexes();
  const col = await getIbuszPortalCollection();
  const normalizedEmail = normalizeIbuszEmail(email);
  return (await col.findOne({ normalizedEmail })) as IbuszPortalUser | null;
}

export async function listIbuszInvites(): Promise<IbuszPortalUser[]> {
  await initIbuszUserIndexes();
  const col = await getIbuszPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as IbuszPortalUser);
}

export async function deleteIbuszInvite(email: string): Promise<boolean> {
  await initIbuszUserIndexes();
  const col = await getIbuszPortalCollection();
  const normalizedEmail = normalizeIbuszEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
