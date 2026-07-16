"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { mapFinanceSavingsGoal } from "@/lib/finance/schema";
import { checkActionRateLimit } from "@/lib/security/action-guard";
import type { FinanceSavingsGoal } from "@/types/finance";

async function canAccessBoard(boardId: string, userId: string): Promise<boolean> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return false;
  const data = snap.data();
  if (!data) return false;
  const members = Array.isArray(data.memberIds) ? data.memberIds : [];
  return data.ownerId === userId || members.includes(userId);
}

export async function getSavingsGoals(
  boardId: string,
  providedUserId?: string | null,
): Promise<FinanceSavingsGoal[]> {
  const sessionUser = providedUserId || await getSession();
  if (!sessionUser || !boardId) return [];

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return [];

  const snap = await adminDb
    .collection("finance_goals")
    .where("boardId", "==", boardId)
    .get();

  return snap.docs.map(mapFinanceSavingsGoal).sort((a, b) => a.title.localeCompare(b.title));
}

export async function createSavingsGoal(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-goal", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const boardId = String(formData.get("boardId") || "").trim();
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  const targetAmount = parseFloat(String(formData.get("targetAmount") || ""));
  const deadline = String(formData.get("deadline") || "").trim();
  const icon = String(formData.get("icon") || "").trim().slice(0, 10);

  if (!boardId || !title || !targetAmount || targetAmount <= 0) {
    return { error: "Dados incompletos" };
  }

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return { error: "Sem permissão" };

  await adminDb.collection("finance_goals").add({
    boardId,
    title,
    targetAmount,
    currentAmount: 0,
    createdBy: sessionUser,
    createdAt: new Date().toISOString(),
    ...(deadline ? { deadline } : {}),
    ...(icon ? { icon } : {}),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateGoalAmount(goalId: string, amount: number, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_goals").doc(goalId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Meta não encontrada" };

  const goal = mapFinanceSavingsGoal(snap);
  const allowed = await canAccessBoard(goal.boardId, sessionUser);
  if (!allowed) return { error: "Sem permissão" };

  const newAmount = Math.max(0, amount);
  await ref.update({ currentAmount: newAmount });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteSavingsGoal(goalId: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_goals").doc(goalId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Meta não encontrada" };

  const goal = mapFinanceSavingsGoal(snap);
  const allowed = await canAccessBoard(goal.boardId, sessionUser);
  if (!allowed) return { error: "Sem permissão" };

  await ref.delete();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
