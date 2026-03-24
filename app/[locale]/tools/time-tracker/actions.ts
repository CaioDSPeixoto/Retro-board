"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getPlanLimits } from "@/lib/auth/plan-check";
import { getTranslations } from "next-intl/server";
import type { TimeTrackerData, BankSign } from "@/types/time-tracker";

const COLLECTION = "user_time_tracker";

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getTimeTrackerData(
  locale: string,
  date?: string,
): Promise<{ data: TimeTrackerData | null } | { error: string }> {
  const userId = await getSession();
  if (!userId) return { data: null };

  const targetDate = date || todayKey();

  const snap = await adminDb
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("date", "==", targetDate)
    .limit(1)
    .get();

  if (snap.empty) return { data: null };

  const doc = snap.docs[0];
  return { data: { id: doc.id, ...(doc.data() as any) } as TimeTrackerData };
}

export async function getTimeTrackerDates(
  locale: string,
): Promise<{ dates: string[] } | { error: string }> {
  const userId = await getSession();
  if (!userId) return { dates: [] };

  const snap = await adminDb
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();

  const dates = snap.docs
    .map((doc) => (doc.data() as any).date as string)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return { dates };
}

export async function saveTimeTrackerData(
  punches: string[],
  workload: string,
  bankTime: string,
  bankSign: BankSign,
  locale: string,
  date?: string,
) {
  const t = await getTranslations({ locale, namespace: "TimeTracker" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const targetDate = date || todayKey();
  const now = new Date().toISOString();

  // Check plan limits for new entries
  const limits = await getPlanLimits();

  const snap = await adminDb
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("date", "==", targetDate)
    .limit(1)
    .get();

  if (snap.empty) {
    // New entry — check limit
    if (limits.maxTimeTrackerDays !== -1) {
      const allSnap = await adminDb
        .collection(COLLECTION)
        .where("userId", "==", userId)
        .get();
      if (allSnap.size >= limits.maxTimeTrackerDays) {
        return { error: t("errors.dayLimitReached") };
      }
    }

    await adminDb.collection(COLLECTION).add({
      userId,
      date: targetDate,
      punches,
      workload,
      bankTime,
      bankSign,
      updatedAt: now,
    });
  } else {
    await adminDb.collection(COLLECTION).doc(snap.docs[0].id).update({
      punches,
      workload,
      bankTime,
      bankSign,
      updatedAt: now,
    });
  }

  revalidatePath(`/${locale}/tools/time-tracker`);
  return { success: true };
}

export async function deleteTimeTrackerEntry(date: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TimeTracker" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const snap = await adminDb
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("date", "==", date)
    .limit(1)
    .get();

  if (snap.empty) return { error: t("errors.notFound") };

  await adminDb.collection(COLLECTION).doc(snap.docs[0].id).delete();

  revalidatePath(`/${locale}/tools/time-tracker`);
  return { success: true };
}
