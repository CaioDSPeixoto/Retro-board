import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import type { UserProfile, SubscriptionPlan, UserRole } from "@/types/user";

const COLLECTION = "user_profiles";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const doc = await adminDb.collection(COLLECTION).doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as any) } as UserProfile;
}

export async function ensureUserProfile(
  userId: string,
  email: string,
  displayName?: string,
): Promise<UserProfile> {
  const existing = await getUserProfile(userId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const profile: Omit<UserProfile, "id"> = {
    email,
    displayName: displayName || email.split("@")[0],
    role: "user",
    plan: "free",
    subscriptionStatus: "active",
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection(COLLECTION).doc(userId).set(profile);
  return { id: userId, ...profile };
}

export async function updateUserPlan(
  userId: string,
  plan: SubscriptionPlan,
  expiresAt?: string,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(userId).update({
    plan,
    subscriptionStatus: "active",
    ...(expiresAt ? { subscriptionExpiresAt: expiresAt } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(userId).update({
    role,
    updatedAt: new Date().toISOString(),
  });
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await adminDb.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }) as UserProfile);
}
