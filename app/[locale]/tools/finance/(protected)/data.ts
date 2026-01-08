// app/[locale]/tools/finance/(protected)/data.ts
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import type { FinanceBoard, FinanceItem, FinanceBoardInvite } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

/* ================= utils ================= */

function getMonthRange(month: string): { start: string; end: string } {
  // month: "YYYY-MM"
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const start = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, m, 0).getDate(); // m é 1-12
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

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

  const snap = await adminDb
    .collection("finance_boards")
    .where("memberIds", "array-contains", sessionUserId)
    .get();

  const boards: FinanceBoard[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as any;
    boards.push({
      id: doc.id,
      name: data.name,
      ownerId: data.ownerId,
      memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
      createdAt: data.createdAt ?? "",
      isPersonal: data.isPersonal ?? false,
      code: data.code,
      inviteCode: data.inviteCode,
    });
  });

  return boards.sort((a, b) => a.name.localeCompare(b.name));
}

/* ================= categories ================= */

export async function getCategoriesData(): Promise<string[]> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return BUILTIN_CATEGORIES;

  const snap = await adminDb
    .collection("finance_categories")
    .where("userId", "==", sessionUserId)
    .get();

  const userCats = new Set<string>();
  snap.forEach((doc) => {
    const data = doc.data() as any;
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

  // Busca todos os templates ativos do usuário
  const templatesSnap = await adminDb
    .collection("finance_fixed_templates")
    .where("userId", "==", userId)
    .where("active", "==", true)
    .get();

  const allTemplates: {
    id: string;
    title: string;
    amount: number;
    day: number;
    category: string;
    type?: "income" | "expense";
    boardId?: string;
  }[] = [];

  templatesSnap.forEach((doc) => {
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

  // filtra templates do quadro ou pessoais
  const templates = allTemplates.filter((tpl) =>
    boardId ? tpl.boardId === boardId : !tpl.boardId,
  );

  if (templates.length === 0) return existingItems;

  const items = [...existingItems];

  for (const tpl of templates) {
    // verifica se já existe item deste template neste mês
    const alreadyExists = items.some(
      (it) => it.fixedTemplateId === tpl.id && it.date.startsWith(month),
    );
    if (alreadyExists) continue;

    // cria uma nova conta fixa para este mês
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

    // só adiciona boardId se existir (pra não mandar undefined pro Firestore)
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

  let queryRef = adminDb
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
  snap.forEach((doc) => {
    const data = doc.data() as any;
    items.push({
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
      isFixed: data.isFixed,
      isSynthetic: data.isSynthetic,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      paidAmount: data.paidAmount,
      openAmount: data.openAmount,
      carriedFromMonth: data.carriedFromMonth,
      carriedFromItemId: data.carriedFromItemId,
      fixedTemplateId: data.fixedTemplateId,
      installmentGroupId: data.installmentGroupId,
      installmentIndex: data.installmentIndex,
      installmentTotal: data.installmentTotal,
      originalAmount: data.originalAmount,
    });
  });

  // garante que as contas fixas deste mês existam PARA ESSE USUÁRIO
  // (mas a query já trouxe tudo do quadro, inclusive de outros membros)
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
