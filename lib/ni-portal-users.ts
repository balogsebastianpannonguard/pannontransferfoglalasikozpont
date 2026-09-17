import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const NI_BCRYPT_ROUNDS = 12;
export const NI_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface NiPortalUser {
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
  invitedByUserId?: string | null;
  invitedByEmail?: string | null;
  inviteStatus?: "active" | "pending_approval" | "rejected";
  approvalRequestedAt?: number | null;
  approvedAt?: number | null;
  approvedBy?: string | null;
}

const COLLECTION_NAME = "ni_portal_users";

export async function getNiPortalCollection() {
  return getCollection<NiPortalUser>(COLLECTION_NAME);
}

export async function initNiUserIndexes() {
  const col = await getNiPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeNiEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateNiInviteToken() {
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

export async function hashNiToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetNiInvite(
  email: string,
  opts: { requireTwoFactor: boolean; invitedByUserId?: string | null; invitedByEmail?: string | null }
): Promise<{ user: NiPortalUser; rawToken: string }> {
  await initNiUserIndexes();
  const normalizedEmail = normalizeNiEmail(email);
  const col = await getNiPortalCollection();
  const now = Date.now();

  const rawToken = generateNiInviteToken();
  const inviteTokenHash = await hashNiToken(rawToken);
  const inviteExpiresAt = now + NI_INVITE_TOKEN_TTL_MS;

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
          invitedByUserId: opts.invitedByUserId ?? null,
          invitedByEmail: opts.invitedByEmail ?? null,
          inviteStatus: "active",
          approvedAt: now,
          approvedBy: "admin",
        },
      }
    );
    const fresh = await col.findOne({ _id: existing._id });
    if (!fresh) throw new Error("NI user update failed");
    return { user: fresh as NiPortalUser, rawToken };
  }

  const newUser: NiPortalUser = {
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
    invitedByUserId: opts.invitedByUserId ?? null,
    invitedByEmail: opts.invitedByEmail ?? null,
    inviteStatus: "active",
    approvalRequestedAt: null,
    approvedAt: now,
    approvedBy: "admin",
  };
  const r = await col.insertOne(newUser as any);
  const created = await col.findOne({ _id: r.insertedId });
  if (!created) throw new Error("NI user insert failed");
  return { user: created as NiPortalUser, rawToken };
}

export async function listNiPortalUsers(): Promise<NiPortalUser[]> {
  await initNiUserIndexes();
  const col = await getNiPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as NiPortalUser);
}

export async function findNiUserByInviteToken(
  rawToken: string
): Promise<NiPortalUser | null> {
  await initNiUserIndexes();
  const col = await getNiPortalCollection();
  const hash = await hashNiToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as NiPortalUser | null;
  return user;
}

export async function setNiUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<NiPortalUser | null> {
  const col = await getNiPortalCollection();
  const hashed = await bcrypt.hash(password, NI_BCRYPT_ROUNDS);
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
  return (updated as NiPortalUser) || null;
}

export async function markNiWelcomeEmailSent(id: ObjectId) {
  const col = await getNiPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareNiPassword(user: NiPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteNiPortalUser(id: ObjectId) {
  const col = await getNiPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordNiSuccessfulLogin(id: ObjectId) {
  const col = await getNiPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findNiUserByEmail(email: string): Promise<NiPortalUser | null> {
  await initNiUserIndexes();
  const col = await getNiPortalCollection();
  const normalizedEmail = normalizeNiEmail(email);
  return (await col.findOne({ normalizedEmail })) as NiPortalUser | null;
}

export async function listNiInvites(): Promise<NiPortalUser[]> {
  await initNiUserIndexes();
  const col = await getNiPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as NiPortalUser);
}

export async function deleteNiInvite(email: string): Promise<boolean> {
  await initNiUserIndexes();
  const col = await getNiPortalCollection();
  const normalizedEmail = normalizeNiEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
