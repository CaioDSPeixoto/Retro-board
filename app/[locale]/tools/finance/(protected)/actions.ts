// app/[locale]/tools/finance/(protected)/actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceDebtStatus, FinanceDebtType, FinanceItem, FinanceStatus } from "@/types/finance";
import { ACCOUNT_FIXED_CATEGORY, BUILTIN_CATEGORIES } from "@/lib/finance/constants";
import { getMonthRange } from "@/lib/finance/utils";
import { getTranslations } from "next-intl/server";
import {
  FieldValue,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type UpdateData,
} from "firebase-admin/firestore";
import {
  createMovedFinanceItemPayload,
  mapFinanceBoard,
  mapFinanceCard,
  mapFinanceCategory,
  mapFinanceDebt,
  mapFinanceFixedTemplate,
  mapFinanceItem,
} from "@/lib/finance/schema";
import { checkActionRateLimit, logFinanceAction } from "@/lib/security/action-guard";

/* ================= helpers ================= */

type FirestoreQuery = Query<DocumentData, DocumentData>;
type FirestoreDoc = QueryDocumentSnapshot<DocumentData, DocumentData>;

async function getBoard(boardId: string): Promise<FinanceBoard | null> {
  const snap = await adminDb.collection("finance_boards").doc(boardId).get();
  if (!snap.exists) return null;
  return mapFinanceBoard(snap);
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

function parseMoneyInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;

  if (trimmed.includes(",")) {
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  }

  return parseFloat(trimmed);
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDebtStatus(currentBalance: number, dueDate: string): FinanceDebtStatus {
  if (currentBalance <= 0) return "paid";
  if (dueDate < todayKey()) return "overdue";
  return "active";
}

function createInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

function isAlreadyExistsError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === 6 || code === "already-exists";
}

async function findCarriedItems(itemId: string) {
  const snap = await adminDb
    .collection("finance_items")
    .where("carriedFromItemId", "==", itemId)
    .get();

  return snap.docs;
}

async function deleteCarriedItems(itemId: string) {
  const docs = await findCarriedItems(itemId);
  if (docs.length === 0) return;

  const batch = adminDb.batch();
  docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function deleteDocsInChunks(docs: FirestoreDoc[]) {
  for (let index = 0; index < docs.length; index += 450) {
    const batch = adminDb.batch();
    docs.slice(index, index + 450).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

/* ================= categorias ================= */

export async function createCategory(name: string, locale: string, boardId?: string) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-category", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const trimmed = name.trim();
  if (!trimmed) return { error: t("errors.invalidCategoryName") };

  if (BUILTIN_CATEGORIES.includes(trimmed))
    return { error: t("errors.categoryExists") };

  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: t("errors.boardNotFound") };
    if (!isMember(board, sessionUser)) return { error: t("errors.noPermission") };
  }

  // Verifica duplicidade no contexto (board ou pessoal)
  let query = adminDb
    .collection("finance_categories")
    .where("name", "==", trimmed);

  if (boardId) {
    query = query.where("boardId", "==", boardId);
  } else {
    query = query.where("userId", "==", sessionUser);
    // Para "pessoal", idealmente checaríamos onde boardId não existe,
    // mas Firestore não facilita query de "campo não existe" ou "campo é null"
    // combinado com outros wheres facilmente sem índice. Vamos checar em memória.
  }

  const snap = await query.get();

  let exists = false;
  if (!snap.empty) {
    if (boardId) {
      exists = true;
    } else {
      // Verifica se algum dos docs encontrados também não tem boardId.
      exists = snap.docs.some((doc) => !mapFinanceCategory(doc).boardId);
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
  logFinanceAction("category_created", {
    userId: sessionUser,
    boardId: boardId || null,
    categoryName: trimmed,
  });

  revalidatePath(`/${locale}/tools/finance`);
  revalidatePath(`/${locale}/tools/finance/categories`);
  return { success: true };
}

/* ================= boards ================= */

export async function createFinanceBoard(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-board", {
    limit: 10,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome inválido" };

  const ref = await adminDb.collection("finance_boards").add({
    name: trimmed,
    ownerId: sessionUser,
    memberIds: [sessionUser],
    createdAt: new Date().toISOString(),
    isPersonal: false,
    inviteCode: createInviteCode(),
  });
  logFinanceAction("board_created", {
    userId: sessionUser,
    boardId: ref.id,
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

  const board = mapFinanceBoard(snap);
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

  const board = mapFinanceBoard(snap);
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
  const categoriesSnap = await adminDb
    .collection("finance_categories")
    .where("boardId", "==", boardId)
    .get();
  const cardsSnap = await adminDb
    .collection("finance_cards")
    .where("boardId", "==", boardId)
    .get();
  const templatesSnap = await adminDb
    .collection("finance_fixed_templates")
    .where("boardId", "==", boardId)
    .get();
  const invitesSnap = await adminDb
    .collection("finance_board_invites")
    .where("boardId", "==", boardId)
    .get();

  await deleteDocsInChunks([
    ...itemsSnap.docs,
    ...categoriesSnap.docs,
    ...cardsSnap.docs,
    ...templatesSnap.docs,
    ...invitesSnap.docs,
  ]);
  await ref.delete();

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

  const board = mapFinanceBoard(snap);
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

export async function ensureFixedItemsForCurrentMonth(
  month: string,
  locale: string,
  boardId?: string | null,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Mês inválido" };

  const { start, end } = getMonthRange(month);
  if (!start || !end) return { error: "Mês inválido" };

  if (boardId) {
    const board = await getBoard(boardId);
    if (!board) return { error: "Quadro não encontrado" };
    if (!isMember(board, sessionUser)) return { error: "Sem permissão" };
  }

  let templatesQuery: FirestoreQuery = adminDb
    .collection("finance_fixed_templates")
    .where("active", "==", true);

  if (boardId) {
    templatesQuery = templatesQuery.where("boardId", "==", boardId);
  } else {
    templatesQuery = templatesQuery.where("userId", "==", sessionUser);
  }

  const templatesSnap = await templatesQuery.get();
  if (templatesSnap.empty) return { success: true, created: 0 };

  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNumber = Number(monthStr);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const nowIso = new Date().toISOString();
  let created = 0;

  for (const doc of templatesSnap.docs) {
    const template = mapFinanceFixedTemplate(doc);
    if (boardId ? template.boardId !== boardId : template.boardId) continue;

    const day = Math.min(Math.max(Number(template.day || 1), 1), lastDay);
    const date = `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;
    const itemRef = adminDb
      .collection("finance_items")
      .doc(`fixed_${doc.id}_${month}`);

    const legacyExisting = await adminDb
      .collection("finance_items")
      .where("fixedTemplateId", "==", doc.id)
      .where("date", ">=", start)
      .where("date", "<=", end)
      .limit(1)
      .get();
    if (!legacyExisting.empty) continue;

    const newItem: Omit<FinanceItem, "id"> = {
      userId: boardId ? template.userId || sessionUser : sessionUser,
      title: template.title,
      amount: Number(template.amount || 0),
      date,
      type: template.type,
      status: "pending",
      category: template.category || ACCOUNT_FIXED_CATEGORY,
      createdAt: nowIso,
      isFixed: true,
      isSynthetic: false,
      createdBy: sessionUser,
      fixedTemplateId: doc.id,
      paidAmount: 0,
      ...(boardId ? { boardId } : {}),
    };

    try {
      await itemRef.create(newItem);
      created++;
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
    }
  }

  if (created > 0) revalidatePath(`/${locale}/tools/finance`);
  return { success: true, created };
}

export async function createFinanceCard(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-card", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const modeRaw = String(formData.get("mode") || "credit");
  const lastDigits = String(formData.get("lastDigits") || "").trim();
  const limitRaw = String(formData.get("limit") || "").trim();
  const closingDayRaw = String(formData.get("closingDay") || "").trim();
  const dueDayRaw = String(formData.get("dueDay") || "").trim();

  if (!name) return { error: "Nome do cartão é obrigatório" };
  if (lastDigits && !/^\d{1,4}$/.test(lastDigits)) {
    return { error: "Informe apenas números no final do cartão" };
  }
  const mode = modeRaw === "debit" ? "debit" : "credit";
  const limit = limitRaw ? parseMoneyInput(limitRaw) : undefined;
  const closingDay = closingDayRaw ? Number(closingDayRaw) : undefined;
  const dueDay = dueDayRaw ? Number(dueDayRaw) : undefined;

  if (limit !== undefined && (Number.isNaN(limit) || limit < 0)) {
    return { error: "Limite inválido" };
  }
  if (closingDay !== undefined && (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31)) {
    return { error: "Dia de fechamento inválido" };
  }
  if (dueDay !== undefined && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
    return { error: "Dia de vencimento inválido" };
  }

  await adminDb.collection("finance_cards").add({
    userId: sessionUser,
    name,
    mode,
    createdAt: new Date().toISOString(),
    createdBy: sessionUser,
    ...(lastDigits ? { lastDigits } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(closingDay !== undefined ? { closingDay } : {}),
    ...(dueDay !== undefined ? { dueDay } : {}),
  });
  logFinanceAction("card_created", {
    userId: sessionUser,
    cardMode: mode,
    hasLimit: limit !== undefined,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateFinanceCard(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "").trim();
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const modeRaw = String(formData.get("mode") || "credit");
  const lastDigits = String(formData.get("lastDigits") || "").trim();
  const limitRaw = String(formData.get("limit") || "").trim();
  const closingDayRaw = String(formData.get("closingDay") || "").trim();
  const dueDayRaw = String(formData.get("dueDay") || "").trim();

  if (!id) return { error: "Cartão não encontrado" };
  if (!name) return { error: "Nome do cartão é obrigatório" };
  if (lastDigits && !/^\d{1,4}$/.test(lastDigits)) {
    return { error: "Informe apenas números no final do cartão" };
  }

  const mode = modeRaw === "debit" ? "debit" : "credit";
  const limit = limitRaw ? parseMoneyInput(limitRaw) : undefined;
  const closingDay = closingDayRaw ? Number(closingDayRaw) : undefined;
  const dueDay = dueDayRaw ? Number(dueDayRaw) : undefined;

  if (limit !== undefined && (Number.isNaN(limit) || limit < 0)) {
    return { error: "Limite inválido" };
  }
  if (closingDay !== undefined && (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31)) {
    return { error: "Dia de fechamento inválido" };
  }
  if (dueDay !== undefined && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
    return { error: "Dia de vencimento inválido" };
  }

  const ref = adminDb.collection("finance_cards").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Cartão não encontrado" };

  const existing = mapFinanceCard(snap);
  if (existing.userId !== sessionUser) {
    return { error: "Sem permissão" };
  }

  await ref.update({
    name,
    mode,
    lastDigits: lastDigits || FieldValue.delete(),
    limit: limit !== undefined ? limit : FieldValue.delete(),
    closingDay: closingDay !== undefined ? closingDay : FieldValue.delete(),
    dueDay: dueDay !== undefined ? dueDay : FieldValue.delete(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function deleteFinanceCard(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "").trim();
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  if (!id) return { error: "Cartão não encontrado" };

  const ref = adminDb.collection("finance_cards").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Cartão não encontrado" };

  const existing = mapFinanceCard(snap);
  if (existing.userId !== sessionUser) {
    return { error: "Sem permissão" };
  }

  await ref.delete();

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

/* ================= dividas ================= */

export async function createFinanceDebt(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:create-debt", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const boardId = String(formData.get("boardId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const typeRaw = String(formData.get("type") || "other").trim();
  const originalAmount = parseMoneyInput(String(formData.get("originalAmount") || ""));
  const currentBalanceRaw = String(formData.get("currentBalance") || "").trim();
  const currentBalance = currentBalanceRaw ? parseMoneyInput(currentBalanceRaw) : originalAmount;
  const startDate = String(formData.get("startDate") || todayKey()).trim();
  const dueDate = String(formData.get("dueDate") || startDate).trim();
  const category = String(formData.get("category") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const installmentsRaw = String(formData.get("installments") || "").trim();
  const installments = installmentsRaw ? Number(installmentsRaw) : undefined;
  const debtTypes: FinanceDebtType[] = [
    "card",
    "invoice",
    "house_bill",
    "loan",
    "person",
    "financing",
    "other",
  ];
  const type = debtTypes.includes(typeRaw as FinanceDebtType)
    ? (typeRaw as FinanceDebtType)
    : "other";

  if (!boardId) return { error: "Quadro obrigatorio" };
  const board = await getBoard(boardId);
  if (!board) return { error: "Quadro nao encontrado" };
  if (!isMember(board, sessionUser)) return { error: "Sem permissao" };
  if (!name) return { error: "Nome da divida e obrigatorio" };
  if (Number.isNaN(originalAmount) || originalAmount <= 0) return { error: "Valor original invalido" };
  if (Number.isNaN(currentBalance) || currentBalance < 0) return { error: "Saldo atual invalido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { error: "Data invalida" };
  }
  if (installments !== undefined && (!Number.isInteger(installments) || installments < 1)) {
    return { error: "Parcelas invalidas" };
  }

  const now = new Date().toISOString();
  await adminDb.collection("finance_debts").add({
    userId: sessionUser,
    boardId,
    name,
    type,
    originalAmount,
    currentBalance,
    startDate,
    dueDate,
    status: getDebtStatus(currentBalance, dueDate),
    createdAt: now,
    updatedAt: now,
    createdBy: sessionUser,
    ...(category ? { category } : {}),
    ...(notes ? { notes } : {}),
    ...(installments !== undefined ? { installments } : {}),
  });

  logFinanceAction("debt_created", {
    userId: sessionUser,
    boardId,
    debtType: type,
    originalAmount,
  });
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function payFinanceDebt(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:pay-debt", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const id = String(formData.get("id") || "").trim();
  const amount = parseMoneyInput(String(formData.get("amount") || ""));
  const paidAt = String(formData.get("paidAt") || todayKey()).trim();
  const note = String(formData.get("note") || "").trim();

  if (!id) return { error: "Divida nao encontrada" };
  if (Number.isNaN(amount) || amount <= 0) return { error: "Valor invalido" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return { error: "Data invalida" };

  const ref = adminDb.collection("finance_debts").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Divida nao encontrada" };

  const debt = mapFinanceDebt(snap);
  const board = await getBoard(debt.boardId);
  if (!board || !isMember(board, sessionUser)) return { error: "Sem permissao" };
  if (debt.status === "paid" || debt.currentBalance <= 0) return { error: "Divida ja quitada" };

  const nextBalance = Math.max(Number(debt.currentBalance || 0) - amount, 0);
  const now = new Date().toISOString();
  const batch = adminDb.batch();
  batch.update(ref, {
    currentBalance: nextBalance,
    status: getDebtStatus(nextBalance, debt.dueDate),
    updatedAt: now,
  });
  batch.create(adminDb.collection("finance_debt_payments").doc(), {
    debtId: debt.id,
    boardId: debt.boardId,
    userId: sessionUser,
    amount,
    paidAt,
    createdAt: now,
    ...(note ? { note } : {}),
  });
  await batch.commit();

  logFinanceAction("debt_paid", {
    userId: sessionUser,
    boardId: debt.boardId,
    debtId: debt.id,
    amount,
    nextBalance,
  });

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
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:add-item", {
    limit: 80,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const titleRaw = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const categoryRaw = String(formData.get("category") || "");
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const t = await getTranslations({ locale, namespace: "Finance" });

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
  const cardIdRaw = String(formData.get("cardId") || "");
  const cardLastDigitsRaw = String(formData.get("cardLastDigits") || "");
  const cardName = cardNameRaw.trim();
  const cardId = cardIdRaw.trim();
  const cardLastDigits = cardLastDigitsRaw.trim();
  const cardMode =
    cardModeRaw === "credit" || cardModeRaw === "debit"
      ? (cardModeRaw as "credit" | "debit")
      : undefined;

  const amount = parseFloat(amountStr);
  const title = titleRaw.trim();
  const category = categoryRaw.trim();

  if (!title || Number.isNaN(amount) || !date || !type) {
    return { error: t("errors.incompleteData") };
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

  // Dados comuns a todas as parcelas / lançamentos.
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
    ...(cardId ? { cardId } : {}),
    ...(cardName ? { cardName } : {}),
    ...(cardMode ? { cardMode } : {}),
    ...(cardLastDigits ? { cardLastDigits } : {}),
  };

  // ========== CASO SIMPLES (sem parcelamento) ==========
  if (installments === 1) {
    const status: FinanceStatus = baseStatus;
    const paidAmount = status === "paid" ? amount : 0;

    let fixedTemplateId: string | undefined;

    // Se for "Contas Fixas" com lançamento fixo, cria o template primeiro.
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
    logFinanceAction("item_created", {
      userId: sessionUser,
      boardId: boardId || null,
      type,
      status,
      amount,
      installments: 1,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // ========== PARCELADO (N parcelas) ==========

  const [yearStr, monthStr, dayStr] = date.split("-");
  const baseYear = Number(yearStr);
  const baseMonthIndex = Number(monthStr) - 1; // Date: 0-11
  const baseDay = Number(dayStr) || 1;

  // Distribui o valor entre as parcelas em centavos para não perder 1 centavo.
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

    // A parcela recebe baseCents + 1 centavo enquanto tiver resto.
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

  // Para lançamentos parcelados, não criamos template de "Contas Fixas".
  logFinanceAction("installment_items_created", {
    userId: sessionUser,
    boardId: boardId || null,
    type,
    amount,
    installments,
  });
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function updateFinanceItem(formData: FormData) {
  const locale = String(formData.get("locale") || "pt").toLowerCase();
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "");
  const amountStr = String(formData.get("amount") || "");
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "");
  const type = formData.get("type") as "income" | "expense" | null;
  const paidAmountStr = String(formData.get("paidAmount") || "");

  const cardNameRaw = String(formData.get("cardName") || "");
  const cardModeRaw = String(formData.get("cardMode") || "");
  const cardIdRaw = String(formData.get("cardId") || "");
  const cardLastDigitsRaw = String(formData.get("cardLastDigits") || "");
  const cardName = cardNameRaw.trim();
  const cardId = cardIdRaw.trim();
  const cardLastDigits = cardLastDigitsRaw.trim();
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

  const existing = mapFinanceItem(snap);
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  if (existing.status === "paid" || existing.status === "partial") {
    return {
      error:
        "Não é possível editar lançamentos pagos/recebidos. Reverta a quitação primeiro.",
    };
  }

  const paidAmount = Math.max(0, paidAmountRaw);
  let status: FinanceStatus = "pending";
  if (paidAmount >= amount) status = "paid";
  else if (paidAmount > 0) status = "partial";

  const updateData: UpdateData<DocumentData> = {
    title: title.trim(),
    amount,
    date,
    category: category.trim(),
    type,
    status,
    paidAmount,
  };

  if (cardId) updateData.cardId = cardId;
  if (cardName) updateData.cardName = cardName;
  if (cardMode) updateData.cardMode = cardMode;
  if (cardLastDigits) updateData.cardLastDigits = cardLastDigits;

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

  const existing = mapFinanceItem(snap);
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };

  if (existing.status === "paid" || existing.status === "partial") {
    return { error: "Não é possível excluir lançamentos pagos/recebidos." };
  }

  await deleteCarriedItems(existing.id);
  await ref.delete();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function bulkFinanceItemsAction(
  ids: string[],
  action: "pay" | "move" | "delete",
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const uniqueIds = Array.from(new Set(ids.filter(Boolean))).slice(0, 100);
  if (uniqueIds.length === 0) return { error: "Nenhum lançamento selecionado" };

  let batch = adminDb.batch();
  let batchWrites = 0;
  let changed = 0;
  let skipped = 0;
  const nowIso = new Date().toISOString();

  const commitIfNeeded = async (nextWrites: number) => {
    if (batchWrites + nextWrites <= 450) return;
    if (batchWrites > 0) await batch.commit();
    batch = adminDb.batch();
    batchWrites = 0;
  };

  const registerWrite = (count = 1) => {
    batchWrites += count;
  };

  for (const id of uniqueIds) {
    const ref = adminDb.collection("finance_items").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      skipped++;
      continue;
    }

    const existing = mapFinanceItem(snap);
    const allowed = await canEditItem(existing, sessionUser);
    if (!allowed || existing.isSynthetic) {
      skipped++;
      continue;
    }

    if (action === "delete") {
      if (existing.status === "paid" || existing.status === "partial") {
        skipped++;
        continue;
      }
      const carriedDocs = await findCarriedItems(existing.id);
      await commitIfNeeded(carriedDocs.length + 1);
      carriedDocs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(ref);
      registerWrite(carriedDocs.length + 1);
      changed++;
      continue;
    }

    if (action === "pay") {
      if (existing.status === "paid" || existing.status === "moved") {
        skipped++;
        continue;
      }
      const carriedDocs = await findCarriedItems(existing.id);
      await commitIfNeeded(carriedDocs.length + 1);
      batch.update(ref, {
        status: "paid" as FinanceStatus,
        paidAmount: existing.amount,
        openAmount: 0,
        originalAmount: existing.originalAmount ?? existing.amount,
      });
      carriedDocs.forEach((doc) => batch.delete(doc.ref));
      registerWrite(carriedDocs.length + 1);
      changed++;
      continue;
    }

    if (action === "move") {
      if (existing.status === "paid" || existing.status === "partial" || existing.status === "moved") {
        skipped++;
        continue;
      }
      const [yStr, mStr, dStr] = (existing.date || "").split("-");
      const nextDate = new Date(Number(yStr), Number(mStr) - 1, Number(dStr) || 1);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const newDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
      const newRef = adminDb.collection("finance_items").doc();

      await commitIfNeeded(2);
      batch.update(ref, {
        status: "moved" as FinanceStatus,
        paidAmount: 0,
        originalAmount: existing.originalAmount ?? existing.amount,
      });
      batch.set(newRef, createMovedFinanceItemPayload(existing, newDateStr, nowIso));
      registerWrite(2);
      changed++;
    }
  }

  if (changed === 0) return { error: "Nenhum lançamento elegível para a ação" };
  if (batchWrites > 0) await batch.commit();
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true, changed, skipped };
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

  const existing = mapFinanceItem(snap);
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

export async function revertFinanceItemPayment(id: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound") };

  const existing = mapFinanceItem(snap);
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized") };

  if (existing.status !== "paid") {
    return { error: "Lançamento não está quitado totalmente." };
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
    return { error: "Somente pagamentos totais podem ser revertidos." };
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
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Item não encontrado" };

  const existing = mapFinanceItem(snap);

  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: "Unauthorized" };
  if (existing.isSynthetic) {
    return { error: "Este lançamento não pode ser alterado." };
  }
  if (existing.status === "moved") {
    return { error: "Lançamentos movidos não podem ser pagos." };
  }
  if (existing.status === "paid") {
    return { error: "Lançamento já está quitado." };
  }

  const totalAmount = existing.amount;
  if (typeof totalAmount !== "number" || Number.isNaN(totalAmount)) {
    return { error: "Valor inválido no lançamento" };
  }

  // Helper para calcular data do próximo mês.
  const [yStr, mStr, dStr] = (existing.date || "").split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1; // 0-11
  const day = Number(dStr) || 1;

  const baseDate = new Date(year, month, day);
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  const ny = nextDate.getFullYear();
  const nm = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nd = String(nextDate.getDate()).padStart(2, "0");
  const newDateStr = `${ny}-${nm}-${nd}`;

  // Caso 0: mover para o próximo mês sem pagamento.
  if (mode === "move") {
    if (existing.status === "partial") {
      return { error: "Este lançamento não pode ser movido." };
    }

    const newItemData: Omit<FinanceItem, "id"> = {
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
    if (existing.installmentGroupId) {
      newItemData.installmentGroupId = existing.installmentGroupId;
    }
    if (typeof existing.installmentIndex === "number") {
      newItemData.installmentIndex = existing.installmentIndex;
    }
    if (typeof existing.installmentTotal === "number") {
      newItemData.installmentTotal = existing.installmentTotal;
    }
    if (existing.cardId) newItemData.cardId = existing.cardId;
    if (existing.cardName) newItemData.cardName = existing.cardName;
    if (existing.cardMode) newItemData.cardMode = existing.cardMode;
    if (existing.cardLastDigits) newItemData.cardLastDigits = existing.cardLastDigits;

    const batch = adminDb.batch();
    batch.update(ref, {
      status: "moved" as FinanceStatus,
      paidAmount: 0,
      originalAmount: existing.originalAmount ?? totalAmount,
    });
    batch.set(adminDb.collection("finance_items").doc(), newItemData);
    await batch.commit();

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // Caso 1: marcar como totalmente pago / recebido
  if (mode === "full" || !partialAmountInput) {
    const carriedDocs = await findCarriedItems(existing.id);
    const batch = adminDb.batch();
    batch.update(ref, {
      status: "paid",
      paidAmount: totalAmount,
      openAmount: 0,
      originalAmount: existing.originalAmount ?? totalAmount,
    });
    carriedDocs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  const parsed = parseMoneyInput(partialAmountInput);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return { error: "Valor parcial inválido" };
  }

  const currentPaidAmount = Number(existing.paidAmount || 0);
  const safeCurrentPaidAmount = Number.isFinite(currentPaidAmount)
    ? Math.max(currentPaidAmount, 0)
    : 0;
  const newPaidAmount = Number((safeCurrentPaidAmount + parsed).toFixed(2));
  const remaining = Number((totalAmount - newPaidAmount).toFixed(2));

  if (remaining <= 0) {
    const carriedDocs = await findCarriedItems(existing.id);
    const batch = adminDb.batch();
    batch.update(ref, {
      status: "paid",
      paidAmount: totalAmount,
      openAmount: 0,
      originalAmount: existing.originalAmount ?? totalAmount,
    });
    carriedDocs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  const carriedDocs = await findCarriedItems(existing.id);
  const batch = adminDb.batch();
  batch.update(ref, {
    status: "partial" as FinanceStatus,
    paidAmount: newPaidAmount,
    openAmount: remaining,
    originalAmount: existing.originalAmount ?? totalAmount,
  });
  if (carriedDocs.length > 0) {
    const [first, ...duplicated] = carriedDocs;
    batch.update(first.ref, {
      amount: remaining,
      date: newDateStr,
      status: "pending" as FinanceStatus,
      paidAmount: 0,
      openAmount: remaining,
      fixedTemplateId: FieldValue.delete(),
    });
    duplicated.forEach((doc) => batch.delete(doc.ref));
  } else {
    const newItemData: Omit<FinanceItem, "id"> = {
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
      openAmount: remaining,
      carriedFromMonth: (existing.date || "").slice(0, 7),
      carriedFromItemId: existing.id,
      originalAmount: existing.originalAmount ?? totalAmount,
    };

    if (existing.boardId) newItemData.boardId = existing.boardId;
    if (existing.createdBy) newItemData.createdBy = existing.createdBy;
    if (existing.createdByName) newItemData.createdByName = existing.createdByName;
    if (existing.installmentGroupId) newItemData.installmentGroupId = existing.installmentGroupId;
    if (typeof existing.installmentIndex === "number") newItemData.installmentIndex = existing.installmentIndex;
    if (typeof existing.installmentTotal === "number") newItemData.installmentTotal = existing.installmentTotal;
    if (existing.cardId) newItemData.cardId = existing.cardId;
    if (existing.cardName) newItemData.cardName = existing.cardName;
    if (existing.cardMode) newItemData.cardMode = existing.cardMode;
    if (existing.cardLastDigits) newItemData.cardLastDigits = existing.cardLastDigits;
    batch.set(adminDb.collection("finance_items").doc(), newItemData);
  }
  await batch.commit();

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function getInstallmentGroupItems(id: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "Finance" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized"), items: [] };

  const ref = adminDb.collection("finance_items").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.itemNotFound"), items: [] };

  const existing = mapFinanceItem(snap);
  const allowed = await canEditItem(existing, sessionUser);
  if (!allowed) return { error: t("errors.unauthorized"), items: [] };
  if (!existing.installmentGroupId) return { items: [existing] };

  const groupSnap = await adminDb
    .collection("finance_items")
    .where("installmentGroupId", "==", existing.installmentGroupId)
    .get();

  const rawItems = groupSnap.docs.map(mapFinanceItem);

  const items = rawItems.filter((item) => {
    if (existing.boardId) return item.boardId === existing.boardId;
    return !item.boardId && item.userId === sessionUser;
  });

  items.sort((a, b) => {
    const indexA = a.installmentIndex ?? 0;
    const indexB = b.installmentIndex ?? 0;
    if (indexA !== indexB) return indexA - indexB;
    return a.date.localeCompare(b.date);
  });

  return { items };
}
