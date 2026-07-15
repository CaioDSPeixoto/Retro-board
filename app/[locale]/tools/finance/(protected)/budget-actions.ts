"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { mapFinanceBudget } from "@/lib/finance/schema";
import { checkActionRateLimit } from "@/lib/security/action-guard";
import type { FinanceBudget } from "@/types/finance";

async function canAccessBoard(boardId: string, userId: string): Promise<boolean> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return false;
  const data = snap.data();
  if (!data) return false;
  const members = Array.isArray(data.memberIds) ? data.memberIds : [];
  return data.ownerId === userId || members.includes(userId);
}

export async function getBudgetsForMonth(
  boardId: string,
  month: string,
  providedUserId?: string | null,
): Promise<FinanceBudget[]> {
  const sessionUser = providedUserId || await getSession();
  if (!sessionUser || !boardId) return [];

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return [];

  const snap = await adminDb
    .collection("finance_budgets")
    .where("boardId", "==", boardId)
    .where("month", "==", month)
    .get();

  return snap.docs.map(mapFinanceBudget);
}

export async function upsertBudget(
  boardId: string,
  month: string,
  category: string,
  limit: number,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const rateLimitError = checkActionRateLimit(sessionUser, "finance:upsert-budget", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  if (!boardId || !month || !category) return { error: t("errors.incompleteData") };
  if (limit < 0 || !Number.isFinite(limit)) return { error: t("errors.debtCurrentBalanceInvalid") };

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return { error: t("errors.noPermission") };

  // Check if budget already exists for this board/month/category
  const existing = await adminDb
    .collection("finance_budgets")
    .where("boardId", "==", boardId)
    .where("month", "==", month)
    .where("category", "==", category)
    .limit(1)
    .get();

  if (!existing.empty) {
    const docRef = existing.docs[0].ref;
    if (limit === 0) {
      await docRef.delete();
    } else {
      await docRef.update({ limit });
    }
  } else if (limit > 0) {
    await adminDb.collection("finance_budgets").add({
      boardId,
      month,
      category,
      limit,
      createdBy: sessionUser,
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
