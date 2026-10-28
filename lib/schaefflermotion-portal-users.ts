import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const SCHAEFFLERMOTION_BCRYPT_ROUNDS = 12;
export const SCHAEFFLERMOTION_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SchaefflerMotionPortalUser {
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

const COLLECTION_NAME = "schaefflermotion_portal_users";

export async function getSchaefflerMotionPortalCollection() {
  return getCollection<SchaefflerMotionPortalUser>(COLLECTION_NAME);
}

export async function initSchaefflerMotionUserIndexes() {
  const col = await getSchaefflerMotionPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeSchaefflerMotionEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateSchaefflerMotionInviteToken() {
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

export async function hashSchaefflerMotionToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetSchaefflerMotionInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: SchaefflerMotionPortalUser; rawToken: string }> {
  await initSchaefflerMotionUserIndexes();
  const normalizedEmail = normalizeSchaefflerMotionEmail(email);
  const col = await getSchaefflerMotionPortalCollection();
  const now = Date.now();

  const rawToken = generateSchaefflerMotionInviteToken();
  const inviteTokenHash = await hashSchaefflerMotionToken(rawToken);
  const inviteExpiresAt = now + SCHAEFFLERMOTION_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Schaeffler Motion user update failed");
    return { user: fresh as SchaefflerMotionPortalUser, rawToken };
  }

  const newUser: SchaefflerMotionPortalUser = {
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
  if (!created) throw new Error("Schaeffler Motion user insert failed");
  return { user: created as SchaefflerMotionPortalUser, rawToken };
}

export async function listSchaefflerMotionPortalUsers(): Promise<SchaefflerMotionPortalUser[]> {
  await initSchaefflerMotionUserIndexes();
  const col = await getSchaefflerMotionPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerMotionPortalUser);
}

export async function findSchaefflerMotionUserByInviteToken(
  rawToken: string
): Promise<SchaefflerMotionPortalUser | null> {
  await initSchaefflerMotionUserIndexes();
  const col = await getSchaefflerMotionPortalCollection();
  const hash = await hashSchaefflerMotionToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as SchaefflerMotionPortalUser | null;
  return user;
}

export async function setSchaefflerMotionUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<SchaefflerMotionPortalUser | null> {
  const col = await getSchaefflerMotionPortalCollection();
  const hashed = await bcrypt.hash(password, SCHAEFFLERMOTION_BCRYPT_ROUNDS);
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
  return (updated as SchaefflerMotionPortalUser) || null;
}

export async function markSchaefflerMotionWelcomeEmailSent(id: ObjectId) {
  const col = await getSchaefflerMotionPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareSchaefflerMotionPassword(user: SchaefflerMotionPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteSchaefflerMotionPortalUser(id: ObjectId) {
  const col = await getSchaefflerMotionPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordSchaefflerMotionSuccessfulLogin(id: ObjectId) {
  const col = await getSchaefflerMotionPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findSchaefflerMotionUserByEmail(email: string): Promise<SchaefflerMotionPortalUser | null> {
  await initSchaefflerMotionUserIndexes();
  const col = await getSchaefflerMotionPortalCollection();
  const normalizedEmail = normalizeSchaefflerMotionEmail(email);
  return (await col.findOne({ normalizedEmail })) as SchaefflerMotionPortalUser | null;
}

export async function listSchaefflerMotionInvites(): Promise<SchaefflerMotionPortalUser[]> {
  await initSchaefflerMotionUserIndexes();
  const col = await getSchaefflerMotionPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerMotionPortalUser);
}

export async function deleteSchaefflerMotionInvite(email: string): Promise<boolean> {
  await initSchaefflerMotionUserIndexes();
  const col = await getSchaefflerMotionPortalCollection();
  const normalizedEmail = normalizeSchaefflerMotionEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
