"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getPlanLimits } from "@/lib/auth/plan-check";
import { getTranslations } from "next-intl/server";
import type { Todo, TodoList } from "@/types/todo";

const LISTS_COLLECTION = "user_todo_lists";
const TODOS_COLLECTION = "user_todos";

// ==================== LISTS ====================

export async function getTodoLists(locale: string): Promise<{ lists: TodoList[] } | { error: string }> {
  const userId = await getSession();
  if (!userId) return { lists: [] };

  const snap = await adminDb
    .collection(LISTS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const lists = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as any) }) as TodoList)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  return { lists };
}

export async function createTodoList(name: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  if (!name.trim()) return { error: t("errors.emptyName") };

  const limits = await getPlanLimits();
  if (limits.maxTodoLists !== -1) {
    const existing = await adminDb
      .collection(LISTS_COLLECTION)
      .where("userId", "==", userId)
      .get();
    if (existing.size >= limits.maxTodoLists) {
      return { error: t("errors.listLimitReached") };
    }
  }

  const ref = await adminDb.collection(LISTS_COLLECTION).add({
    userId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true, listId: ref.id };
}

export async function deleteTodoList(listId: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const listRef = adminDb.collection(LISTS_COLLECTION).doc(listId);
  const listSnap = await listRef.get();
  if (!listSnap.exists) return { error: t("errors.notFound") };
  if ((listSnap.data() as any).userId !== userId) return { error: t("errors.unauthorized") };

  // Delete all todos in this list
  const todosSnap = await adminDb
    .collection(TODOS_COLLECTION)
    .where("listId", "==", listId)
    .get();

  const batch = adminDb.batch();
  todosSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(listRef);
  await batch.commit();

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true };
}


export async function renameTodoList(listId: string, name: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  if (!name.trim()) return { error: t("errors.emptyName") };

  const ref = adminDb.collection(LISTS_COLLECTION).doc(listId);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.notFound") };
  if ((snap.data() as any).userId !== userId) return { error: t("errors.unauthorized") };

  await ref.update({ name: name.trim() });

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true };
}

// ==================== TODOS ====================

export async function getTodos(listId: string, locale: string): Promise<{ todos: Todo[] } | { error: string }> {
  const userId = await getSession();
  if (!userId) return { todos: [] };

  const snap = await adminDb
    .collection(TODOS_COLLECTION)
    .where("userId", "==", userId)
    .where("listId", "==", listId)
    .get();

  const todos = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as any) }) as Todo)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  return { todos };
}

export async function getAllTodos(locale: string): Promise<{ todos: Todo[] } | { error: string }> {
  const userId = await getSession();
  if (!userId) return { todos: [] };

  const snap = await adminDb
    .collection(TODOS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const todos = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as any) }) as Todo)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  return { todos };
}

export async function addTodo(listId: string, text: string, time: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  if (!text.trim()) return { error: t("errors.empty") };

  // Check plan limits
  const limits = await getPlanLimits();
  if (limits.maxTodosPerList !== -1) {
    const existing = await adminDb
      .collection(TODOS_COLLECTION)
      .where("userId", "==", userId)
      .where("listId", "==", listId)
      .get();
    if (existing.size >= limits.maxTodosPerList) {
      return { error: t("errors.todoLimitReached") };
    }
  }

  const ref = await adminDb.collection(TODOS_COLLECTION).add({
    userId,
    listId,
    text: text.trim(),
    done: false,
    time: time || "",
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true, todoId: ref.id };
}

export async function toggleTodo(id: string, done: boolean, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection(TODOS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.notFound") };

  const data = snap.data() as any;
  if (data.userId !== userId) return { error: t("errors.unauthorized") };

  await ref.update({ done });

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true };
}

export async function removeTodo(id: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const ref = adminDb.collection(TODOS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: t("errors.notFound") };

  const data = snap.data() as any;
  if (data.userId !== userId) return { error: t("errors.unauthorized") };

  await ref.delete();

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true };
}

export async function clearListTodos(listId: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "TodoList" });
  const userId = await getSession();
  if (!userId) return { error: t("errors.unauthorized") };

  const snap = await adminDb
    .collection(TODOS_COLLECTION)
    .where("userId", "==", userId)
    .where("listId", "==", listId)
    .get();

  if (snap.empty) return { success: true };

  const batch = adminDb.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  revalidatePath(`/${locale}/tools/todo`);
  return { success: true };
}
