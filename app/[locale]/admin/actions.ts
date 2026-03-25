"use server";

import { getSession } from "@/lib/auth/session";
import { getUserProfile, listAllUsers, updateUserPlan, updateUserRole } from "@/lib/auth/user-profile";
import { adminUpdateUserSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isRateLimited } from "@/lib/rate-limit";
import type { SubscriptionPlan, UserRole } from "@/types/user";

async function requireAdmin(locale: string) {
  const t = await getTranslations({ locale, namespace: "Admin" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized"), t, userId: null };

  const profile = await getUserProfile(userId);
  if (!profile || profile.role !== "admin") {
    return { error: t("errors.notAdmin"), t, userId: null };
  }

  return { error: null, t, userId };
}

export async function getAdminUsers(locale: string) {
  const { error } = await requireAdmin(locale);
  if (error) return { error, users: [] };

  const users = await listAllUsers();
  return { users };
}

export async function adminUpdateUser(formData: FormData) {
  const locale = String(formData.get("locale") || "pt");
  const { error, t, userId: adminUserId } = await requireAdmin(locale);
  if (error) return { error };

  if (adminUserId && isRateLimited(`admin:${adminUserId}`, 20, 60_000)) {
    return { error: t("errors.tooManyRequests") };
  }

  const raw = {
    userId: String(formData.get("userId") || ""),
    plan: formData.get("plan") ? String(formData.get("plan")) : undefined,
    role: formData.get("role") ? String(formData.get("role")) : undefined,
    subscriptionExpiresAt: formData.get("subscriptionExpiresAt")
      ? String(formData.get("subscriptionExpiresAt"))
      : undefined,
  };

  const parsed = adminUpdateUserSchema.safeParse(raw);
  if (!parsed.success) return { error: t("errors.invalidData") };

  const { userId: targetUserId, plan, role, subscriptionExpiresAt } = parsed.data;

  if (plan) {
    await updateUserPlan(targetUserId, plan as SubscriptionPlan, subscriptionExpiresAt);
  }

  if (role) {
    await updateUserRole(targetUserId, role as UserRole);
  }

  revalidatePath(`/${locale}/admin`);
  return { success: true };
}

export async function getUserUsage(targetUserId: string, locale: string) {
  const { error } = await requireAdmin(locale);
  if (error) return { error };

  const { adminDb } = await import("@/lib/firebase-admin");

  const [boardsSnap, categoriesSnap, todoListsSnap, timeTrackerSnap] = await Promise.all([
    adminDb.collection("finance_boards").where("memberIds", "array-contains", targetUserId).get(),
    adminDb.collection("finance_categories").where("userId", "==", targetUserId).get(),
    adminDb.collection("todo_lists").where("userId", "==", targetUserId).get(),
    adminDb.collection("time_tracker_entries").where("userId", "==", targetUserId).get(),
  ]);

  // Count todos per list
  let totalTodos = 0;
  let maxTodosInList = 0;
  if (!todoListsSnap.empty) {
    const todoCounts = await Promise.all(
      todoListsSnap.docs.map(async (doc) => {
        const snap = await adminDb.collection("todos").where("listId", "==", doc.id).get();
        return snap.size;
      })
    );
    totalTodos = todoCounts.reduce((a, b) => a + b, 0);
    maxTodosInList = Math.max(...todoCounts, 0);
  }

  return {
    usage: {
      boards: boardsSnap.size,
      categories: categoriesSnap.size,
      todoLists: todoListsSnap.size,
      totalTodos,
      maxTodosInList,
      timeTrackerDays: timeTrackerSnap.size,
    },
  };
}

export async function getAdminPlanConfig(locale: string) {
  const { error } = await requireAdmin(locale);
  if (error) return { error };

  const { getStoredPlanLimits } = await import("@/lib/plan-config");
  const limits = await getStoredPlanLimits();
  return { limits };
}

export async function saveAdminPlanConfig(
  limits: Record<string, Record<string, number | boolean>>,
  locale: string,
) {
  const { error, t, userId: adminUserId } = await requireAdmin(locale);
  if (error) return { error };

  if (adminUserId && isRateLimited(`adminPlanConfig:${adminUserId}`, 5, 60_000)) {
    return { error: t("errors.tooManyRequests") };
  }

  const { saveStoredPlanLimits } = await import("@/lib/plan-config");
  await saveStoredPlanLimits(limits as any);

  revalidatePath(`/${locale}/admin`);
  return { success: true };
}
