// app/[locale]/tools/finance/(protected)/data.ts
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import type { FinanceBoard, FinanceItem, FinanceBoardInvite, FinanceCard, FinanceDebt, FinanceDebtPayment } from "@/types/finance";
import type { DocumentData, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";
import { getMonthRange, getPreviousMonthKey } from "@/lib/finance/utils";
import { getRealizedBalance } from "@/lib/finance/calculations";
import { canAccessFinanceBoard, mapFinanceItem } from "@/lib/finance/server";
import {
  mapFinanceBoard,
  mapFinanceBoardInvite,
  mapFinanceCard,
  mapFinanceCategory,
  mapFinanceDebt,
  mapFinanceDebtPayment,
  mapFinanceFixedTemplate,
  type FinanceFixedTemplateDocument,
} from "@/lib/finance/schema";

/* ================= utils ================= */

type FirestoreQuery = Query<DocumentData, DocumentData>;
type FirestoreDoc = QueryDocumentSnapshot<DocumentData, DocumentData>;

async function resolveUserId(providedUserId?: string | null): Promise<string | null> {
  if (providedUserId) return providedUserId;
  return getSession();
}

/* ================= invites ================= */

export async function getInvitesData(userId: string): Promise<FinanceBoardInvite[]> {
  if (!userId) return [];

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("status", "==", "pending")
    .where("userId", "==", userId)
    .get();

  const invites: FinanceBoardInvite[] = snap.docs.map(mapFinanceBoardInvite);

  return invites;
}

/* ================= boards ================= */

export async function getBoardsData(providedUserId?: string | null): Promise<FinanceBoard[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return [];

  const memberSnap = await adminDb
    .collection("finance_boards")
    .where("memberIds", "array-contains", sessionUserId)
    .get();

  const boardsById = new Map<string, FinanceBoard>();
  memberSnap.forEach((doc: FirestoreDoc) => {
    boardsById.set(doc.id, mapFinanceBoard(doc));
  });

  return Array.from(boardsById.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/* ================= categories ================= */

export async function getCategoriesData(boardId?: string | null, providedUserId?: string | null): Promise<string[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return BUILTIN_CATEGORIES;

  let query: FirestoreQuery = adminDb.collection("finance_categories");

  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return BUILTIN_CATEGORIES;
    query = query.where("boardId", "==", boardId);
  } else {
    query = query.where("userId", "==", sessionUserId);
  }

  const snap = await query.get();

  const userCats = new Set<string>();
  snap.forEach((doc: FirestoreDoc) => {
    const category = mapFinanceCategory(doc);
    if (!boardId) {
      if (category.boardId) return;
    }

    if (category.name) userCats.add(category.name);
  });

  const all = new Set<string>([...BUILTIN_CATEGORIES, ...userCats]);
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

/* ================= items ================= */

export async function getFinanceItemsData(
  month: string,
  boardId?: string | null,
  providedUserId?: string | null,
): Promise<FinanceItem[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return [];

  const { start, end } = getMonthRange(month);
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return [];
  }

  let queryRef: FirestoreQuery = adminDb
    .collection("finance_items")
    .where("date", ">=", start)
    .where("date", "<=", end);

  if (boardId) {
    queryRef = queryRef.where("boardId", "==", boardId);
  } else {
    queryRef = queryRef.where("userId", "==", sessionUserId);
  }

  const snap = await queryRef.get();

  const items: FinanceItem[] = [];
  snap.forEach((doc: FirestoreDoc) => {
    items.push(mapFinanceItem(doc));
  });

  return items.sort((a, b) => {
    if (a.date === b.date) return a.title.localeCompare(b.title);
    return a.date.localeCompare(b.date);
  });
}

export async function getCashBalanceBeforeMonth(
  month: string,
  boardId?: string | null,
  providedUserId?: string | null,
): Promise<number> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return 0;

  const { start } = getMonthRange(month);
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return 0;
  }

  let queryRef: FirestoreQuery = adminDb
    .collection("finance_items")
    .where("date", "<", start);

  if (boardId) {
    queryRef = queryRef.where("boardId", "==", boardId);
  } else {
    queryRef = queryRef.where("userId", "==", sessionUserId);
  }

  const snap = await queryRef.get();

  const items: FinanceItem[] = [];
  snap.forEach((doc: FirestoreDoc) => {
    items.push(mapFinanceItem(doc));
  });

  return getRealizedBalance(items);
}

export async function getPreviousMonthCashBalance(
  month: string,
  boardId?: string | null,
  providedUserId?: string | null,
): Promise<number> {
  const previousMonth = getPreviousMonthKey(month);
  const items = await getFinanceItemsData(previousMonth, boardId, providedUserId);
  return getRealizedBalance(items);
}

export async function getFinanceFixedTemplatesData(
  boardId?: string | null,
  providedUserId?: string | null,
): Promise<FinanceFixedTemplateDocument[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return [];

  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return [];
  }

  let queryRef: FirestoreQuery = adminDb
    .collection("finance_fixed_templates")
    .where("active", "==", true);

  if (boardId) {
    queryRef = queryRef.where("boardId", "==", boardId);
  } else {
    queryRef = queryRef.where("userId", "==", sessionUserId);
  }

  const snap = await queryRef.get();
  const templates: FinanceFixedTemplateDocument[] = [];

  snap.forEach((doc: FirestoreDoc) => {
    const template = mapFinanceFixedTemplate(doc);
    if (boardId ? template.boardId !== boardId : template.boardId) return;
    templates.push(template);
  });

  return templates.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getFinanceDebtsData(boardId?: string | null, providedUserId?: string | null): Promise<FinanceDebt[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId || !boardId) return [];

  const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
  if (!allowed) return [];

  const snap = await adminDb
    .collection("finance_debts")
    .where("boardId", "==", boardId)
    .get();

  const debts: FinanceDebt[] = [];
  snap.forEach((doc: FirestoreDoc) => {
    debts.push(mapFinanceDebt(doc));
  });

  return debts.sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export async function getFinanceDebtPaymentsData(boardId?: string | null, providedUserId?: string | null): Promise<FinanceDebtPayment[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId || !boardId) return [];

  const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
  if (!allowed) return [];

  const snap = await adminDb
    .collection("finance_debt_payments")
    .where("boardId", "==", boardId)
    .get();

  const payments: FinanceDebtPayment[] = [];
  snap.forEach((doc: FirestoreDoc) => {
    payments.push(mapFinanceDebtPayment(doc));
  });

  return payments.sort((a, b) => a.paidAt.localeCompare(b.paidAt));
}

export async function getFinanceCardsData(
  boardId?: string | null,
  providedUserId?: string | null,
): Promise<FinanceCard[]> {
  const sessionUserId = await resolveUserId(providedUserId);
  if (!sessionUserId) return [];

  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return [];
  }

  const queryRef = adminDb
    .collection("finance_cards")
    .where("userId", "==", sessionUserId);

  const snap = await queryRef.get();
  const cards: FinanceCard[] = [];
  snap.forEach((doc: FirestoreDoc) => {
    cards.push(mapFinanceCard(doc));
  });

  return cards.sort((a, b) => a.name.localeCompare(b.name));
}
