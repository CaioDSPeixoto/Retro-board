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

/* ================= fixed templates helper ================= */

async function ensureFixedItemsForMonth(
  userId: string,
  month: string,
  boardId?: string | null,
  existingItems: FinanceItem[] = [],
): Promise<FinanceItem[]> {
  const { start, end } = getMonthRange(month);
  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, userId);
    if (!allowed) return existingItems;
  }

  // Busca todos os templates ativos do usuário.
  let templatesQuery: any = adminDb
    .collection("finance_fixed_templates")
    .where("active", "==", true);

  if (boardId) {
    templatesQuery = templatesQuery.where("boardId", "==", boardId);
  } else {
    templatesQuery = templatesQuery.where("userId", "==", userId);
  }

  const templatesSnap = await templatesQuery.get();

  const allTemplates: {
    id: string;
    title: string;
    amount: number;
    day: number;
    category: string;
    type?: "income" | "expense";
    boardId?: string;
  }[] = [];

  templatesSnap.forEach((doc: any) => {
    const data = doc.data() as any;
    allTemplates.push({
      id: doc.id,
      title: data.title,
      amount: data.amount,
      day: data.day,
      category: data.category,
      type: data.type,
      boardId: data.boardId,
    });
  });

  // Filtra templates do quadro ou pessoais.
  const templates = allTemplates.filter((tpl) =>
    boardId ? tpl.boardId === boardId : !tpl.boardId,
  );

  if (templates.length === 0) return existingItems;

  const items = [...existingItems];

  for (const tpl of templates) {
    // Verifica se já existe item deste template neste mês.
    const alreadyExists = items.some(
      (it) => it.fixedTemplateId === tpl.id && it.date.startsWith(month),
    );
    if (alreadyExists) continue;

    // Cria uma nova conta fixa para este mês.
    const [yStr, mStr] = month.split("-");
    const year = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);

    const lastDay = new Date(year, m, 0).getDate();
    const day = Math.min(Math.max(tpl.day || 1, 1), lastDay);

    const date = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;

    const newItem: Omit<FinanceItem, "id"> = {
      userId,
      title: tpl.title,
      amount: tpl.amount,
      date,
      type: tpl.type || "expense",
      status: "pending",
      category: tpl.category,
      createdAt: new Date().toISOString(),
      isFixed: true,
      isSynthetic: false,
      createdBy: userId,
      fixedTemplateId: tpl.id,
      paidAmount: 0,
    };

    // Só adiciona boardId se existir para não mandar undefined para o Firestore.
    if (boardId) {
      (newItem as any).boardId = boardId;
    }

    const ref = await adminDb.collection("finance_items").add(newItem);
    items.push({ id: ref.id, ...newItem });
  }

  return items;
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

  // Garante que as contas fixas deste mês existam para esse usuário.
  // A query já trouxe tudo do quadro, inclusive de outros membros.
  const withFixed = await ensureFixedItemsForMonth(
    sessionUserId,
    month,
    boardId,
    items,
  );

  return withFixed.sort((a, b) => {
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

  let queryRef: any = adminDb.collection("finance_cards");

  if (boardId) {
    const allowed = await canAccessFinanceBoard(boardId, sessionUserId);
    if (!allowed) return [];
    queryRef = queryRef.where("boardId", "==", boardId);
  } else {
    queryRef = queryRef.where("userId", "==", sessionUserId);
  }

  const snap = await queryRef.get();
  const cards: FinanceCard[] = [];

  snap.forEach((doc: any) => {
    const data = doc.data() as any;
    if (!boardId && data.boardId) return;
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
