// app/[locale]/tools/finance/(protected)/data.ts
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import type { FinanceBoard, FinanceItem, FinanceBoardInvite, FinanceCard } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";
import { getMonthRange } from "@/lib/finance/utils";
import { getRealizedBalance } from "@/lib/finance/calculations";
import { canAccessFinanceBoard, mapFinanceItem } from "@/lib/finance/server";

/* ================= utils ================= */

/* ================= invites ================= */

export async function getInvitesData(userId: string): Promise<FinanceBoardInvite[]> {
  if (!userId) return [];

  // Ajuste os filtros conforme está seu modelo de convites hoje.
  const snap = await adminDb
    .collection("finance_board_invites")
    .where("status", "==", "pending")
    .where("userId", "==", userId)
    .get();

  const invites: FinanceBoardInvite[] = snap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      boardId: data.boardId,
      boardName: data.boardName,
      ownerId: data.ownerId,
      type: data.type,
      email: data.email,
      userId: data.userId,
      status: data.status,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      respondedAt: data.respondedAt,
    };
  });

  return invites;
}

/* ================= boards ================= */

export async function getBoardsData(): Promise<FinanceBoard[]> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return [];

  const memberSnap = await adminDb
    .collection("finance_boards")
    .where("memberIds", "array-contains", sessionUserId)
    .get();
  const ownerSnap = await adminDb
    .collection("finance_boards")
    .where("ownerId", "==", sessionUserId)
    .get();

  const boardsById = new Map<string, FinanceBoard>();
  const addBoard = (doc: any) => {
    const data = doc.data() as any;
    boardsById.set(doc.id, {
      id: doc.id,
      name: data.name,
      ownerId: data.ownerId,
      memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
      createdAt: data.createdAt ?? "",
      isPersonal: data.isPersonal ?? false,
      code: data.code,
      inviteCode: data.inviteCode,
    });
  };

  memberSnap.forEach(addBoard);
  ownerSnap.forEach(addBoard);

  return Array.from(boardsById.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/* ================= categories ================= */

export async function getCategoriesData(boardId?: string | null): Promise<string[]> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return BUILTIN_CATEGORIES;

  let query: any = adminDb.collection("finance_categories");

  // Se tiver boardId, filtra por ele.
  // Se não tiver boardId, queremos apenas as categorias pessoais.
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return BUILTIN_CATEGORIES;
    query = query.where("boardId", "==", boardId);
  } else {
    query = query.where("userId", "==", sessionUserId);
    // Para não quebrar legados sem boardId, trazemos tudo do usuário e filtramos em memória.
  }

  const snap = await query.get();

  const userCats = new Set<string>();
  snap.forEach((doc: any) => {
    const data = doc.data() as any;
    // Se pedimos boardId, o filtro do banco já garantiu.
    // Se não pedimos boardId, só queremos as que não têm boardId.
    if (!boardId) {
      if (data.boardId) return;
    }

    if (typeof data.name === "string" && data.name.trim()) {
      userCats.add(data.name.trim());
    }
  });

  const all = new Set<string>([...BUILTIN_CATEGORIES, ...userCats]);
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

/* ================= items ================= */

export async function getFinanceItemsData(
  month: string,
  boardId?: string | null,
): Promise<FinanceItem[]> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return [];

  const { start, end } = getMonthRange(month);
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return [];
  }

  let queryRef: any = adminDb
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
  snap.forEach((doc: any) => {
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
): Promise<number> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return 0;

  const { start } = getMonthRange(month);
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return 0;
  }

  let queryRef: any = adminDb
    .collection("finance_items")
    .where("date", "<", start);

  if (boardId) {
    queryRef = queryRef.where("boardId", "==", boardId);
  } else {
    queryRef = queryRef.where("userId", "==", sessionUserId);
  }

  const snap = await queryRef.get();

  const items: FinanceItem[] = [];
  snap.forEach((doc: any) => {
    items.push(mapFinanceItem(doc));
  });

  return getRealizedBalance(items);
}

export async function getFinanceCardsData(
  boardId?: string | null,
): Promise<FinanceCard[]> {
  const sessionUserId = await getSession();
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

  snap.forEach((doc: any) => {
    const data = doc.data() as any;
    cards.push({
      id: doc.id,
      userId: data.userId,
      boardId: data.boardId,
      name: data.name,
      mode: data.mode,
      lastDigits: data.lastDigits,
      limit: data.limit,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
    });
  });

  return cards.sort((a, b) => a.name.localeCompare(b.name));
}
