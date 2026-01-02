import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { FinanceItem } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

export async function getFinanceItemsData(
  month: string,
): Promise<FinanceItem[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    // 1) busca TODOS os items do user e filtra por mês no código
    const q = query(
      collection(db, "finance_items"),
      where("userId", "==", sessionUser),
    );

    const snapshot = await getDocs(q);
    const allItems = snapshot.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as FinanceItem),
    );

    const monthItems = allItems.filter((item) =>
      item.date.startsWith(month),
    );

    // 2) busca templates de despesas fixas
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

    // 3) evitar duplicar, se já existir um lançamento igual no mês
    const existingKeys = new Set(
      monthItems.map((item) => {
        const dayStr = item.date.split("-")[2] || "01";
        return `${item.title}|${item.amount}|${item.category}|${dayStr}`;
      }),
    );

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthIdx = Number(monthStr); // 1–12
    const lastDayOfMonth = new Date(year, monthIdx, 0).getDate(); // dia 0 do mês seguinte

    const syntheticFixedItems: FinanceItem[] = fixedTemplates
      .map((t) => {
        const day = Math.min(
          typeof t.day === "number" ? t.day : parseInt(String(t.day) || "1", 10),
          lastDayOfMonth,
        );
        const dayStr = String(day).padStart(2, "0");
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        const key = `${t.title}|${t.amount}|${t.category}|${dayStr}`;

        if (existingKeys.has(key)) {
          return null; // já existe um lançamento igual neste mês
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

    const combined = [...monthItems, ...syntheticFixedItems];

    combined.sort((a, b) => (a.date < b.date ? 1 : -1));

    return combined;
  } catch (error) {
    console.error("Erro ao buscar items:", error);
    return [];
  }
}

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
