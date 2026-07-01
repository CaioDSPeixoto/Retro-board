"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiPlus } from "react-icons/fi";
import { useTodos } from "@/hooks/useTodos";
import TodoItem from "./todo/TodoItem";

export default function TodoList() {
  const t = useTranslations("TodoList");
  const { tasks, addTask, toggleDone, removeTask, clearAll } = useTodos();
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");

  const handleAddKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleAdd = () => {
    addTask(newTask, newTime);
    setNewTask("");
    setNewTime("");
  };

  return (
    <div className="max-w-xl w-full mx-auto">
      <div
        className="shadow-xl rounded-2xl overflow-hidden border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-blue-100 text-sm mt-1">
              {tasks.filter(t => !t.done).length} {t("remaining")}
            </p>
          </div>
          {tasks.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs bg-blue-700/50 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition text-blue-100 border border-blue-500/30"
            >
              {t("clearAll")}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
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
                onKeyDown={handleAddKey}
                placeholder={t("placeholder")}
                className="flex-1 bg-transparent border-none focus:ring-0 placeholder-gray-400 outline-none"
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
              onClick={handleAdd}
              disabled={!newTask}
              className="bg-blue-600 text-white w-12 h-12 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md flex items-center justify-center"
            >
              <FiPlus size={24} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex flex-col gap-2">
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {t("empty")}
                </p>
              </div>
            )}
            {tasks.map((task, i) => (
              <TodoItem
                key={i}
                task={task}
                onToggle={(done) => toggleDone(i, done)}
                onRemove={() => removeTask(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
