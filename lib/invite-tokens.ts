import crypto from "crypto";
import { getCollection } from "./db";
import { normalizeEmail } from "./users";

export const INVITE_TOKEN_VALID_HOURS = 24;

export interface InviteTokenDoc {
  _id?: import("mongodb").ObjectId;
  tokenHash: string;
  normalizedEmail: string;
  expiresAt: number;
  usedAt: number | null;
  createdAt: number;
}

const COLLECTION_NAME = "invite_tokens";

export async function getInviteTokenCollection() {
  return getCollection<InviteTokenDoc>(COLLECTION_NAME);
}

export async function initInviteTokenIndexes() {
  const collection = await getInviteTokenCollection();
  try {
    await collection.createIndex({ tokenHash: 1 }, { unique: true });
    await collection.createIndex({ normalizedEmail: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {
    // ignore
  }
}

export interface CreateInviteResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: number;
  normalizedEmail: string;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function createInviteToken(email: string): Promise<CreateInviteResult> {
  const collection = await getInviteTokenCollection();
  await initInviteTokenIndexes();

  const normalizedEmail = normalizeEmail(email);

  // Minden új meghívásnál a régi, még nem felhasznált tokeneket megszüntetjük az adott emailhez
  try {
    await collection.updateMany(
      { normalizedEmail, usedAt: null, expiresAt: { $gt: Date.now() } },
      { $set: { usedAt: Date.now() } }
    );
  } catch {
    // ignore
  }

  // 32 bájt random = 64 hex karakter (egyedi, egyszer használatos link a query-ben)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const now = Date.now();
  const expiresAt = now + INVITE_TOKEN_VALID_HOURS * 60 * 60 * 1000;

  const doc: InviteTokenDoc = {
    tokenHash,
    normalizedEmail,
    expiresAt,
    usedAt: null,
    createdAt: now,
  };

  await collection.insertOne(doc as any);
  return { rawToken, tokenHash, expiresAt, normalizedEmail };
}

export interface ValidateInviteResult {
  valid: boolean;
  reason?: string;
  normalizedEmail?: string;
  expiresAt?: number;
  tokenHash?: string;
}

export async function validateInviteToken(rawToken: string): Promise<ValidateInviteResult> {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, reason: "Hiányzó vagy érvénytelen token." };
  }

  const collection = await getInviteTokenCollection();
  const tokenHash = sha256(rawToken.trim());

  const doc = (await collection.findOne({ tokenHash })) as InviteTokenDoc | null;
  if (!doc) {
    return { valid: false, reason: "A meghívó link nem létezik." };
  }

  if (doc.usedAt) {
    return { valid: false, reason: "A meghívó linket már felhasználták." };
  }

  if (doc.expiresAt <= Date.now()) {
    return { valid: false, reason: "A meghívó link lejárt (24 óra). Kérj új meghívót." };
  }

  return {
    valid: true,
    normalizedEmail: doc.normalizedEmail,
    expiresAt: doc.expiresAt,
    tokenHash,
  };
}

export async function consumeInviteToken(rawToken: string): Promise<{ success: boolean; normalizedEmail?: string }> {
  const validation = await validateInviteToken(rawToken);
  if (!validation.valid || !validation.tokenHash) {
    return { success: false };
  }
  const collection = await getInviteTokenCollection();
  const res = await collection.updateOne(
    { tokenHash: validation.tokenHash, usedAt: null },
    { $set: { usedAt: Date.now() } }
  );
  if (res.matchedCount === 0) {
    return { success: false };
  }
  return { success: true, normalizedEmail: validation.normalizedEmail };
}

export async function deleteInviteTokensByEmail(normalizedEmail: string): Promise<number> {
  const collection = await getInviteTokenCollection();
  const res = await collection.deleteMany({ normalizedEmail });
  return res.deletedCount || 0;
}
