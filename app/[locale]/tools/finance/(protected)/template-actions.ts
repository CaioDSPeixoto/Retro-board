"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { mapFinanceTemplate } from "@/lib/finance/schema";
import { checkActionRateLimit } from "@/lib/security/action-guard";
import type { FinanceTemplate } from "@/types/finance";

async function canAccessBoard(boardId: string, userId: string): Promise<boolean> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return false;
  const data = snap.data();
  if (!data) return false;
  const members = Array.isArray(data.memberIds) ? data.memberIds : [];
  return data.ownerId === userId || members.includes(userId);
}

export async function getTemplates(
  boardId: string,
  providedUserId?: string | null,
): Promise<FinanceTemplate[]> {
  const sessionUser = providedUserId || await getSession();
  if (!sessionUser || !boardId) return [];

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return [];

  const snap = await adminDb
    .collection("finance_templates")
    .where("boardId", "==", boardId)
    .get();

  return snap.docs.map(mapFinanceTemplate).sort((a, b) => a.title.localeCompare(b.title));
}

export async function createTemplate(
  boardId: string,
  title: string,
  amount: number,
  type: "income" | "expense",
  category: string,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-template", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  if (!boardId || !title.trim() || !amount || amount <= 0 || !category.trim()) {
    return { error: "Dados incompletos" };
  }

  const allowed = await canAccessBoard(boardId, sessionUser);
  if (!allowed) return { error: "Sem permissão" };

  await adminDb.collection("finance_templates").add({
    boardId,
    title: title.trim().slice(0, 200),
    amount,
    type,
    category: category.trim().slice(0, 100),
    createdBy: sessionUser,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteTemplate(templateId: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_templates").doc(templateId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Template não encontrado" };

  const template = mapFinanceTemplate(snap);
  const allowed = await canAccessBoard(template.boardId, sessionUser);
  if (!allowed) return { error: "Sem permissão" };

  await ref.delete();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
