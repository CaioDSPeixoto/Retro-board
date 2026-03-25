"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FiPlus, FiTrash2, FiEdit2, FiChevronLeft, FiList } from "react-icons/fi";
import TodoItem from "./todo/TodoItem";
import Spinner from "@/components/ui/Spinner";
import type { Todo, TodoList as TodoListType } from "@/types/todo";
import {
  getTodoLists,
  createTodoList,
  deleteTodoList,
  renameTodoList,
  getTodos,
  addTodo as addTodoAction,
  toggleTodo as toggleTodoAction,
  removeTodo as removeTodoAction,
  clearListTodos as clearListAction,
} from "@/app/[locale]/tools/todo/actions";

type LocalTodo = { text: string; done: boolean; time?: string };
type LocalList = { id: string; name: string; todos: LocalTodo[] };

type Props = {
  initialLists?: TodoListType[];
  initialTodosMap?: Record<string, Todo[]>;
  isLoggedIn?: boolean;
  locale?: string;
};

export default function TodoList({
  initialLists = [],
  initialTodosMap = {},
  isLoggedIn = false,
  locale = "pt",
}: Props) {
  const t = useTranslations("TodoList");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Cloud state
  const [lists, setLists] = useState<TodoListType[]>(initialLists);
  const [todosMap, setTodosMap] = useState<Record<string, Todo[]>>(initialTodosMap);

  // Local state (not logged in)
  const [localLists, setLocalLists] = useState<LocalList[]>([]);

  // UI state
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load local lists from localStorage
  useEffect(() => {
    if (isLoggedIn) return;
    const saved = localStorage.getItem("todoLocalLists");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LocalList[];
        setLocalLists(parsed);
      } catch { /* ignore */ }
    }
  }, [isLoggedIn]);

  // Save local lists to localStorage
  const saveLocal = useCallback((next: LocalList[]) => {
    setLocalLists(next);
    localStorage.setItem("todoLocalLists", JSON.stringify(next));
  }, []);

  // Alarm check
  useEffect(() => {
    const alarmSound = typeof Audio !== "undefined"
      ? new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
      : null;

    const interval = setInterval(() => {
      const now = new Date();
      const current = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (isLoggedIn) {
        Object.values(todosMap).flat().forEach((task) => {
          if (task.time && task.time === current && !task.done) {
            if (alarmSound) alarmSound.play().catch(() => {});
          }
        });
      } else {
        localLists.flatMap((l) => l.todos).forEach((task) => {
          if (task.time && task.time === current && !task.done) {
            if (alarmSound) alarmSound.play().catch(() => {});
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, todosMap, localLists]);

  const allLists = isLoggedIn ? lists : localLists;
  const activeList = allLists.find((l) => l.id === activeListId);
  const activeTodos = isLoggedIn
    ? (activeListId ? todosMap[activeListId] ?? [] : [])
    : (activeList ? (activeList as LocalList).todos : []);

  // ==================== LIST OPERATIONS ====================

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setError(null);

    if (isLoggedIn) {
      const res = await createTodoList(newListName, locale);
      if (res && "error" in res) { setError(res.error as string); return; }
      if (res && "listId" in res) {
        setLists((prev) => [...prev, { id: res.listId as string, userId: "", name: newListName.trim(), createdAt: new Date().toISOString() }]);
        setTodosMap((prev) => ({ ...prev, [res.listId as string]: [] }));
      }
    } else {
      const id = `local-${Date.now()}`;
      saveLocal([...localLists, { id, name: newListName.trim(), todos: [] }]);
    }
    setNewListName("");
  };

  const handleDeleteList = async (listId: string) => {
    setError(null);
    if (isLoggedIn) {
      const res = await deleteTodoList(listId, locale);
      if (res && "error" in res) { setError(res.error as string); return; }
      setLists((prev) => prev.filter((l) => l.id !== listId));
      setTodosMap((prev) => { const next = { ...prev }; delete next[listId]; return next; });
    } else {
      saveLocal(localLists.filter((l) => l.id !== listId));
    }
    if (activeListId === listId) setActiveListId(null);
    setConfirmDeleteId(null);
  };

  const handleRenameList = async (listId: string) => {
    if (!renameValue.trim()) return;
    setError(null);
    if (isLoggedIn) {
      const res = await renameTodoList(listId, renameValue, locale);
      if (res && "error" in res) { setError(res.error as string); return; }
      setLists((prev) => prev.map((l) => l.id === listId ? { ...l, name: renameValue.trim() } : l));
    } else {
      saveLocal(localLists.map((l) => l.id === listId ? { ...l, name: renameValue.trim() } : l));
    }
    setRenamingId(null);
    setRenameValue("");
  };

  // ==================== TODO OPERATIONS ====================

  const handleAddTodo = async () => {
    if (!newTask.trim() || !activeListId) return;
    setError(null);

    if (isLoggedIn) {
      const res = await addTodoAction(activeListId, newTask, newTime, locale);
      if (res && "error" in res) { setError(res.error as string); return; }
      if (res && "todoId" in res) {
        const newTodo: Todo = {
          id: res.todoId as string,
          userId: "",
          listId: activeListId,
          text: newTask.trim(),
          done: false,
          time: newTime || undefined,
          createdAt: new Date().toISOString(),
        };
        setTodosMap((prev) => ({ ...prev, [activeListId]: [...(prev[activeListId] ?? []), newTodo] }));
      }
    } else {
      const todo: LocalTodo = { text: newTask.trim(), done: false, time: newTime || undefined };
      saveLocal(localLists.map((l) => l.id === activeListId ? { ...l, todos: [...l.todos, todo] } : l));
    }
    setNewTask("");
    setNewTime("");
  };

  const handleToggle = async (index: number, done: boolean) => {
    if (!activeListId) return;
    if (isLoggedIn) {
      const todos = todosMap[activeListId] ?? [];
      const task = todos[index];
      if (!task) return;
      setTodosMap((prev) => ({
        ...prev,
        [activeListId]: prev[activeListId].map((t, i) => i === index ? { ...t, done } : t),
      }));
      await toggleTodoAction(task.id, done, locale);
    } else {
      saveLocal(localLists.map((l) => {
        if (l.id !== activeListId) return l;
        const todos = [...l.todos];
        todos[index] = { ...todos[index], done };
        return { ...l, todos };
      }));
    }
  };

  const handleRemove = async (index: number) => {
    if (!activeListId) return;
    if (isLoggedIn) {
      const todos = todosMap[activeListId] ?? [];
      const task = todos[index];
      if (!task) return;
      setTodosMap((prev) => ({
        ...prev,
        [activeListId]: prev[activeListId].filter((_, i) => i !== index),
      }));
      await removeTodoAction(task.id, locale);
    } else {
      saveLocal(localLists.map((l) => {
        if (l.id !== activeListId) return l;
        return { ...l, todos: l.todos.filter((_, i) => i !== index) };
      }));
    }
  };

  const handleClearAll = async () => {
    if (!activeListId) return;
    if (isLoggedIn) {
      setTodosMap((prev) => ({ ...prev, [activeListId]: [] }));
      await clearListAction(activeListId, locale);
    } else {
      saveLocal(localLists.map((l) => l.id === activeListId ? { ...l, todos: [] } : l));
    }
  };

  const remaining = activeTodos.filter((t) => !t.done).length;

  // ==================== RENDER: LIST VIEW (cards) ====================
  if (!activeListId) {
    return (
      <div className="max-w-2xl w-full mx-auto">
        <div
          className="shadow-xl rounded-2xl overflow-hidden border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {!isLoggedIn && (
              <p className="text-blue-200 text-xs mt-1">{t("loginHint")}</p>
            )}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Create list input */}
            <div className="flex items-center gap-3 mb-6">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                placeholder={t("newListPlaceholder")}
                className="flex-1 p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                style={{ background: "var(--color-surface-raised)", color: "var(--color-text-primary)" }}
              />
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim() || isPending}
                className="bg-blue-600 text-white w-12 h-12 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md flex items-center justify-center"
              >
                {isPending ? <Spinner size="sm" color="white" /> : <FiPlus size={24} />}
              </button>
            </div>

            {/* List cards */}
            {allLists.length === 0 ? (
              <div className="text-center py-12">
                <FiList size={48} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-lg font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {t("noLists")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allLists.map((list) => {
                  const count = isLoggedIn
                    ? (todosMap[list.id] ?? []).length
                    : (list as LocalList).todos.length;

                  return (
                    <div
                      key={list.id}
                      className="p-4 rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                      onClick={() => setActiveListId(list.id)}
                    >
                      {/* Confirm delete modal */}
                      {confirmDeleteId === list.id && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                          style={{ background: "rgba(0,0,0,0.4)" }}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          <div
                            className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm animate-scaleIn"
                            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-base text-center font-semibold mb-5" style={{ color: "var(--color-text-primary)" }}>
                              {t("confirmDeleteList")}
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition hover:opacity-80"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface-raised)" }}
                              >
                                {t("cancelDelete")}
                              </button>
                              <button
                                onClick={() => handleDeleteList(list.id)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition"
                              >
                                {t("deleteList")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rename inline */}
                      {renamingId === list.id ? (
                        <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameList(list.id); if (e.key === "Escape") setRenamingId(null); }}
                            className="flex-1 p-2 rounded-lg border text-sm outline-none focus:border-blue-500"
                            style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                          />
                          <button onClick={() => handleRenameList(list.id)} className="text-blue-500 font-semibold text-sm">OK</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                              {list.name}
                            </h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => { setRenamingId(list.id); setRenameValue(list.name); }}
                                className="p-1.5 rounded-lg hover:bg-blue-50 transition"
                                style={{ color: "var(--color-text-muted)" }}
                                aria-label={t("renameList")}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(list.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition"
                                style={{ color: "var(--color-text-muted)" }}
                                aria-label={t("deleteList")}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            {t("tasksCount", { count })}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: TASK VIEW (inside a list) ====================
  return (
    <div className="max-w-xl w-full mx-auto">
      <div
        className="shadow-xl rounded-2xl overflow-hidden border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveListId(null)}
              className="p-1.5 rounded-lg hover:bg-blue-700 transition"
              aria-label={t("backAria")}
            >
              <FiChevronLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{activeList?.name ?? ""}</h1>
              <p className="text-blue-100 text-sm">
                {remaining} {t("remaining")}
              </p>
            </div>
          </div>
          {activeTodos.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isPending}
              className="text-xs bg-blue-700/50 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition text-blue-100 border border-blue-500/30"
            >
              {t("clearAll")}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex-1 flex gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-300 transition"
              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
            >
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder={t("placeholder")}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none"
                style={{ color: "var(--color-text-primary)" }}
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-24 bg-transparent border-l pl-2 text-xs focus:ring-0 outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              />
            </div>
            <button
              onClick={handleAddTodo}
              disabled={!newTask.trim() || isPending}
              className="bg-blue-600 text-white w-12 h-12 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md flex items-center justify-center"
            >
              {isPending ? <Spinner size="sm" color="white" /> : <FiPlus size={24} />}
            </button>
          </div>

          {/* Items List */}
          <div className="flex flex-col gap-2">
            {activeTodos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {t("empty")}
                </p>
              </div>
            )}
            {activeTodos.map((task, i) => (
              <TodoItem
                key={isLoggedIn ? (task as Todo).id : i}
                task={task}
                onToggle={(done) => handleToggle(i, done)}
                onRemove={() => handleRemove(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
