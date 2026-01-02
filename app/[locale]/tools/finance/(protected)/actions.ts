"use server";

import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { FinanceItem } from "@/types/finance";

export async function addFinanceItem(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) return { error: "Unauthorized" };

    const title = (formData.get("title") as string) || "";
    const amountStr = (formData.get("amount") as string) || "";
    const date = (formData.get("date") as string) || "";
    const type = formData.get("type") as "income" | "expense" | null;
    const locale = ((formData.get("locale") as string) || "pt-br").toLowerCase();
    const statusField = formData.get("status") as "paid" | "pending" | null;

    const amount = parseFloat(amountStr);

    if (!title.trim() || isNaN(amount) || !date || !type) {
        return { error: "Dados incompletos" };
    }

    const newItem: Omit<FinanceItem, "id"> = {
        userId: sessionUser,
        title: title.trim(),
        amount,
        date,
        type,
        status: statusField || "pending",
        createdAt: new Date().toISOString(),
    };

    try {
        await addDoc(collection(db, "finance_items"), newItem);
        revalidatePath(`/${locale}/tools/finance`);
        return { success: true };
    } catch (error) {
        console.error("Error adding item:", error);
        return { error: "Erro ao salvar" };
    }
}

export async function updateFinanceItem(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) return { error: "Unauthorized" };

    const id = (formData.get("id") as string) || "";
    const title = (formData.get("title") as string) || "";
    const amountStr = (formData.get("amount") as string) || "";
    const date = (formData.get("date") as string) || "";
    const status = formData.get("status") as "paid" | "pending";
    const locale = ((formData.get("locale") as string) || "pt-br").toLowerCase();

    const amount = parseFloat(amountStr);

    if (!id || !title.trim() || isNaN(amount) || !date) {
        return { error: "Dados incompletos" };
    }

    try {
        await updateDoc(doc(db, "finance_items", id), {
            title: title.trim(),
            amount,
            date,
            status,
        });
        revalidatePath(`/${locale}/tools/finance`);
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        return { error: "Erro ao atualizar" };
    }
}

export async function deleteFinanceItem(id: string, locale: string) {
    const sessionUser = await getSession();
    if (!sessionUser) return { error: "Unauthorized" };

    try {
        await deleteDoc(doc(db, "finance_items", id));
        revalidatePath(`/${locale}/tools/finance`);
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar:", error);
        return { error: "Erro ao deletar" };
    }
}

export async function toggleStatus(
    id: string,
    currentStatus: "paid" | "pending",
    locale: string,
) {
    const sessionUser = await getSession();
    if (!sessionUser) return { error: "Unauthorized" };

    const newStatus = currentStatus === "paid" ? "pending" : "paid";

    try {
        await updateDoc(doc(db, "finance_items", id), {
            status: newStatus,
        });
        revalidatePath(`/${locale}/tools/finance`);
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { error: "Erro ao atualizar status" };
    }
}

export async function getFinanceItems(
    month: string, // "YYYY-MM"
): Promise<FinanceItem[]> {
    const sessionUser = await getSession();
    if (!sessionUser) return [];

    try {
        const q = query(
            collection(db, "finance_items"),
            where("userId", "==", sessionUser),
            // sem orderBy aqui pra evitar índice composto por enquanto
        );

        const snapshot = await getDocs(q);
        const allItems = snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as FinanceItem),
        );

        // Filtra pelo mês selecionado (date = "YYYY-MM-DD")
        const filtered = allItems.filter((item) =>
            item.date.startsWith(month),
        );

        // Ordena por data desc (mais recente primeiro)
        filtered.sort((a, b) => (a.date < b.date ? 1 : -1));

        return filtered;
    } catch (error) {
        console.error("Erro ao buscar items:", error);
        return [];
    }
}
