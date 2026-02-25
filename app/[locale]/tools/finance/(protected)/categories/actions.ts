"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function deleteCategory(category: string, locale: string, boardId?: string) {
    const t = await getTranslations({ locale, namespace: "Finance" });
    const sessionUserId = await getSession();

    if (!sessionUserId) {
        return { error: t("errors.unauthorized") };
    }

    try {
        // 1. Check if category is in use
        let activeItemsQuery = adminDb
            .collection("finance_items")
            .where("userId", "==", sessionUserId)
            .where("category", "==", category);

        if (boardId) {
            activeItemsQuery = activeItemsQuery.where("boardId", "==", boardId);
        } else {
            // Se deletando pessoal, verifica se tem item pessoal (sem boardId) usando?
            // Ou se tem QUALQUER item usando?
            // Por segurança, se for pessoal, não deve ter nenhum item pendurado nela, mesmo em boards (se permitirmos misturar).
            // Mas se estamos isolando, bastaria checar itens sem boardId.
            // Vamos checar itens sem boardId por enquanto (ou null).
            // Mas Firestore não facilita query de null.
            // Vamos fazer query geral do usuário e filtrar em memória.
        }

        const activeItemsSnap = await activeItemsQuery.get();
        let inUse = false;

        if (!activeItemsSnap.empty) {
            if (boardId) {
                inUse = true;
            } else {
                inUse = activeItemsSnap.docs.some(d => !d.data().boardId);
            }
        }

        if (inUse) {
            return { error: t("errors.categoryInUse") };
        }

        // 2. Delete the category document
        let categoryQuery = adminDb
            .collection("finance_categories")
            .where("userId", "==", sessionUserId)
            .where("name", "==", category);

        if (boardId) {
            categoryQuery = categoryQuery.where("boardId", "==", boardId);
        }

        const categorySnap = await categoryQuery.get();

        if (categorySnap.empty) {
            return { success: true };
        }

        const batch = adminDb.batch();
        let deletedCount = 0;

        categorySnap.docs.forEach((doc) => {
            const data = doc.data();
            // Se estamos deletando categoria de um board específico, a query já filtrou.
            // Se estamos deletando "pessoal" (sem boardId), precisamos garantir que não deletamos a do board se tiver mesmo nome (colisão).
            if (!boardId && data.boardId) return;

            batch.delete(doc.ref);
            deletedCount++;
        });

        if (deletedCount > 0) {
            await batch.commit();
        }

        revalidatePath(`/${locale}/tools/finance`);
        revalidatePath(`/${locale}/tools/finance/categories`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { error: t("errors.deleteFailed") };
    }
}

export async function updateCategory(
    oldName: string,
    newName: string,
    locale: string,
    boardId?: string
) {
    const t = await getTranslations({ locale, namespace: "Finance" });
    const sessionUserId = await getSession();

    if (!sessionUserId) {
        return { error: t("errors.unauthorized") };
    }

    const trimmedNew = newName.trim();
    if (!trimmedNew) return { error: t("errors.invalidCategoryName") };

    if (oldName === trimmedNew) return { success: true };

    try {
        // 1. Check if new name already exists (in the same context)
        let duplicateQuery = adminDb
            .collection("finance_categories")
            .where("userId", "==", sessionUserId)
            .where("name", "==", trimmedNew);

        if (boardId) {
            duplicateQuery = duplicateQuery.where("boardId", "==", boardId);
        } else {
            // Logic for personal/no-board items
        }

        const duplicateSnap = await duplicateQuery.get();
        let exists = false;
        if (!duplicateSnap.empty) {
            if (boardId) {
                exists = true;
            } else {
                exists = duplicateSnap.docs.some(d => !d.data().boardId);
            }
        }

        if (exists) {
            return { error: t("errors.categoryExists") };
        }

        // 2. Find the old category doc
        let oldCatQuery = adminDb
            .collection("finance_categories")
            .where("userId", "==", sessionUserId)
            .where("name", "==", oldName);

        if (boardId) {
            oldCatQuery = oldCatQuery.where("boardId", "==", boardId);
        }

        const oldCatSnap = await oldCatQuery.get();

        const batch = adminDb.batch();

        // If category doc exists, update it
        // Note: Legacy personal categories might not have a doc, but we can creating one for the new name if wanted, 
        // OR just update the items. Current logic creates docs for new categories, so "old" might be just a string usage.
        // If doc exists, rename it.
        oldCatSnap.docs.forEach(doc => {
            if (!boardId && doc.data().boardId) return; // Skip if collision with board item in personal view (edge case)
            batch.update(doc.ref, { name: trimmedNew });
        });

        // 3. Update all items using this category
        let itemsQuery = adminDb
            .collection("finance_items")
            .where("userId", "==", sessionUserId)
            .where("category", "==", oldName);

        if (boardId) {
            itemsQuery = itemsQuery.where("boardId", "==", boardId);
        }

        const itemsSnap = await itemsQuery.get();
        itemsSnap.docs.forEach(doc => {
            if (!boardId && doc.data().boardId) return; // Skip board items if in personal mode
            batch.update(doc.ref, { category: trimmedNew });
        });

        await batch.commit();

        revalidatePath(`/${locale}/tools/finance`);
        revalidatePath(`/${locale}/tools/finance/categories`);

        return { success: true };

    } catch (error) {
        console.error("Error updating category:", error);
        return { error: t("errors.updateFailed") };
    }
}
