"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceItem, FinanceStatus } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

/* ================= helpers ================= */

async function canEditItem(existing: FinanceItem, sessionUser: string) {
  if (existing.boardId) {
    const boardSnap = await adminDb.doc(`finance_boards/${existing.boardId}`).get();
    if (!boardSnap.exists) return false;
    const board = boardSnap.data() as FinanceBoard;
    const members = Array.isArray(board.memberIds) ? board.memberIds : [];
    return members.includes(sessionUser) || board.ownerId === sessionUser;
  }
  return existing.userId === sessionUser;
}

/* ================= categorias ================= */

export async function createCategory(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome de categoria inválido" };

  if (BUILTIN_CATEGORIES.includes(trimmed)) {
    return { error: "Essa categoria já existe" };
  }

  try {
    await adminDb.collection("finance_categories").add({
      userId: sessionUser,
      name: trimmed,
      createdAt: new Date().toISOString(),
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return { error: "Erro ao criar categoria" };
  }
}

/* ================= boards ================= */

export async function createFinanceBoard(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome inválido" };

  try {
    const ref = await adminDb.collection("finance_boards").add({
      name: trimmed,
      ownerId: sessionUser,
      memberIds: [sessionUser],
      createdAt: new Date().toISOString(),
      isPersonal: false,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true, boardId: ref.id };
  } catch (error) {
    console.error("Erro ao criar quadro:", error);
    return { error: "Erro ao criar quadro" };
  }
}

/* ================= itens ================= */

export async function addFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const title = String(formData.get("title") || "").trim();
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const category = String(formData.get("category") || "").trim();
  const locale = String(formData.get("locale") || "pt").toLowerCase();

  const statusField = (formData.get("status") as FinanceStatus | null) ?? null;
  const isFixedFlag = formData.get("isFixed") === "true";

  const boardIdRaw = String(formData.get("boardId") || "").trim();
  const createdByName = String(formData.get("createdByName") || "").trim();

  const amount = Number(amountStr);

  if (!title || !date || !type || !category || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Dados incompletos" };
  }

  // valida boardId se veio
  let boardId: string | undefined;
  if (boardIdRaw) {
    const boardSnap = await adminDb.doc(`finance_boards/${boardIdRaw}`).get();
    if (!boardSnap.exists) return { error: "Quadro não encontrado" };
    const board = boardSnap.data() as FinanceBoard;
    const members = Array.isArray(board.memberIds) ? board.memberIds : [];
    if (!(members.includes(sessionUser) || board.ownerId === sessionUser)) {
      return { error: "Sem permissão para lançar neste quadro" };
    }
    boardId = boardIdRaw;
  }

  const status: FinanceStatus = statusField || "pending";
  const paidAmount = status === "paid" ? amount : 0;

  const newItem: Omit<FinanceItem, "id"> = {
    userId: sessionUser,
    title,
    amount,
    date,
    type,
    status,
    category,
    createdAt: new Date().toISOString(),
    paidAmount,
    ...(category === "Contas Fixas" && isFixedFlag ? { isFixed: true } : {}),
    ...(boardId ? { boardId } : {}),
    createdBy: sessionUser,
    ...(createdByName ? { createdByName } : {}),
  };

  try {
    await adminDb.collection("finance_items").add(newItem);

    // template se fixa
    if (category === "Contas Fixas" && isFixedFlag) {
      const day = Number((date.split("-")[2] || "1").replace(/^0+/, "")) || 1;

      await adminDb.collection("finance_fixed_templates").add({
        userId: sessionUser,
        title,
        amount,
        day,
        category,
        type,
        createdAt: new Date().toISOString(),
        active: true,
        ...(boardId ? { boardId } : {}),
      });
    }

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Error adding item:", error);
    return { error: "Erro ao salvar" };
  }
}

export async function updateFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "").trim();
  const type = formData.get("type") as "income" | "expense" | null;
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const paidAmountStr = String(formData.get("paidAmount") || "0");

  const amount = Number(amountStr);
  const paidAmountRaw = Number(paidAmountStr);

  if (!id || !title || !date || !category || !type || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Dados incompletos" };
  }

  try {
    const ref = adminDb.doc(`finance_items/${id}`);
    const snap = await ref.get();
    if (!snap.exists) return { error: "Item não encontrado" };

    const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;

    const allowed = await canEditItem(existing, sessionUser);
    if (!allowed) return { error: "Unauthorized" };

    const paidAmount = Math.max(0, Number.isFinite(paidAmountRaw) ? paidAmountRaw : 0);

    let status: FinanceStatus = "pending";
    if (paidAmount >= amount) status = "paid";
    else if (paidAmount > 0) status = "partial";

    await ref.update({
      title,
      amount,
      date,
      category,
      type,
      status,
      paidAmount,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return { error: "Erro ao atualizar" };
  }
}

export async function deleteFinanceItem(id: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  try {
    const ref = adminDb.collection("finance_items").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { error: "Item não encontrado" };

    const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;

    const allowed = await canEditItem(existing, sessionUser);
    if (!allowed) return { error: "Unauthorized" };

    await ref.delete();

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return { error: "Erro ao deletar" };
  }
}

export async function toggleStatus(id: string, currentStatus: FinanceStatus, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  try {
    const ref = adminDb.doc(`finance_items/${id}`);
    const snap = await ref.get();
    if (!snap.exists) return { error: "Item não encontrado" };

    const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;

    const allowed = await canEditItem(existing, sessionUser);
    if (!allowed) return { error: "Unauthorized" };

    const amount = existing.amount;
    let newStatus: FinanceStatus;
    let paidAmount = existing.paidAmount || 0;

    if (currentStatus === "paid") {
      newStatus = "pending";
      paidAmount = 0;
    } else {
      newStatus = "paid";
      paidAmount = amount;
    }

    await ref.update({ status: newStatus, paidAmount });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { error: "Erro ao atualizar status" };
  }
}