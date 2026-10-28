import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const ECOPROINNOVATION_BCRYPT_ROUNDS = 12;
export const ECOPROINNOVATION_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface EcoproInnovationPortalUser {
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

const COLLECTION_NAME = "ecoproinnovation_portal_users";

export async function getEcoproInnovationPortalCollection() {
  return getCollection<EcoproInnovationPortalUser>(COLLECTION_NAME);
}

export async function initEcoproInnovationUserIndexes() {
  const col = await getEcoproInnovationPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEcoproInnovationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateEcoproInnovationInviteToken() {
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

export async function hashEcoproInnovationToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetEcoproInnovationInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: EcoproInnovationPortalUser; rawToken: string }> {
  await initEcoproInnovationUserIndexes();
  const normalizedEmail = normalizeEcoproInnovationEmail(email);
  const col = await getEcoproInnovationPortalCollection();
  const now = Date.now();

  const rawToken = generateEcoproInnovationInviteToken();
  const inviteTokenHash = await hashEcoproInnovationToken(rawToken);
  const inviteExpiresAt = now + ECOPROINNOVATION_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Ecopro Innovation user update failed");
    return { user: fresh as EcoproInnovationPortalUser, rawToken };
  }

  const newUser: EcoproInnovationPortalUser = {
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
  if (!created) throw new Error("Ecopro Innovation user insert failed");
  return { user: created as EcoproInnovationPortalUser, rawToken };
}

export async function listEcoproInnovationPortalUsers(): Promise<EcoproInnovationPortalUser[]> {
  await initEcoproInnovationUserIndexes();
  const col = await getEcoproInnovationPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as EcoproInnovationPortalUser);
}

export async function findEcoproInnovationUserByInviteToken(
  rawToken: string
): Promise<EcoproInnovationPortalUser | null> {
  await initEcoproInnovationUserIndexes();
  const col = await getEcoproInnovationPortalCollection();
  const hash = await hashEcoproInnovationToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as EcoproInnovationPortalUser | null;
  return user;
}

export async function setEcoproInnovationUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<EcoproInnovationPortalUser | null> {
  const col = await getEcoproInnovationPortalCollection();
  const hashed = await bcrypt.hash(password, ECOPROINNOVATION_BCRYPT_ROUNDS);
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
  return (updated as EcoproInnovationPortalUser) || null;
}

export async function markEcoproInnovationWelcomeEmailSent(id: ObjectId) {
  const col = await getEcoproInnovationPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareEcoproInnovationPassword(user: EcoproInnovationPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteEcoproInnovationPortalUser(id: ObjectId) {
  const col = await getEcoproInnovationPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordEcoproInnovationSuccessfulLogin(id: ObjectId) {
  const col = await getEcoproInnovationPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}
