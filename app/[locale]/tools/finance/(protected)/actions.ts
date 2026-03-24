// app/[locale]/tools/finance/(protected)/actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceItem, FinanceStatus, InterestConfig, InterestType, InvestmentAllocation, InvestmentCategory, InvestmentBucket, BucketAllocationType, SubItem, ChartGroupBy, ChartDataPoint, CategoryChartDataPoint } from "@/types/finance";
import { ACCOUNT_FIXED_CATEGORY, BUILTIN_CATEGORIES, INVESTMENT_CATEGORIES } from "@/lib/finance/constants";
import { calculateInterestInstallments } from "@/lib/finance/utils";
import { canCreateBoard } from "@/lib/auth/plan-check";
import { getPlanLimits } from "@/lib/auth/plan-check";
import { getTranslations } from "next-intl/server";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, getISOWeek } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { isRateLimited } from "@/lib/rate-limit";

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
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const trimmed = name.trim();
  if (!trimmed) return { error: t("errors.invalidCategoryName") };

  if (BUILTIN_CATEGORIES.includes(trimmed))
    return { error: t("errors.categoryExists") };

  // Check plan limit for custom categories
  const limits = await getPlanLimits();
  if (limits.maxCustomCategories !== -1) {
    let countQuery = adminDb
      .collection("finance_categories")
      .where("userId", "==", sessionUser);
    if (boardId) {
      countQuery = countQuery.where("boardId", "==", boardId);
    }
    const countSnap = await countQuery.get();
    const customCount = boardId
      ? countSnap.size
      : countSnap.docs.filter((d) => !d.data().boardId).length;
    if (customCount >= limits.maxCustomCategories) {
      return { error: t("errors.categoryLimitReached") };
    }
  }

  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: t("errors.boardNotFound") };
    if (!isMember(board, sessionUser)) return { error: t("errors.noPermission") };
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
    return { error: t("errors.categoryExists") };
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
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const trimmed = name.trim();
  if (!trimmed) return { error: t("errors.invalidName") };

  // Feature flag: verificar limite de boards do plano
  const existingBoards = await adminDb
    .collection("finance_boards")
    .where("ownerId", "==", sessionUser)
    .get();
  const allowed = await canCreateBoard(existingBoards.size);
  if (!allowed) return { error: t("errors.boardLimitReached") };

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
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const trimmed = newName.trim();
  if (!trimmed) return { error: t("errors.invalidName") };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.boardNotFound") };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: t("errors.onlyOwnerCanRename") };

  await ref.update({ name: trimmed });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteFinanceBoard(
  boardId: string,
  confirmName: string,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.boardNotFound") };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: t("errors.onlyOwnerCanDelete") };

  if (board.name.trim().toLowerCase() !== confirmName.trim().toLowerCase()) {
    return { error: t("errors.boardNameMismatch") };
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
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_boards").doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.boardNotFound") };

  const board = { id: snap.id, ...(snap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser)
    return { error: t("errors.onlyOwnerCanRemoveMembers") };

  const members = Array.isArray(board.memberIds) ? board.memberIds : [];
  const newMembers = members.filter((id) => id !== memberId);
  if (newMembers.length === 0) {
    return { error: t("errors.boardNeedsOneMember") };
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
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (isRateLimited(`finance:write:${sessionUser}`, 30)) {
    return { error: t("errors.rateLimited") };
  }

  const titleRaw = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const categoryRaw = String(formData.get("category") || "");

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

  // ========== JUROS ==========
  const interestTypeRaw = String(formData.get("interestType") || "");
  const interestRateStr = String(formData.get("interestRate") || "");
  const interestFixedStr = String(formData.get("interestFixed") || "");

  // ========== INVESTIMENTO ==========
  const investmentCategoryRaw = formData.get("investmentCategory") as string | null;
  const validInvestmentCategory =
    investmentCategoryRaw && INVESTMENT_CATEGORIES.includes(investmentCategoryRaw as any)
      ? (investmentCategoryRaw as InvestmentCategory)
      : undefined;

  const amount = parseFloat(amountStr);
  const title = titleRaw.trim();
  const category = categoryRaw.trim();

  if (!title || Number.isNaN(amount) || !date || !type) {
    return { error: t("errors.incompleteData") };
  }
  if (!category) return { error: t("errors.categoryRequired") };

  // valida board se veio
  let boardId: string | undefined;
  if (boardIdRaw) {
    const board = await getBoard(boardIdRaw);
    if (!board) return { error: t("errors.boardNotFound") };
    if (!isMember(board, sessionUser))
      return { error: t("errors.noPermission") };
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
    ...(validInvestmentCategory ? { investmentCategory: validInvestmentCategory } : {}),
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

    const newRef = await adminDb.collection("finance_items").add(newItem);

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true, itemId: newRef.id };
  }

  // ========== PARCELADO (N parcelas) ==========

  const [yearStr, monthStr, dayStr] = date.split("-");
  const baseYear = Number(yearStr);
  const baseMonthIndex = Number(monthStr) - 1; // Date: 0-11
  const baseDay = Number(dayStr) || 1;

  // distribui o valor entre as parcelas em centavos (para não "perder" 1 centavo)
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainder = totalCents - baseCents * installments;

  // group id para todas as parcelas
  const installmentGroupId = adminDb.collection("finance_items").doc().id;

  // ========== JUROS: build config e calcular parcelas ==========
  let interestConfig: InterestConfig | undefined;
  let interestBreakdowns: { base: number; interest: number; total: number }[] | undefined;

  const validInterestTypes: InterestType[] = ["percentage", "fixed", "both"];
  if (
    validInterestTypes.includes(interestTypeRaw as InterestType) &&
    installments > 1
  ) {
    const rate = parseFloat(interestRateStr);
    const fixedAmount = parseFloat(interestFixedStr);

    interestConfig = {
      type: interestTypeRaw as InterestType,
      ...(!Number.isNaN(rate) && rate > 0 ? { rate } : {}),
      ...(!Number.isNaN(fixedAmount) && fixedAmount > 0 ? { fixedAmount } : {}),
    };

    interestBreakdowns = calculateInterestInstallments(amount, installments, interestConfig);
  }

  for (let i = 0; i < installments; i++) {
    const d = new Date(baseYear, baseMonthIndex + i, baseDay);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    let installmentAmount: number;
    let interestAmount: number | undefined;

    if (interestBreakdowns) {
      // Use interest-calculated values
      installmentAmount = interestBreakdowns[i].total;
      interestAmount = interestBreakdowns[i].interest;
    } else {
      // Original cent distribution (no interest)
      const thisCents = baseCents + (i < remainder ? 1 : 0);
      installmentAmount = thisCents / 100;
    }

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
      ...(interestConfig ? { interestConfig } : {}),
      ...(interestAmount !== undefined ? { interestAmount } : {}),
    };

    await adminDb.collection("finance_items").add(item);
  }

  // Para lançamentos parcelados, NÃO criamos template de "Contas Fixas"
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateFinanceItem(formData: FormData) {
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (isRateLimited(`finance:write:${sessionUser}`, 30)) {
    return { error: t("errors.rateLimited") };
  }

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "");
  const type = formData.get("type") as "income" | "expense" | null;
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
    return { error: t("errors.incompleteData") };
  }

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  if (existing.status === "paid" || existing.status === "partial") {
    return {
      error: t("errors.cannotEditPaid"),
    };
  }

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
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (isRateLimited(`finance:write:${sessionUser}`, 30)) {
    return { error: t("errors.rateLimited") };
  }

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  if (existing.status === "paid" || existing.status === "partial") {
    return { error: t("errors.cannotDeletePaid") };
  }

  if (existing.status === "moved") {
    return { error: t("errors.cannotDeleteMoved") };
  }

  if (existing.carriedFromMonth || existing.carriedFromItemId) {
    return { error: t("errors.cannotDeleteCarried") };
  }

  if (existing.installmentGroupId) {
    return { error: t("errors.cannotDeleteInstallment") };
  }

  // Delete sub-items in cascade (if any)
  const subItemsSnap = await ref.collection("sub_items").get();
  if (!subItemsSnap.empty) {
    const batch = adminDb.batch();
    subItemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await ref.delete();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function toggleStatus(
  id: string,
  currentStatus: FinanceStatus,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  const amount = existing.amount;
  const newStatus: FinanceStatus =
    currentStatus === "paid" ? "pending" : "paid";
  const paidAmount = newStatus === "paid" ? amount : 0;

  await ref.update({ status: newStatus, paidAmount });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function revertFinanceItemPayment(id: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  if (existing.status !== "paid") {
    return { error: t("errors.notFullyPaid") };
  }

  const paidAmount = Number(existing.paidAmount || 0);
  const amount = Number(existing.amount || 0);
  const originalAmount = Number(existing.originalAmount ?? amount);
  if (
    !Number.isFinite(paidAmount) ||
    !Number.isFinite(amount) ||
    !Number.isFinite(originalAmount) ||
    paidAmount < amount ||
    originalAmount > amount
  ) {
    return { error: t("errors.onlyFullPaymentsRevertible") };
  }

  await ref.update({ status: "pending" as FinanceStatus, paidAmount: 0 });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function applyPaymentToFinanceItem(
  id: string,
  mode: "full" | "partial" | "move",
  partialAmountInput: string | null,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;

  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  const totalAmount = existing.amount;
  if (typeof totalAmount !== "number" || Number.isNaN(totalAmount)) {
    return { error: t("errors.invalidAmount") };
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
    return { error: t("errors.invalidPartialAmount") };
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


/* ================= redistribuição de parcelas ================= */

export async function redistributeInstallments(
  groupId: string,
  newAmounts: number[],
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  // Buscar todas as parcelas do grupo
  const snap = await adminDb
    .collection("finance_items")
    .where("installmentGroupId", "==", groupId)
    .get();

  if (snap.empty) return { error: t("errors.itemNotFound") };

  const installments = snap.docs.map(
    (doc) => ({ id: doc.id, ...(doc.data() as any) }) as FinanceItem,
  );

  // Verificar permissão via board ou ownership
  const first = installments[0];
  if (first.boardId) {
    const board = await getBoard(first.boardId);
    if (!board || !isMember(board, sessionUser))
      return { error: t("errors.noPermission") };
  } else if (first.userId !== sessionUser) {
    return { error: t("errors.noPermission") };
  }

  // Filtrar parcelas pendentes (somente essas serão atualizadas)
  const pendingInstallments = installments.filter(
    (item) => item.status === "pending",
  );

  if (newAmounts.length !== pendingInstallments.length) {
    return { error: t("errors.incompleteData") };
  }

  // Calcular total original do grupo (soma de todas as parcelas, incluindo pagas/movidas)
  const originalTotalCents = installments.reduce(
    (sum, item) => sum + Math.round(item.amount * 100),
    0,
  );

  // Calcular soma dos valores não-editáveis (paid, partial, moved)
  const nonPendingTotalCents = installments
    .filter((item) => item.status !== "pending")
    .reduce((sum, item) => sum + Math.round(item.amount * 100), 0);

  // Calcular soma dos novos valores
  const newTotalCents = newAmounts.reduce(
    (sum, val) => sum + Math.round(val * 100),
    0,
  );

  // Validar que soma dos novos valores + não-editáveis = total original (tolerância 1 centavo)
  const diff = Math.abs(originalTotalCents - (nonPendingTotalCents + newTotalCents));
  if (diff > 1) {
    return { error: t("errors.redistributionMismatch") };
  }

  // Ordenar parcelas pendentes por installmentIndex para manter consistência
  pendingInstallments.sort(
    (a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0),
  );

  // Atualizar parcelas pendentes via batch write
  try {
    const batch = adminDb.batch();

    for (let i = 0; i < pendingInstallments.length; i++) {
      const installment = pendingInstallments[i];
      const ref = adminDb.collection("finance_items").doc(installment.id);
      batch.update(ref, { amount: newAmounts[i] });
    }

    await batch.commit();
  } catch {
    return { error: t("errors.redistributionFailed") };
  }

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= sub-itens ================= */

export async function addSubItem(
  itemId: string,
  title: string,
  amount: number,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (!title.trim() || amount <= 0) {
    return { error: t("errors.invalidSubItem") };
  }

  const ref = adminDb.collection("finance_items").doc(itemId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.noPermission") };

  if (existing.status !== "pending") {
    return { error: t("errors.cannotEditPaidItem") };
  }

  await ref.collection("sub_items").add({
    title: title.trim(),
    amount,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateSubItem(
  itemId: string,
  subItemId: string,
  title: string,
  amount: number,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (!title.trim() || amount <= 0) {
    return { error: t("errors.invalidSubItem") };
  }

  const ref = adminDb.collection("finance_items").doc(itemId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.noPermission") };

  if (existing.status !== "pending") {
    return { error: t("errors.cannotEditPaidItem") };
  }

  await ref.collection("sub_items").doc(subItemId).update({
    title: title.trim(),
    amount,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteSubItem(
  itemId: string,
  subItemId: string,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_items").doc(itemId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = { id: snap.id, ...(snap.data() as any) } as FinanceItem;
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.noPermission") };

  if (existing.status !== "pending") {
    return { error: t("errors.cannotEditPaidItem") };
  }

  await ref.collection("sub_items").doc(subItemId).delete();

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= investimentos ================= */

export async function saveInvestmentConfig(
  boardId: string | null,
  allocations: InvestmentAllocation[],
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  // Validate board membership if boardId provided
  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: t("errors.boardNotFound") };
    if (!isMember(board, sessionUser)) return { error: t("errors.noPermission") };
  }

  // Validate allocations sum to 100% (with 1% tolerance for rounding)
  const sum = allocations.reduce((acc, a) => acc + a.percentage, 0);
  if (Math.abs(sum - 100) > 1) {
    return { error: t("errors.allocationSumInvalid") };
  }

  // Check if config already exists for this user + board
  let query = adminDb
    .collection("finance_investment_configs")
    .where("userId", "==", sessionUser);

  if (boardId) {
    query = query.where("boardId", "==", boardId);
  }

  const snap = await query.get();

  // Filter for exact match (personal configs have no boardId field)
  const existing = snap.docs.find((doc) => {
    const data = doc.data() as any;
    if (boardId) return data.boardId === boardId;
    return !data.boardId;
  });

  const now = new Date().toISOString();

  if (existing) {
    // Update existing config
    await adminDb.collection("finance_investment_configs").doc(existing.id).update({
      allocations,
      updatedAt: now,
    });
  } else {
    // Create new config
    await adminDb.collection("finance_investment_configs").add({
      userId: sessionUser,
      ...(boardId ? { boardId } : {}),
      allocations,
      updatedAt: now,
    });
  }

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= investment buckets ================= */

export async function saveBucket(
  data: {
    id?: string;
    boardId: string;
    name: string;
    currentBalance: number;
    allocationType: BucketAllocationType | null;
    allocationValue: number;
    linkedIncomeItemId: string | null;
    linkedIncomeTitle: string | null;
  },
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "FinanceInvestments" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.saveFailed") };

  const board = await getBoard(data.boardId);
  if (!board) return { error: t("errors.saveFailed") };
  if (!isMember(board, sessionUser)) return { error: t("errors.saveFailed") };

  if (!data.name.trim()) return { error: t("errors.emptyName") };
  if (data.currentBalance < 0) return { error: t("errors.invalidBalance") };
  if (data.allocationType && data.allocationValue <= 0) return { error: t("errors.invalidAllocationValue") };
  if (data.allocationType && !data.linkedIncomeItemId) return { error: t("errors.needLinkedIncome") };

  const now = new Date().toISOString();

  if (data.id) {
    // Update existing bucket
    const docRef = adminDb.collection("investment_buckets").doc(data.id);
    const existing = await docRef.get();
    if (!existing.exists) return { error: t("errors.bucketNotFound") };

    await docRef.update({
      name: data.name.trim(),
      currentBalance: data.currentBalance,
      allocationType: data.allocationType,
      allocationValue: data.allocationType ? data.allocationValue : 0,
      linkedIncomeItemId: data.allocationType ? data.linkedIncomeItemId : null,
      linkedIncomeTitle: data.allocationType ? data.linkedIncomeTitle : null,
      updatedAt: now,
    });
  } else {
    // Create new bucket
    await adminDb.collection("investment_buckets").add({
      userId: sessionUser,
      boardId: data.boardId,
      name: data.name.trim(),
      currentBalance: data.currentBalance,
      allocationType: data.allocationType,
      allocationValue: data.allocationType ? data.allocationValue : 0,
      linkedIncomeItemId: data.allocationType ? data.linkedIncomeItemId : null,
      linkedIncomeTitle: data.allocationType ? data.linkedIncomeTitle : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteBucket(bucketId: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "FinanceInvestments" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.deleteFailed") };

  const docRef = adminDb.collection("investment_buckets").doc(bucketId);
  const snap = await docRef.get();
  if (!snap.exists) return { error: t("errors.bucketNotFound") };

  const data = snap.data() as any;
  if (data.userId !== sessionUser) return { error: t("errors.deleteFailed") };

  await docRef.delete();

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateBucketBalance(
  bucketId: string,
  newBalance: number,
  locale: string,
) {
  const t = await getTranslations({ locale, namespace: "FinanceInvestments" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.saveFailed") };

  if (newBalance < 0) return { error: t("errors.invalidBalance") };

  const docRef = adminDb.collection("investment_buckets").doc(bucketId);
  const snap = await docRef.get();
  if (!snap.exists) return { error: t("errors.bucketNotFound") };

  const data = snap.data() as any;
  if (data.userId !== sessionUser) return { error: t("errors.saveFailed") };

  await docRef.update({
    currentBalance: newBalance,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= gráficos ================= */

function getDateLocale(locale: string) {
  if (locale === "pt") return ptBR;
  if (locale === "es") return es;
  return enUS;
}

export async function getChartData(
  boardId: string | null,
  period: string,
  groupBy: ChartGroupBy,
  locale: string,
): Promise<{ lineData: ChartDataPoint[]; barData: CategoryChartDataPoint[] } | { error: string }> {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: t("errors.boardNotFound") };
    if (!isMember(board, sessionUser)) return { error: t("errors.noPermission") };
  }

  // Determine date range based on groupBy
  let startDate: string;
  let endDate: string;

  if (groupBy === "week") {
    // Items within the specified month, grouped by week number
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    startDate = format(monthStart, "yyyy-MM-dd");
    endDate = format(monthEnd, "yyyy-MM-dd");
  } else if (groupBy === "month") {
    // Last 12 months ending at the specified month
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const periodEnd = endOfMonth(new Date(year, month - 1, 1));
    const periodStart = startOfMonth(subMonths(new Date(year, month - 1, 1), 11));
    startDate = format(periodStart, "yyyy-MM-dd");
    endDate = format(periodEnd, "yyyy-MM-dd");
  } else {
    // "year" — all available data grouped by year
    startDate = "2000-01-01";
    endDate = "2099-12-31";
  }

  // Query finance_items with timeout
  const timeoutMs = 10_000;
  let items: FinanceItem[];

  try {
    const queryPromise = (async () => {
      let queryRef = adminDb
        .collection("finance_items")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate);

      if (boardId) {
        queryRef = queryRef.where("boardId", "==", boardId);
      } else {
        queryRef = queryRef.where("userId", "==", sessionUser);
      }

      const snap = await queryRef.get();

      return snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userId: data.userId,
          boardId: data.boardId,
          title: data.title,
          amount: data.amount,
          date: data.date,
          type: data.type,
          status: data.status,
          category: data.category,
          createdAt: data.createdAt,
        } as FinanceItem;
      });
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeoutMs),
    );

    items = await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    return { error: t("errors.incompleteData") };
  }

  // Filter out items with status "moved"
  const filtered = items.filter((item) => item.status !== "moved");

  // Group items by period
  const dateLocale = getDateLocale(locale);

  function deriveGroupKeyAndLabel(itemDate: Date): { groupKey: string; label: string } {
    if (groupBy === "week") {
      const weekNum = getISOWeek(itemDate);
      const label = locale === "pt" ? `Sem ${weekNum}` : locale === "es" ? `Sem ${weekNum}` : `Wk ${weekNum}`;
      return { groupKey: `w${weekNum}`, label };
    } else if (groupBy === "month") {
      const groupKey = format(itemDate, "yyyy-MM");
      let label = format(itemDate, "MMM yyyy", { locale: dateLocale });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      return { groupKey, label };
    } else {
      const year = format(itemDate, "yyyy");
      return { groupKey: year, label: year };
    }
  }

  const lineMap = new Map<string, { income: number; expense: number }>();
  const barMap = new Map<string, Map<string, number>>();
  const labelMap = new Map<string, string>();

  for (const item of filtered) {
    const itemDate = parseISO(item.date);
    const { groupKey, label } = deriveGroupKeyAndLabel(itemDate);

    if (!labelMap.has(groupKey)) {
      labelMap.set(groupKey, label);
    }

    // Line chart data
    if (!lineMap.has(groupKey)) {
      lineMap.set(groupKey, { income: 0, expense: 0 });
    }
    const entry = lineMap.get(groupKey)!;
    if (item.type === "income") {
      entry.income += item.amount;
    } else {
      entry.expense += item.amount;
    }

    // Bar chart data (expenses by category)
    if (item.type === "expense") {
      if (!barMap.has(groupKey)) {
        barMap.set(groupKey, new Map<string, number>());
      }
      const catMap = barMap.get(groupKey)!;
      catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.amount);
    }
  }

  // Build sorted keys
  const sortedKeys = Array.from(lineMap.keys()).sort();

  // Build lineData
  const lineData: ChartDataPoint[] = sortedKeys.map((key) => {
    const entry = lineMap.get(key)!;
    const income = Math.round(entry.income * 100) / 100;
    const expense = Math.round(entry.expense * 100) / 100;
    return {
      label: labelMap.get(key) ?? key,
      income,
      expense,
      balance: Math.round((income - expense) * 100) / 100,
    };
  });

  // Build barData
  const barData: CategoryChartDataPoint[] = sortedKeys.map((key) => {
    const point: CategoryChartDataPoint = {
      label: labelMap.get(key) ?? key,
    };
    const catMap = barMap.get(key);
    if (catMap) {
      for (const [category, total] of catMap) {
        point[category] = Math.round(total * 100) / 100;
      }
    }
    return point;
  });

  return { lineData, barData };
}
