import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const STAFF_BCRYPT_ROUNDS = 12;
export const STAFF_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type StaffRole = "admin" | "dispatcher";

export interface StaffUser {
  _id?: ObjectId;
  email: string;
  normalizedEmail: string;
  role: StaffRole;
  name?: string;
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

const COLLECTION_NAME = "staff_users";

export async function getStaffCollection() {
  return getCollection<StaffUser>(COLLECTION_NAME);
}

export async function initStaffUserIndexes() {
  const col = await getStaffCollection();
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

export async function createOrResetStaffInvite(
  email: string,
  opts: { requireTwoFactor: boolean; role: StaffRole; name?: string }
): Promise<{ user: StaffUser; rawToken: string }> {
  await initStaffUserIndexes();
  const normalizedEmail = normalizeEmail(email);
  const col = await getStaffCollection();
  const now = Date.now();

  const rawToken = generateInviteToken();
  const inviteTokenHash = await hashToken(rawToken);
  const inviteExpiresAt = now + STAFF_INVITE_TOKEN_TTL_MS;
  const role: StaffRole = opts.role === "dispatcher" ? "dispatcher" : "admin";

  const existing = await col.findOne({ normalizedEmail });
  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          role,
          name: opts.name || existing.name,
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
    if (!fresh) throw new Error("Staff user update failed");
    return { user: fresh as StaffUser, rawToken };
  }

  const nameFromEmail = opts.name || email.split("@")[0];
  const newUser: StaffUser = {
    email: email.trim(),
    normalizedEmail,
    role,
    name: nameFromEmail,
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
  if (!created) throw new Error("Staff user insert failed");
  return { user: created as StaffUser, rawToken };
}

export async function listStaffUsers(filter?: { role?: StaffRole }): Promise<StaffUser[]> {
  await initStaffUserIndexes();
  const col = await getStaffCollection();
  const query: any = {};
  if (filter?.role) query.role = filter.role;
  const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => d as unknown as StaffUser);
}

export async function findStaffUserByInviteToken(rawToken: string): Promise<StaffUser | null> {
  await initStaffUserIndexes();
  const col = await getStaffCollection();
  const hash = await hashToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as StaffUser | null;
  return user;
}

export async function findStaffUserByEmail(email: string): Promise<StaffUser | null> {
  await initStaffUserIndexes();
  const col = await getStaffCollection();
  const normalizedEmail = normalizeEmail(email);
  const user = (await col.findOne({ normalizedEmail })) as StaffUser | null;
  return user;
}

export async function setStaffUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<boolean> {
  const col = await getStaffCollection();
  const hashedPassword = await bcrypt.hash(password, STAFF_BCRYPT_ROUNDS);
  const res = await col.updateOne(
    { _id: id },
    {
      $set: {
        hashedPassword,
        isActivated: true,
        activatedAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
  return res.modifiedCount > 0;
}

export async function setStaffTwoFactorSecret(
  id: ObjectId,
  secret: string,
  enabled: boolean = true
): Promise<boolean> {
  const col = await getStaffCollection();
  const res = await col.updateOne(
    { _id: id },
    {
      $set: {
        twoFactorSecret: secret,
        twoFactorEnabled: enabled,
        updatedAt: Date.now(),
      },
    }
  );
  return res.modifiedCount > 0;
}

export async function recordStaffSuccessfulLogin(id: ObjectId): Promise<void> {
  const col = await getStaffCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
}

export async function deleteStaffInvite(id: ObjectId | string): Promise<boolean> {
  const col = await getStaffCollection();
  const oid: ObjectId =
    typeof id === "string" ? (new (await import("mongodb")).ObjectId(id) as ObjectId) : id;
  const res = await col.deleteOne({ _id: oid });
  return res.deletedCount > 0;
}
