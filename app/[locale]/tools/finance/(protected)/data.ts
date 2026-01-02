// app/[locale]/tools/finance/(protected)/data.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { FinanceItem } from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

export async function getFinanceItemsData(
  month: string, // "YYYY-MM"
): Promise<FinanceItem[]> {
  const sessionUser = await getSession();
  if (!sessionUser) return [];

  try {
    const q = query(
      collection(db, "finance_items"),
      where("userId", "==", sessionUser),
    );

    const snapshot = await getDocs(q);
    const allItems = snapshot.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as FinanceItem),
    );

    const filtered = allItems.filter((item) =>
      item.date.startsWith(month),
    );

    filtered.sort((a, b) => (a.date < b.date ? 1 : -1));

    return filtered;
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
