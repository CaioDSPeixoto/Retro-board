// app/[locale]/tools/finance/(protected)/actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceItem, FinanceStatus } from "@/types/finance";
import { ACCOUNT_FIXED_CATEGORY, BUILTIN_CATEGORIES } from "@/lib/finance/constants";

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

export async function createCategory(name: string, locale: string, boardId?: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome de categoria inválido" };

  if (BUILTIN_CATEGORIES.includes(trimmed))
    return { error: "Essa categoria já existe" };

  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: "Quadro não encontrado" };
    if (!isMember(board, sessionUser)) return { error: "Sem permissão" };
  }

  // Verifica duplicidade no contexto (board ou pessoal)
  let query = adminDb
    .collection("finance_categories")
    .where("userId", "==", sessionUser)
    .where("name", "==", trimmed);

  if (boardId) {
    query = query.where("boardId", "==", boardId);
  } else {
    // Para "pessoal", idealmente checaríamos onde boardId não existe
    // mas Firestore não facilita query de "campo não existe" ou "campo é null" combinado com outros wheres facilmente sem index.
    // Vamos checar na memória se houver colisão.
  }

  const snap = await query.get();

  let exists = false;
  if (!snap.empty) {
    if (boardId) {
      exists = true;
    } else {
      // verifica se algum dos docs encontrados tbm não tem boardId
      exists = snap.docs.some(d => !d.data().boardId);
    }
  }

  if (exists) {
    return { error: "Essa categoria já existe" };
  }

  await adminDb.collection("finance_categories").add({
    userId: sessionUser,
    name: trimmed,
    createdAt: new Date().toISOString(),
    ...(boardId ? { boardId } : {}),
  });

  revalidatePath(`/${locale}/tools/finance`);
  revalidatePath(`/${locale}/tools/finance/categories`);
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

export async function renameFinanceBoard(
  boardId: string,
  newName: string,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Nome inválido" };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Quadro não encontrado" };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: "Somente o dono pode renomear" };

  await ref.update({ name: trimmed });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteFinanceBoard(
  boardId: string,
  confirmName: string,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Quadro não encontrado" };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: "Somente o dono pode excluir" };

  if (board.name.trim().toLowerCase() !== confirmName.trim().toLowerCase()) {
    return { error: "Nome do quadro não confere" };
  }

  // apaga items do quadro
  const itemsSnap = await adminDb
    .collection("finance_items")
    .where("boardId", "==", boardId)
    .get();

  const batch = adminDb.batch();
  itemsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);

  await batch.commit();

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function removeMemberFromBoard(
  boardId: string,
  memberId: string,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Quadro não encontrado" };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: "Somente o dono pode remover membros" };

  const members = Array.isArray(board.memberIds) ? board.memberIds : [];
  const newMembers = members.filter((id) => id !== memberId);
  if (newMembers.length === 0) {
    return { error: "Quadro precisa ter pelo menos 1 membro" };
  }

  await ref.update({ memberIds: newMembers });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= itens ================= */

/**
 * Cria 1 ou várias transações.
 * - Sem parcelamento (parcelas=1): mantém o comportamento atual.
 * - Com parcelamento (parcelas>1): cria N lançamentos, um em cada mês,
 *   com o VALOR DIVIDIDO entre as parcelas e metadados de grupo.
 */
export async function addFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const titleRaw = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const categoryRaw = String(formData.get("category") || "");
  const locale = String(formData.get("locale") || "pt").toLowerCase();

  const statusField = formData.get("status") as FinanceStatus | null;
  const isFixedFlag = formData.get("isFixed") === "true";

  const boardIdRaw = String(formData.get("boardId") || "");
  const createdByNameFromForm = String(formData.get("createdByName") || "");

  const installmentsStr = String(formData.get("installments") || "1");
  let installments = parseInt(installmentsStr, 10);
  if (Number.isNaN(installments) || installments < 1) installments = 1;
  if (installments > 60) installments = 60;

  const cardNameRaw = String(formData.get("cardName") || "");
  const cardModeRaw = String(formData.get("cardMode") || "");
  const cardName = cardNameRaw.trim();
  const cardMode =
    cardModeRaw === "credit" || cardModeRaw === "debit"
      ? (cardModeRaw as "credit" | "debit")
      : undefined;

  const amount = parseFloat(amountStr);
  const title = titleRaw.trim();
  const category = categoryRaw.trim();

  if (!title || Number.isNaN(amount) || !date || !type) {
    return { error: "Dados incompletos" };
  }
  if (!category) return { error: "Categoria é obrigatória" };

  // valida board se veio
  let boardId: string | undefined;
  if (boardIdRaw) {
    const board = await getBoard(boardIdRaw);
    if (!board) return { error: "Quadro não encontrado" };
    if (!isMember(board, sessionUser))
      return { error: "Sem permissão para lançar neste quadro" };
    boardId = boardIdRaw;
  }

  const baseStatus: FinanceStatus = statusField || "pending";
  const nowIso = new Date().toISOString();

  // dados comuns a todas as parcelas / lançamentos
  const baseCommon: Omit<FinanceItem, "id" | "amount" | "date" | "status"> = {
    userId: sessionUser,
    title,
    type,
    category,
    createdAt: nowIso,
    ...(category === ACCOUNT_FIXED_CATEGORY && isFixedFlag ? { isFixed: true } : {}),
    ...(boardId ? { boardId } : {}),
    createdBy: sessionUser,
    ...(createdByNameFromForm ? { createdByName: createdByNameFromForm } : {}),
    ...(cardName ? { cardName } : {}),
    ...(cardMode ? { cardMode } : {}),
  };

  // ========== CASO SIMPLES (sem parcelamento) ==========
  if (installments === 1) {
    const status: FinanceStatus = baseStatus;
    const paidAmount = status === "paid" ? amount : 0;

    let fixedTemplateId: string | undefined;

    // se for "Contas Fixas" com lançamento fixo, cria o template primeiro
    if (category === ACCOUNT_FIXED_CATEGORY && isFixedFlag) {
      const day = parseInt(date.split("-")[2] || "1", 10);

      const tplRef = await adminDb.collection("finance_fixed_templates").add({
        userId: sessionUser,
        title,
        amount,
        day,
        category,
        type,
        createdAt: nowIso,
        active: true,
        ...(boardId ? { boardId } : {}),
      });

      fixedTemplateId = tplRef.id;
    }

    const newItem: Omit<FinanceItem, "id"> = {
      ...baseCommon,
      amount,
      date,
      status,
      paidAmount,
      ...(fixedTemplateId ? { fixedTemplateId } : {}),
    };

    await adminDb.collection("finance_items").add(newItem);

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // ========== PARCELADO (N parcelas) ==========

  const [yearStr, monthStr, dayStr] = date.split("-");
  const baseYear = Number(yearStr);
  const baseMonthIndex = Number(monthStr) - 1; // Date: 0-11
  const baseDay = Number(dayStr) || 1;

  // distribui o valor entre as parcelas em centavos (para não “perder” 1 centavo)
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainder = totalCents - baseCents * installments;

  // group id para todas as parcelas
  const installmentGroupId = adminDb.collection("finance_items").doc().id;

  for (let i = 0; i < installments; i++) {
    const d = new Date(baseYear, baseMonthIndex + i, baseDay);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    // parcela i recebe baseCents + 1 centavo enquanto tiver “resto”
    const thisCents = baseCents + (i < remainder ? 1 : 0);
    const installmentAmount = thisCents / 100;

    const isFirst = i === 0;
    const status: FinanceStatus = isFirst ? baseStatus : "pending";
    const paidAmount = status === "paid" ? installmentAmount : 0;

    const titleWithInstallment = `${title} (${i + 1}/${installments})`;

    const item: Omit<FinanceItem, "id"> = {
      ...baseCommon,
      title: titleWithInstallment,
      amount: installmentAmount,
      date: dateStr,
      status,
      paidAmount,
      installmentGroupId,
      installmentIndex: i + 1,
      installmentTotal: installments,
      originalAmount: amount,
    };

    await adminDb.collection("finance_items").add(item);
  }

  // Para lançamentos parcelados, NÃO criamos template de "Contas Fixas"
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

  const cardNameRaw = String(formData.get("cardName") || "");
  const cardModeRaw = String(formData.get("cardMode") || "");
  const cardName = cardNameRaw.trim();
  const cardMode =
    cardModeRaw === "credit" || cardModeRaw === "debit"
      ? (cardModeRaw as "credit" | "debit")
      : undefined;

  const amount = parseFloat(amountStr);
  const paidAmountRaw = paidAmountStr ? parseFloat(paidAmountStr) : 0;

  if (
    !id ||
    !title.trim() ||
    Number.isNaN(amount) ||
    !date ||
    !category.trim() ||
    !type
  ) {
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

  const updateData: any = {
    title: title.trim(),
    amount,
    date,
    category: category.trim(),
    type,
    status,
    paidAmount,
  };

  if (cardName) updateData.cardName = cardName;
  if (cardMode) updateData.cardMode = cardMode;

  await ref.update(updateData);

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

export async function toggleStatus(
  id: string,
  currentStatus: FinanceStatus,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  const amount = existing.amount;
  const newStatus: FinanceStatus =
    currentStatus === "paid" ? "pending" : "paid";
  const paidAmount = newStatus === "paid" ? amount : 0;

  await ref.update({ status: newStatus, paidAmount });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function applyPaymentToFinanceItem(
  id: string,
  mode: "full" | "partial" | "move",
  partialAmountInput: string | null,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;

  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  const totalAmount = existing.amount;
  if (typeof totalAmount !== "number" || Number.isNaN(totalAmount)) {
    return { error: "Valor inválido no lançamento" };
  }

  // helper pra calcular data do próximo mês
  const [yStr, mStr, dStr] = (existing.date || "").split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1; // 0–11
  const day = Number(dStr) || 1;

  const baseDate = new Date(year, month, day);
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  const ny = nextDate.getFullYear();
  const nm = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nd = String(nextDate.getDate()).padStart(2, "0");
  const newDateStr = `${ny}-${nm}-${nd}`;

  // 🔹 Caso 0: mover para o próximo mês (sem pagamento)
  if (mode === "move") {
    await ref.update({
      status: "moved" as FinanceStatus,
      paidAmount: 0,
      originalAmount: existing.originalAmount ?? totalAmount,
    });

    const newItemData: any = {
      userId: existing.userId,
      title: existing.title,
      amount: totalAmount,
      date: newDateStr,
      type: existing.type,
      status: "pending" as FinanceStatus,
      category: existing.category,
      createdAt: new Date().toISOString(),
      isFixed: existing.isFixed ?? false,
      isSynthetic: false,
      paidAmount: 0,
      carriedFromMonth: (existing.date || "").slice(0, 7),
      carriedFromItemId: existing.id,
      originalAmount: existing.originalAmount ?? totalAmount,
    };

    if (existing.boardId) newItemData.boardId = existing.boardId;
    if (existing.createdBy) newItemData.createdBy = existing.createdBy;
    if (existing.createdByName) newItemData.createdByName = existing.createdByName;
    if (existing.fixedTemplateId) {
      newItemData.fixedTemplateId = existing.fixedTemplateId;
    }
    if (existing.installmentGroupId) {
      newItemData.installmentGroupId = existing.installmentGroupId;
    }
    if (typeof existing.installmentIndex === "number") {
      newItemData.installmentIndex = existing.installmentIndex;
    }
    if (typeof existing.installmentTotal === "number") {
      newItemData.installmentTotal = existing.installmentTotal;
    }
    if (existing.cardName) newItemData.cardName = existing.cardName;
    if (existing.cardMode) newItemData.cardMode = existing.cardMode;

    await adminDb.collection("finance_items").add(newItemData);

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // 🔹 Caso 1: marcar como totalmente pago / recebido
  if (mode === "full" || !partialAmountInput) {
    await ref.update({
      status: "paid",
      paidAmount: totalAmount,
      originalAmount: existing.originalAmount ?? totalAmount,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // 🔹 Caso 2: pagamento parcial
  const parsed = parseFloat(
    partialAmountInput.replace(".", "").replace(",", "."),
  );

  if (Number.isNaN(parsed) || parsed <= 0) {
    return { error: "Valor parcial inválido" };
  }

  // Se o valor informado for >= total, trata como total
  if (parsed >= totalAmount) {
    await ref.update({
      status: "paid",
      paidAmount: totalAmount,
      originalAmount: existing.originalAmount ?? totalAmount,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  const remaining = Number((totalAmount - parsed).toFixed(2));
  if (remaining <= 0) {
    await ref.update({
      status: "paid",
      paidAmount: totalAmount,
      originalAmount: existing.originalAmount ?? totalAmount,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // original vira item pago com o valor parcial
  await ref.update({
    status: "paid",
    amount: parsed,
    paidAmount: parsed,
    originalAmount: existing.originalAmount ?? totalAmount,
  });

  // novo lançamento com o restante no mês seguinte
  const newItemData: any = {
    userId: existing.userId,
    title: existing.title,
    amount: remaining,
    date: newDateStr,
    type: existing.type,
    status: "pending" as FinanceStatus,
    category: existing.category,
    createdAt: new Date().toISOString(),
    isFixed: existing.isFixed ?? false,
    isSynthetic: false,
    paidAmount: 0,
    carriedFromMonth: (existing.date || "").slice(0, 7),
    carriedFromItemId: existing.id,
    originalAmount: existing.originalAmount ?? totalAmount,
  };

  if (existing.boardId) newItemData.boardId = existing.boardId;
  if (existing.createdBy) newItemData.createdBy = existing.createdBy;
  if (existing.createdByName) newItemData.createdByName = existing.createdByName;
  if (existing.fixedTemplateId) {
    newItemData.fixedTemplateId = existing.fixedTemplateId;
  }
  if (existing.installmentGroupId) {
    newItemData.installmentGroupId = existing.installmentGroupId;
  }
  if (typeof existing.installmentIndex === "number") {
    newItemData.installmentIndex = existing.installmentIndex;
  }
  if (typeof existing.installmentTotal === "number") {
    newItemData.installmentTotal = existing.installmentTotal;
  }
  if (existing.cardName) newItemData.cardName = existing.cardName;
  if (existing.cardMode) newItemData.cardMode = existing.cardMode;

  await adminDb.collection("finance_items").add(newItemData);

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
