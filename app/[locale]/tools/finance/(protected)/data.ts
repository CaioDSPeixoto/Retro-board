// app/[locale]/tools/finance/(protected)/data.ts
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import type { FinanceBoard, FinanceItem, FinanceBoardInvite, SubItem, InvestmentConfig, InvestmentCategory } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";
import { getMonthRange } from "@/lib/finance/utils";

/* ================= utils ================= */

/* ================= investimentos ================= */

export async function getInvestmentConfig(
  boardId?: string | null,
): Promise<InvestmentConfig | null> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return null;

  let query = adminDb
    .collection("finance_investment_configs")
    .where("userId", "==", sessionUserId);

  if (boardId) {
    query = query.where("boardId", "==", boardId);
  }

  const snap = await query.get();

  // Find exact match (personal configs have no boardId field)
  const doc = snap.docs.find((d) => {
    const data = d.data() as any;
    if (boardId) return data.boardId === boardId;
    return !data.boardId;
  });

  if (!doc) return null;

  const data = doc.data() as any;
  return {
    id: doc.id,
    userId: data.userId,
    boardId: data.boardId,
    allocations: data.allocations ?? [],
    updatedAt: data.updatedAt,
  };
}

/* ================= sub-itens ================= */

export async function getSubItems(itemId: string): Promise<SubItem[]> {
  const snap = await adminDb
    .collection("finance_items")
    .doc(itemId)
    .collection("sub_items")
    .get();

  const subItems: SubItem[] = snap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      title: data.title,
      amount: data.amount,
      createdAt: data.createdAt,
    };
  });

  return subItems.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

export async function getCategoriesData(boardId?: string | null): Promise<string[]> {
  const sessionUserId = await getSession();
  if (!sessionUserId) return BUILTIN_CATEGORIES;

  let query = adminDb.collection("finance_categories").where("userId", "==", sessionUserId);

  // Se tiver boardId, filtra por ele.
  // Se NÃO tiver boardId, queremos as "pessoais" (sem boardId) ou todas?
  // Por compatibilidade e lógica de "meus dados", se não passar boardId,
  // vamos trazer as que NÃO têm boardId (pessoais) OU manter o comportamento antigo (todas)?
  // O pedido é "particular tendo cada quadro...".
  // Então, se estou num quadro, só quero ver as do quadro.
  if (boardId) {
    query = query.where("boardId", "==", boardId);
  } else {
    // Se não tem boardId, assumimos contexto pessoal ou "sem quadro".
    // Para não quebrar legados que não tem boardId field, não podemos filtrar por boardId == null facilmente no Firestore
    // sem criar um índice ou garantir que todos tenham null.
    // Mas podemos filtrar no cliente (memória) ou aceitar misturado por enquanto.
    // Vamos tentar trazer tudo do usuário e filtrar em memória para garantir.
  }

  const snap = await query.get();

  const userCats = new Set<string>();
  snap.forEach((doc) => {
    const data = doc.data() as any;
    // Se pedimos boardId, o filtro do banco já garantiu.
    // Se NÃO pedimos boardId, só queremos as que NÃO tem boardId (ou boardId null/undefined).
    if (!boardId) {
      if (data.boardId) return; // ignora categorias de boards específicos se estamos no modo "sem board"
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
    investmentCategory?: InvestmentCategory;
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
      ...(data.investmentCategory ? { investmentCategory: data.investmentCategory } : {}),
    });
  });

  // filtra templates do quadro ou pessoais
  const templates = allTemplates.filter((tpl) =>
    boardId ? tpl.boardId === boardId : !tpl.boardId,
  );

  if (templates.length === 0) return existingItems;

  const items = [...existingItems];

  // Limitar itens fixos até dezembro do ano atual
  const currentYear = new Date().getFullYear();
  const [reqYear] = month.split("-").map(Number);
  if (reqYear > currentYear) return existingItems;

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
      ...(tpl.investmentCategory ? { investmentCategory: tpl.investmentCategory } : {}),
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
      interestConfig: data.interestConfig,
      interestAmount: data.interestAmount,
      investmentCategory: data.investmentCategory,
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
