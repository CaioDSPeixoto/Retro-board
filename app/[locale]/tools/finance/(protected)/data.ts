import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { FinanceBoard, FinanceItem } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

/**
 * Busca lançamentos de um determinado mês.
 * Agora:
 *  - sem boardId => visão pessoal (filtra por userId)
 *  - com boardId => visão do quadro (filtra por boardId)
 *  - filtra por intervalo de datas no Firestore (yyyy-MM-01 até yyyy-MM-31)
 *  - só gera lançamentos sintéticos de despesas fixas quando NÃO há boardId
 */
export async function getFinanceItemsData(
  month: string,
  boardId?: string | null,
): Promise<FinanceItem[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // ----- 1) Monta constraints de busca -----
    let constraints: any[] = [];

    if (boardId) {
      // visão de quadro: todos os lançamentos do board, independente de userId
      constraints = [
        where("boardId", "==", boardId),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
      ];
    } else {
      // visão pessoal: apenas lançamentos do usuário
      constraints = [
        where("userId", "==", sessionUser),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
      ];
    }

    const qItems = query(collection(db, "finance_items"), ...constraints);
    const snapshot = await getDocs(qItems);

    const monthItems: FinanceItem[] = snapshot.docs.map(
      (docSnap) =>
        ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        }) as FinanceItem,
    );

    // ----- 2) Despesas fixas sintéticas -----
    // Só geramos sintéticos quando NÃO há boardId,
    // para evitar duplicar coisas em todos os quadros compartilhados.
    let syntheticFixedItems: FinanceItem[] = [];

    if (!boardId) {
      const fixedQ = query(
        collection(db, "finance_fixed_templates"),
        where("userId", "==", sessionUser),
      );
      const fixedSnap = await getDocs(fixedQ);

      const fixedTemplates = fixedSnap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
        .filter((t) => t.active !== false);

      const existingKeys = new Set(
        monthItems.map((item) => {
          const dayStr = item.date.split("-")[2] || "01";
          return `${item.title}|${item.amount}|${item.category}|${dayStr}`;
        }),
      );

      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthIdx = Number(monthStr); // 1–12
      const lastDayOfMonth = new Date(year, monthIdx, 0).getDate();

      syntheticFixedItems = fixedTemplates
        .map((t) => {
          const rawDay =
            typeof t.day === "number"
              ? t.day
              : parseInt(String(t.day) || "1", 10);
          const day = Math.min(rawDay, lastDayOfMonth);
          const dayStr = String(day).padStart(2, "0");
          const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
          const key = `${t.title}|${t.amount}|${t.category}|${dayStr}`;

          if (existingKeys.has(key)) {
            return null;
          }

          const item: FinanceItem = {
            id: `fixed_${t.id}_${month}`,
            userId: sessionUser,
            title: t.title,
            amount: t.amount,
            date: dateStr,
            type: "expense",
            status: "pending",
            category: t.category,
            createdAt: t.createdAt || new Date().toISOString(),
            isFixed: true,
            isSynthetic: true,
          };

          return item;
        })
        .filter(Boolean) as FinanceItem[];
    }

    // ----- 3) Combinação + ordenação -----
    const combined = boardId
      ? monthItems // em board específico: só itens daquele board
      : [...monthItems, ...syntheticFixedItems];

    combined.sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recentes primeiro

    return combined;
  } catch (error) {
    console.error("Erro ao buscar items:", error);
    return [];
  }
}

/**
 * Categorias do usuário (built-in + personalizadas)
 */
export async function getCategoriesData(): Promise<string[]> {
  const sessionUser = await getSession();
  if (!sessionUser) {
    return BUILTIN_CATEGORIES;
  }

  try {
    const q = query(
      collection(db, "finance_categories"),
      where("userId", "==", sessionUser),
    );

    const snapshot = await getDocs(q);
    const customNames = snapshot.docs
      .map((d) => (d.data().name as string) || "")
      .filter((n) => n.trim().length > 0);

    const unique = Array.from(
      new Set([...BUILTIN_CATEGORIES, ...customNames]),
    );

    return unique;
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return BUILTIN_CATEGORIES;
  }
}

/**
 * Boards de finanças visíveis para o usuário
 *  - onde ele é owner
 *  - ou onde ele é membro
 */
export async function getBoardsData(): Promise<FinanceBoard[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    // Boards que eu sou dono
    const ownedSnap = await getDocs(
      query(
        collection(db, "finance_boards"),
        where("ownerId", "==", sessionUser),
      ),
    );
    const owned: FinanceBoard[] = ownedSnap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as any),
        }) as FinanceBoard,
    );

    // Boards em que eu sou membro
    const memberSnap = await getDocs(
      query(
        collection(db, "finance_boards"),
        where("memberIds", "array-contains", sessionUser),
      ),
    );
    const memberBoards: FinanceBoard[] = memberSnap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as any),
        }) as FinanceBoard,
    );

    const all = [...owned, ...memberBoards];
    const seen = new Set<string>();
    const unique: FinanceBoard[] = [];

    for (const b of all) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        unique.push(b);
      }
    }

    unique.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt < b.createdAt ? 1 : -1;
    });

    return unique;
  } catch (error) {
    console.error("Erro ao buscar quadros:", error);
    return [];
  }
}
