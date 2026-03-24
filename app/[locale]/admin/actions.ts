"use server";

import { getSession } from "@/lib/auth/session";
import { getUserProfile, listAllUsers, updateUserPlan, updateUserRole } from "@/lib/auth/user-profile";
import { adminUpdateUserSchema } from "@/lib/validations/finance";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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
  const { error, t } = await requireAdmin(locale);
  if (error) return { error };

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

  const { userId, plan, role, subscriptionExpiresAt } = parsed.data;

  if (plan) {
    await updateUserPlan(userId, plan as SubscriptionPlan, subscriptionExpiresAt);
  }

  if (role) {
    await updateUserRole(userId, role as UserRole);
  }

  revalidatePath(`/${locale}/admin`);
  return { success: true };
}
