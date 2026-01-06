// app/[locale]/tools/finance/(protected)/actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceItem, FinanceStatus } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

/* ================= helpers ================= */

async function getBoard(boardId: string): Promise<FinanceBoard | null> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
}

function isMember(board: FinanceBoard, userId: string) {
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];
  return board.ownerId === userId || members.includes(userId);
}

async function canEditItem(existing: FinanceItem, sessionUser: string) {
  if (existing.boardId) {
    const board = await getBoard(existing.boardId);
    if (!board) return false;
    return isMember(board, sessionUser);
  }
  return existing.userId === sessionUser;
}

/* ================= categorias ================= */

export async function createCategory(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome de categoria inválido" };

  if (BUILTIN_CATEGORIES.includes(trimmed)) return { error: "Essa categoria já existe" };

  await adminDb.collection("finance_categories").add({
    userId: sessionUser,
    name: trimmed,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= boards ================= */

export async function createFinanceBoard(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome inválido" };

  const ref = await adminDb.collection("finance_boards").add({
    name: trimmed,
    ownerId: sessionUser,
    memberIds: [sessionUser],
    createdAt: new Date().toISOString(),
    isPersonal: false,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true, boardId: ref.id };
}

/* ================= itens ================= */

export async function addFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const title = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const category = String(formData.get("category") || "");
  const locale = String(formData.get("locale") || "pt").toLowerCase();

  const statusField = formData.get("status") as FinanceStatus | null;
  const isFixedFlag = formData.get("isFixed") === "true";

  const boardIdRaw = String(formData.get("boardId") || "");
  const createdByNameFromForm = String(formData.get("createdByName") || "");

  const amount = parseFloat(amountStr);

  if (!title.trim() || Number.isNaN(amount) || !date || !type) {
    return { error: "Dados incompletos" };
  }
  if (!category.trim()) return { error: "Categoria é obrigatória" };

  // valida board se veio
  let boardId: string | undefined;
  if (boardIdRaw) {
    const board = await getBoard(boardIdRaw);
    if (!board) return { error: "Quadro não encontrado" };
    if (!isMember(board, sessionUser)) return { error: "Sem permissão para lançar neste quadro" };
    boardId = boardIdRaw;
  }

  const status: FinanceStatus = statusField || "pending";
  const paidAmount = status === "paid" ? amount : 0;

  const newItem: Omit<FinanceItem, "id"> = {
    userId: sessionUser,
    title: title.trim(),
    amount,
    date,
    type,
    status,
    category: category.trim(),
    createdAt: new Date().toISOString(),
    paidAmount,
    ...(category.trim() === "Contas Fixas" && isFixedFlag ? { isFixed: true } : {}),
    ...(boardId ? { boardId } : {}),
    createdBy: sessionUser,
    ...(createdByNameFromForm ? { createdByName: createdByNameFromForm } : {}),
  };

  await adminDb.collection("finance_items").add(newItem);

  // fixa => template
  if (category.trim() === "Contas Fixas" && isFixedFlag) {
    const day = parseInt(date.split("-")[2] || "1", 10);
    await adminDb.collection("finance_fixed_templates").add({
      userId: sessionUser,
      title: title.trim(),
      amount,
      day,
      category: category.trim(),
      type,
      createdAt: new Date().toISOString(),
      active: true,
      ...(boardId ? { boardId } : {}),
    });
  }

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const paidAmountStr = String(formData.get("paidAmount") || "");

  const amount = parseFloat(amountStr);
  const paidAmountRaw = paidAmountStr ? parseFloat(paidAmountStr) : 0;

  if (!id || !title.trim() || Number.isNaN(amount) || !date || !category.trim() || !type) {
    return { error: "Dados incompletos" };
  }

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  const paidAmount = Math.max(0, paidAmountRaw);
  let status: FinanceStatus = "pending";
  if (paidAmount >= amount) status = "paid";
  else if (paidAmount > 0) status = "partial";

  await ref.update({
    title: title.trim(),
    amount,
    date,
    category: category.trim(),
    type,
    status,
    paidAmount,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteFinanceItem(id: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  await ref.delete();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function toggleStatus(id: string, currentStatus: FinanceStatus, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  const amount = existing.amount;
  const newStatus: FinanceStatus = currentStatus === "paid" ? "pending" : "paid";
  const paidAmount = newStatus === "paid" ? amount : 0;

  await ref.update({ status: newStatus, paidAmount });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}