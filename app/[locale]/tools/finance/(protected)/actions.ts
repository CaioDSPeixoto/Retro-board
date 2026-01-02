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
    orderBy,
} from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { FinanceItem } from "@/types/finance";

export async function addFinanceItem(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) return { error: "Unauthorized" };

    const title = formData.get("title") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const date = formData.get("date") as string;
    const type = formData.get("type") as "income" | "expense";
    const locale = formData.get("locale") as string;

    if (!title || !amount || !date || !type) {
        return { error: "Dados incompletos" };
    }

    const newItem: Omit<FinanceItem, "id"> = {
        userId: sessionUser,
        title,
        amount,
        date,
        type,
        status: (formData.get("status") as "paid" | "pending") || "pending",
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

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const date = formData.get("date") as string;
    const status = formData.get("status") as "paid" | "pending";
    const locale = formData.get("locale") as string;

    try {
        await updateDoc(doc(db, "finance_items", id), {
            title,
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
        return { error: "Erro ao deletar" };
    }
}

export async function toggleStatus(id: string, currentStatus: "paid" | "pending", locale: string) {
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
        return { error: "Erro ao atualizar status" };
    }
}

export async function getFinanceItems(
    month: string, // "YYYY-MM"
): Promise<FinanceItem[]> {
    const sessionUser = await getSession();

    if (!sessionUser) return [];

    try {
        // Busca simples: filtra por UserId e depois filtramos a data no código (para simplificar índices do Firestore)
        // OU: usar where("date", ">=", start) ...
        // Para simplificar e evitar criar índices compostos agora, vou buscar tudo do user e filtrar.
        // SE ficar lento, criamos índices.

        const q = query(
            collection(db, "finance_items"),
            where("userId", "==", sessionUser),
            orderBy("date", "desc")
        );

        const snapshot = await getDocs(q);
        const allItems = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as FinanceItem)
        );

        // Filtra pelo mês selecionado
        return allItems.filter((item) => item.date.startsWith(month));
    } catch (error) {
        console.error("Erro ao buscar items:", error);
        return [];
    }
}
