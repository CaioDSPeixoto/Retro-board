import "server-only";

import { getSession } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/auth/user-profile";
import { PLAN_LIMITS } from "@/types/user";
import type { PlanLimits, SubscriptionPlan } from "@/types/user";

export async function getCurrentUserPlan(): Promise<SubscriptionPlan> {
  const userId = await getSession();
  if (!userId) return "free";

  const profile = await getUserProfile(userId);
  if (!profile) return "free";

  // Verifica expiração
  if (
    profile.subscriptionExpiresAt &&
    new Date(profile.subscriptionExpiresAt) < new Date()
  ) {
    return "free";
  }

  return profile.plan;
}

export async function getPlanLimits(): Promise<PlanLimits> {
  const plan = await getCurrentUserPlan();
  return PLAN_LIMITS[plan];
}

export async function canCreateBoard(currentBoardCount: number): Promise<boolean> {
  const limits = await getPlanLimits();
  if (limits.maxBoards === -1) return true;
  return currentBoardCount < limits.maxBoards;
}

export async function canExport(): Promise<boolean> {
  const limits = await getPlanLimits();
  return limits.exportEnabled;
}

export async function shouldShowAds(): Promise<boolean> {
  const limits = await getPlanLimits();
  return limits.adsEnabled;
}

export async function isAdmin(): Promise<boolean> {
  const userId = await getSession();
  if (!userId) return false;

  const profile = await getUserProfile(userId);
  return profile?.role === "admin";
}
