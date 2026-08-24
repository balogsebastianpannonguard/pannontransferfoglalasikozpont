import bcrypt from "bcryptjs";
import { getCollection } from "./db";
export { MIN_PASSWORD_LENGTH, validatePasswordComplexity } from "./password-rules";
export type { PasswordRequirementCheck, PasswordRequirementChecks } from "./password-rules";

export const FAILED_LOGIN_THRESHOLD = 5;
export const FAILED_LOGIN_LOCK_MINUTES = 15;
export const PASSWORD_BCRYPT_ROUNDS = 12;

export interface CrmUser {
  _id?: import("mongodb").ObjectId;
  email: string;
  normalizedEmail: string;
  hashedPassword: string | null;
  isInviteAccepted: boolean;
  isActive: boolean;
  requireTwoFactor: boolean;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: number | null;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
  role: "admin" | "user";
}

const COLLECTION_NAME = "users";

export async function getUserCollection() {
  return getCollection<CrmUser>(COLLECTION_NAME);
}

export async function initUserIndexes() {
  const collection = await getUserCollection();
  try {
    await collection.createIndex({ normalizedEmail: 1 }, { unique: true });
    await collection.createIndex({ lockedUntil: 1 }, { expireAfterSeconds: 0 });
  } catch {
    // ignore
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createPendingInviteUser(
  email: string,
  options?: { requireTwoFactor?: boolean }
): Promise<CrmUser> {
  const normalizedEmail = normalizeEmail(email);
  const requireTwoFactor = !!options?.requireTwoFactor;
  const collection = await getUserCollection();
  await initUserIndexes();

  const existing = await collection.findOne({ normalizedEmail });
  if (existing) {
    // Ha már létező user, akkor reseteljük a jelszavát és invite state-t, hogy újra megnézhesse
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          hashedPassword: null,
          isInviteAccepted: false,
            requireTwoFactor,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: Date.now(),
        },
      }
    );
    const updated = await collection.findOne({ _id: existing._id });
    if (!updated) throw new Error("Nem sikerült frissíteni a meglévő felhasználót.");
    return updated as CrmUser;
  }

  const now = Date.now();
  const newUser: CrmUser = {
    email: email.trim(),
    normalizedEmail,
    hashedPassword: null,
    isInviteAccepted: false,
    isActive: true,
    requireTwoFactor,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    role: "user",
  };

  const res = await collection.insertOne(newUser as any);
  const created = await collection.findOne({ _id: res.insertedId });
  if (!created) throw new Error("Nem sikerült létrehozni a felhasználót.");
  return created as CrmUser;
}

export async function findUserByEmail(email: string): Promise<CrmUser | null> {
  const collection = await getUserCollection();
  const normalizedEmail = normalizeEmail(email);
  const doc = await collection.findOne({ normalizedEmail });
  return (doc as CrmUser) || null;
}

export async function setUserPassword(userId: import("mongodb").ObjectId, password: string) {
  const collection = await getUserCollection();
  const hashedPassword = await bcrypt.hash(password, PASSWORD_BCRYPT_ROUNDS);
  await collection.updateOne(
    { _id: userId },
    {
      $set: {
        hashedPassword,
        isInviteAccepted: true,
        updatedAt: Date.now(),
      },
    }
  );
  return true;
}

export async function compareUserPassword(user: CrmUser, password: string): Promise<boolean> {
  if (!user.hashedPassword) return false;
  return bcrypt.compare(password, user.hashedPassword);
}

export async function setUserTwoFactor(
  userId: import("mongodb").ObjectId,
  secret: string,
  enabled: boolean = true
) {
  const collection = await getUserCollection();
  await collection.updateOne(
    { _id: userId },
    {
      $set: {
        twoFactorSecret: secret,
        twoFactorEnabled: enabled,
        updatedAt: Date.now(),
      },
    }
  );
  return true;
}

export async function isUserLocked(user: CrmUser): Promise<{ locked: boolean; remainingSeconds: number }> {
  if (!user.lockedUntil || user.lockedUntil <= 0) {
    return { locked: false, remainingSeconds: 0 };
  }
  const now = Date.now();
  if (user.lockedUntil > now) {
    const remaining = Math.ceil((user.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds: remaining };
  }
  // lejárt a lock, töröljük
  const collection = await getUserCollection();
  await collection.updateOne(
    { _id: user._id },
    {
      $set: { lockedUntil: null, failedLoginAttempts: 0, updatedAt: Date.now() },
    }
  );
  return { locked: false, remainingSeconds: 0 };
}

export async function recordFailedLogin(user: CrmUser): Promise<{ locked: boolean; remainingSeconds: number }> {
  const collection = await getUserCollection();
  const nextAttempts = (user.failedLoginAttempts || 0) + 1;

  if (nextAttempts >= FAILED_LOGIN_THRESHOLD) {
    const lockedUntil = Date.now() + FAILED_LOGIN_LOCK_MINUTES * 60 * 1000;
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: nextAttempts,
          lockedUntil,
          updatedAt: Date.now(),
        },
      }
    );
    return { locked: true, remainingSeconds: FAILED_LOGIN_LOCK_MINUTES * 60 };
  } else {
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: nextAttempts,
          updatedAt: Date.now(),
        },
      }
    );
    return { locked: false, remainingSeconds: 0 };
  }
}

export async function recordSuccessfulLogin(userId: import("mongodb").ObjectId) {
  const collection = await getUserCollection();
  await collection.updateOne(
    { _id: userId },
    {
      $set: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
  return true;
}

import type { ObjectId } from "mongodb";
import { deleteInviteTokensByEmail } from "./invite-tokens";

export async function listAllUsers(): Promise<CrmUser[]> {
  const collection = await getUserCollection();
  await initUserIndexes();
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => d as unknown as CrmUser);
}

export interface DeleteUserResult {
  success: boolean;
  userDeleted: boolean;
  tokensDeleted: number;
}

export async function deleteUserById(userId: ObjectId | string): Promise<DeleteUserResult> {
  const collection = await getUserCollection();
  const oid: ObjectId =
    typeof userId === "string" ? (new (await import("mongodb")).ObjectId(userId) as ObjectId) : userId;

  const user = (await collection.findOne({ _id: oid })) as CrmUser | null;
  if (!user) {
    return { success: false, userDeleted: false, tokensDeleted: 0 };
  }

  const tokensDeleted = await deleteInviteTokensByEmail(user.normalizedEmail);
  const delRes = await collection.deleteOne({ _id: oid });

  return {
    success: delRes.deletedCount > 0,
    userDeleted: delRes.deletedCount > 0,
    tokensDeleted,
  };
}

export async function updateUserLockStatus(userId: ObjectId | string, isLocked: boolean): Promise<boolean> {
  const collection = await getUserCollection();
  const oid: ObjectId =
    typeof userId === "string" ? (new (await import("mongodb")).ObjectId(userId) as ObjectId) : userId;

  const updateDoc: any = {
    $set: { updatedAt: Date.now() }
  };

  if (isLocked) {
    // Lock for 100 years basically (permanent until unlocked)
    updateDoc.$set.lockedUntil = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
  } else {
    // Unlock
    updateDoc.$set.lockedUntil = null;
    updateDoc.$set.failedLoginAttempts = 0;
  }

  const res = await collection.updateOne({ _id: oid }, updateDoc);
  return res.modifiedCount > 0;
}

