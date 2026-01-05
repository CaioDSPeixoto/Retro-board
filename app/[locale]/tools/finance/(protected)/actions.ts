// app/[locale]/tools/finance/(protected)/actions.ts
"use server";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  FinanceBoard,
  FinanceItem,
  FinanceStatus,
} from "@/types/finance";
import { BUILTIN_CATEGORIES } from "@/lib/finance/constants";

/* ============ helpers ============ */

async function canEditItem(existing: FinanceItem, sessionUser: string) {
  // Se tiver boardId, libera pra qualquer membro do board
  if (existing.boardId) {
    const boardSnap = await getDoc(doc(db, "finance_boards", existing.boardId));
    if (!boardSnap.exists()) return false;
    const board = boardSnap.data() as FinanceBoard;
    const members = board.memberIds || [];
    return members.includes(sessionUser);
  }

  // Sem boardId -> item individual, só o dono
  return existing.userId === sessionUser;
}

/* ============ categorias ============ */

export async function createCategory(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Nome de categoria inválido" };
  }

  if (BUILTIN_CATEGORIES.includes(trimmed)) {
    return { error: "Essa categoria já existe" };
  }

  try {
    await addDoc(collection(db, "finance_categories"), {
      userId: sessionUser,
      name: trimmed,
      createdAt: new Date().toISOString(),
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return { error: "Erro ao criar categoria" };
  }
}

/* ============ boards ============ */

export async function createFinanceBoard(name: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome inválido" };

  try {
    const boardRef = await addDoc(collection(db, "finance_boards"), {
      name: trimmed,
      ownerId: sessionUser,
      memberIds: [sessionUser],
      createdAt: new Date().toISOString(),
      isPersonal: false,
    });

    revalidatePath(`/${locale}/tools/finance`);

    return { success: true, boardId: boardRef.id };
  } catch (error) {
    console.error("Erro ao criar quadro:", error);
    return { error: "Erro ao criar quadro" };
  }
}

/* ============ itens ============ */

export async function addFinanceItem(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const title = (formData.get("title") as string) || "";
  const amountStr = (formData.get("amount") as string) || "";
  const date = (formData.get("date") as string) || "";
  const type = formData.get("type") as "income" | "expense" | null;
  const category = (formData.get("category") as string) || "";
  const locale = ((formData.get("locale") as string) || "pt-br").toLowerCase();
  const statusField = formData.get("status") as FinanceStatus | null;
  const isFixedFlag = formData.get("isFixed") === "true";

  const boardIdRaw = (formData.get("boardId") as string) || "";
  const createdByNameFromForm =
    (formData.get("createdByName") as string) || "";

  const amount = parseFloat(amountStr);

  if (!title.trim() || isNaN(amount) || !date || !type) {
    return { error: "Dados incompletos" };
  }

  if (!category.trim()) {
    return { error: "Categoria é obrigatória" };
  }

  // valida quadro, se vier
  let boardId: string | undefined;
  if (boardIdRaw) {
    const boardSnap = await getDoc(doc(db, "finance_boards", boardIdRaw));
    if (!boardSnap.exists()) {
      return { error: "Quadro não encontrado" };
    }
    const board = boardSnap.data() as FinanceBoard;
    const members = board.memberIds || [];
    if (!members.includes(sessionUser)) {
      return { error: "Sem permissão para lançar neste quadro" };
    }
    boardId = boardIdRaw;
  }

  const status: FinanceStatus = statusField || "pending";
  const paidAmount = status === "paid" ? amount : 0;

  const newItem: Omit<FinanceItem, "id"> = {
    userId: sessionUser,
    title: title.trim(),
    amount,
    date,
    type,
    status,
    category: category.trim(),
    createdAt: new Date().toISOString(),
    paidAmount,
    ...(category.trim() === "Contas Fixas" && isFixedFlag
      ? { isFixed: true }
      : {}),
    ...(boardId ? { boardId } : {}),
    createdBy: sessionUser,
    ...(createdByNameFromForm
      ? { createdByName: createdByNameFromForm }
      : {}),
  };

  try {
    // 1) salva lançamento do mês atual
    await addDoc(collection(db, "finance_items"), newItem);

    // 2) se for fixa na categoria Contas Fixas, cria template (income ou expense)
    if (category.trim() === "Contas Fixas" && isFixedFlag) {
      const day = parseInt(date.split("-")[2] || "1", 10);
      await addDoc(collection(db, "finance_fixed_templates"), {
        userId: sessionUser,
        title: title.trim(),
        amount,
        day,
        category: category.trim(),
        type,
        createdAt: new Date().toISOString(),
        active: true,
        ...(boardId ? { boardId } : {}),
      });
    }

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
  const category = (formData.get("category") as string) || "";
  const type = formData.get("type") as "income" | "expense" | null;
  const locale = ((formData.get("locale") as string) || "pt-br").toLowerCase();
  const paidAmountStr = (formData.get("paidAmount") as string) || "";

  const amount = parseFloat(amountStr);
  const paidAmountRaw = paidAmountStr ? parseFloat(paidAmountStr) : 0;

  if (!id || !title.trim() || isNaN(amount) || !date || !category.trim() || !type) {
    return { error: "Dados incompletos" };
  }

  try {
    const itemRef = doc(db, "finance_items", id);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) {
      return { error: "Item não encontrado" };
    }
    const existing = snap.data() as FinanceItem;

    const allowed = await canEditItem(existing, sessionUser);
    if (!allowed) {
      return { error: "Unauthorized" };
    }

    const paidAmount = Math.max(0, paidAmountRaw);
    let status: FinanceStatus = "pending";
    if (paidAmount >= amount) status = "paid";
    else if (paidAmount > 0) status = "partial";

    await updateDoc(itemRef, {
      title: title.trim(),
      amount,
      date,
      category: category.trim(),
      type,
      status,
      paidAmount,
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
    const itemRef = doc(db, "finance_items", id);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) {
      return { error: "Item não encontrado" };
    }
    const data = snap.data() as FinanceItem;

    const allowed = await canEditItem(data, sessionUser);
    if (!allowed) {
      return { error: "Unauthorized" };
    }

    await deleteDoc(itemRef);
    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { error: "Erro ao deletar" };
  }
}

export async function toggleStatus(
  id: string,
  currentStatus: FinanceStatus,
  locale: string,
) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  try {
    const itemRef = doc(db, "finance_items", id);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) return { error: "Item não encontrado" };

    const data = snap.data() as FinanceItem;

    const allowed = await canEditItem(data, sessionUser);
    if (!allowed) {
      return { error: "Unauthorized" };
    }

    const amount = data.amount;

    let newStatus: FinanceStatus;
    let paidAmount = data.paidAmount || 0;

    if (currentStatus === "paid") {
      newStatus = "pending";
      paidAmount = 0;
    } else {
      // pending ou partial -> marcar como totalmente pago
      newStatus = "paid";
      paidAmount = amount;
    }

    await updateDoc(itemRef, {
      status: newStatus,
      paidAmount,
    });
    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { error: "Erro ao atualizar status" };
  }
}
