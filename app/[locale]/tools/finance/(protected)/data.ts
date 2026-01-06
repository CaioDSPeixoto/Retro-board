// app/[locale]/tools/finance/(protected)/data.ts
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import type { FinanceBoard, FinanceItem } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

export async function getFinanceItemsData(month: string, boardId?: string | null): Promise<FinanceItem[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    let q = adminDb.collection("finance_items")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate);

    if (boardId) {
      q = q.where("boardId", "==", boardId);
    } else {
      q = q.where("userId", "==", sessionUser);
    }

    const snap = await q.get();

    const monthItems: FinanceItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as FinanceItem[];

    // Sintéticos (só visão pessoal)
    let syntheticFixedItems: FinanceItem[] = [];

    if (!boardId) {
      const fixedSnap = await adminDb
        .collection("finance_fixed_templates")
        .where("userId", "==", sessionUser)
        .get();

      const fixedTemplates = fixedSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => t.active !== false);

      const existingKeys = new Set(
        monthItems.map((item) => {
          const dayStr = item.date.split("-")[2] || "01";
          return `${item.title}|${item.amount}|${item.category}|${dayStr}`;
        }),
      );

      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthIdx = Number(monthStr); // 1-12
      const lastDayOfMonth = new Date(year, monthIdx, 0).getDate();

      syntheticFixedItems = fixedTemplates
        .map((t) => {
          const rawDay = typeof t.day === "number" ? t.day : parseInt(String(t.day) || "1", 10);
          const day = Math.min(rawDay, lastDayOfMonth);
          const dayStr = String(day).padStart(2, "0");
          const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
          const key = `${t.title}|${t.amount}|${t.category}|${dayStr}`;

          if (existingKeys.has(key)) return null;

          const item: FinanceItem = {
            id: `fixed_${t.id}_${month}`,
            userId: sessionUser,
            title: t.title,
            amount: t.amount,
            date: dateStr,
            type: t.type === "income" ? "income" : "expense",
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

    const combined = boardId ? monthItems : [...monthItems, ...syntheticFixedItems];
    combined.sort((a, b) => (a.date < b.date ? 1 : -1));

    return combined;
  } catch (error) {
    console.error("Erro ao buscar items:", error);
    return [];
  }
}

export async function getCategoriesData(): Promise<string[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return BUILTIN_CATEGORIES;

  try {
    const snap = await adminDb
      .collection("finance_categories")
      .where("userId", "==", sessionUser)
      .get();

    const customNames = snap.docs
      .map((d) => (d.data().name as string) || "")
      .filter((n) => n.trim().length > 0);

    return Array.from(new Set([...BUILTIN_CATEGORIES, ...customNames]));
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return BUILTIN_CATEGORIES;
  }
}

export async function getBoardsData(): Promise<FinanceBoard[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    const ownedSnap = await adminDb
      .collection("finance_boards")
      .where("ownerId", "==", sessionUser)
      .get();

    const owned = ownedSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as FinanceBoard[];

    const memberSnap = await adminDb
      .collection("finance_boards")
      .where("memberIds", "array-contains", sessionUser)
      .get();

    const memberBoards = memberSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as FinanceBoard[];

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