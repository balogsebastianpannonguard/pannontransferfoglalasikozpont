import bcrypt from "bcryptjs";
import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export const SCHAEFFLERDEBRECEN_BCRYPT_ROUNDS = 12;
export const SCHAEFFLERDEBRECEN_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SchaefflerDebrecenPortalUser {
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

const COLLECTION_NAME = "schaefflerdebrecen_portal_users";

export async function getSchaefflerDebrecenPortalCollection() {
  return getCollection<SchaefflerDebrecenPortalUser>(COLLECTION_NAME);
}

export async function initSchaefflerDebrecenUserIndexes() {
  const col = await getSchaefflerDebrecenPortalCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeSchaefflerDebrecenEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateSchaefflerDebrecenInviteToken() {
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

export async function hashSchaefflerDebrecenToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrResetSchaefflerDebrecenInvite(
  email: string,
  opts: { requireTwoFactor: boolean }
): Promise<{ user: SchaefflerDebrecenPortalUser; rawToken: string }> {
  await initSchaefflerDebrecenUserIndexes();
  const normalizedEmail = normalizeSchaefflerDebrecenEmail(email);
  const col = await getSchaefflerDebrecenPortalCollection();
  const now = Date.now();

  const rawToken = generateSchaefflerDebrecenInviteToken();
  const inviteTokenHash = await hashSchaefflerDebrecenToken(rawToken);
  const inviteExpiresAt = now + SCHAEFFLERDEBRECEN_INVITE_TOKEN_TTL_MS;

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
    if (!fresh) throw new Error("Schaeffler Debrecen user update failed");
    return { user: fresh as SchaefflerDebrecenPortalUser, rawToken };
  }

  const newUser: SchaefflerDebrecenPortalUser = {
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
  if (!created) throw new Error("Schaeffler Debrecen user insert failed");
  return { user: created as SchaefflerDebrecenPortalUser, rawToken };
}

export async function listSchaefflerDebrecenPortalUsers(): Promise<SchaefflerDebrecenPortalUser[]> {
  await initSchaefflerDebrecenUserIndexes();
  const col = await getSchaefflerDebrecenPortalCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerDebrecenPortalUser);
}

export async function findSchaefflerDebrecenUserByInviteToken(
  rawToken: string
): Promise<SchaefflerDebrecenPortalUser | null> {
  await initSchaefflerDebrecenUserIndexes();
  const col = await getSchaefflerDebrecenPortalCollection();
  const hash = await hashSchaefflerDebrecenToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as SchaefflerDebrecenPortalUser | null;
  return user;
}

export async function setSchaefflerDebrecenUserPasswordAndActivate(
  id: ObjectId,
  password: string
): Promise<SchaefflerDebrecenPortalUser | null> {
  const col = await getSchaefflerDebrecenPortalCollection();
  const hashed = await bcrypt.hash(password, SCHAEFFLERDEBRECEN_BCRYPT_ROUNDS);
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
  return (updated as SchaefflerDebrecenPortalUser) || null;
}

export async function markSchaefflerDebrecenWelcomeEmailSent(id: ObjectId) {
  const col = await getSchaefflerDebrecenPortalCollection();
  await col.updateOne({ _id: id }, { $set: { welcomeEmailSent: true } });
}

export async function compareSchaefflerDebrecenPassword(user: SchaefflerDebrecenPortalUser, password: string) {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function deleteSchaefflerDebrecenPortalUser(id: ObjectId) {
  const col = await getSchaefflerDebrecenPortalCollection();
  const res = await col.deleteOne({ _id: id });
  return res.deletedCount > 0;
}

export async function recordSchaefflerDebrecenSuccessfulLogin(id: ObjectId) {
  const col = await getSchaefflerDebrecenPortalCollection();
  await col.updateOne({ _id: id }, { $set: { lastLoginAt: Date.now(), updatedAt: Date.now() } });
}

export async function findSchaefflerDebrecenUserByEmail(email: string): Promise<SchaefflerDebrecenPortalUser | null> {
  await initSchaefflerDebrecenUserIndexes();
  const col = await getSchaefflerDebrecenPortalCollection();
  const normalizedEmail = normalizeSchaefflerDebrecenEmail(email);
  return (await col.findOne({ normalizedEmail })) as SchaefflerDebrecenPortalUser | null;
}

export async function listSchaefflerDebrecenInvites(): Promise<SchaefflerDebrecenPortalUser[]> {
  await initSchaefflerDebrecenUserIndexes();
  const col = await getSchaefflerDebrecenPortalCollection();
  const docs = await col
    .find({ inviteExpiresAt: { $gt: Date.now() } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as SchaefflerDebrecenPortalUser);
}

export async function deleteSchaefflerDebrecenInvite(email: string): Promise<boolean> {
  await initSchaefflerDebrecenUserIndexes();
  const col = await getSchaefflerDebrecenPortalCollection();
  const normalizedEmail = normalizeSchaefflerDebrecenEmail(email);
  const res = await col.deleteOne({ normalizedEmail });
  return res.deletedCount > 0;
}
