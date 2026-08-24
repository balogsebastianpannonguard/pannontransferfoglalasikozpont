import { getCollection } from "./db";
import crypto from "crypto";

export interface ResetToken {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: number;
}

export async function getResetTokenCollection() {
  return getCollection<ResetToken>("password_reset_tokens");
}

export async function initResetTokenIndexes() {
  const collection = await getResetTokenCollection();
  await collection.createIndex({ token: 1 }, { unique: true });
  await collection.createIndex({ email: 1 });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function createResetToken(email: string): Promise<ResetToken> {
  const collection = await getResetTokenCollection();
  await initResetTokenIndexes();

  // Invalidate old tokens for this email
  await collection.deleteMany({ email });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 2; // 2 hours

  const resetToken: ResetToken = {
    token,
    email,
    expiresAt,
    createdAt: Date.now(),
  };

  await collection.insertOne(resetToken);
  return resetToken;
}

export async function verifyAndConsumeResetToken(token: string): Promise<string | null> {
  const collection = await getResetTokenCollection();
  
  const resetToken = await collection.findOne({ token });
  if (!resetToken) return null;
  if (Date.now() > resetToken.expiresAt) {
    await collection.deleteOne({ token });
    return null;
  }

  // Consume token
  await collection.deleteOne({ token });
  return resetToken.email;
}