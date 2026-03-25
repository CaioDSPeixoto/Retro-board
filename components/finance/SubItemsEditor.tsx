"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FiPlus, FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useTranslations } from "next-intl";
import type { FinanceStatus } from "@/types/finance";

type SubItemEntry = {
  id: string;
  title: string;
  amount: number;
  state: "stable" | "adding" | "removing";
};

type Props = {
  initialSubItems?: { title: string; amount: number }[];
  parentAmount: number;
  parentStatus?: FinanceStatus;
  onSubItemsChange: (subItems: { title: string; amount: number }[]) => void;
};

let nextId = 0;
const genId = () => `sub-${++nextId}-${Date.now()}`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function SubItemsEditor({
  initialSubItems = [],
  parentAmount,
  parentStatus = "pending",
  onSubItemsChange,
}: Props) {
  const t = useTranslations("Finance");
  const isReadOnly = parentStatus !== "pending";

  const [items, setItems] = useState<SubItemEntry[]>(() =>
    initialSubItems.map((si) => ({
      id: genId(),
      title: si.title,
      amount: si.amount,
      state: "stable" as const,
    })),
  );

  // inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // inline adding
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const removingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      removingTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const notifyParent = useCallback(
    (entries: SubItemEntry[]) => {
      const stable = entries.filter((e) => e.state !== "removing");
      onSubItemsChange(stable.map(({ title, amount }) => ({ title, amount })));
    },
    [onSubItemsChange],
  );

  // ---- Add ----
  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amount) || amount <= 0) return;

    const entry: SubItemEntry = {
      id: genId(),
      title: newTitle.trim(),
      amount,
      state: "adding",
    };

    const next = [...items, entry];
    setItems(next);
    setNewTitle("");
    setNewAmount("");
    setAdding(false);
    notifyParent(next);

    // transition to stable after animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        setItems((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, state: "stable" } : e)),
        );
      }, 300);
    });
  };

  // ---- Remove ----
  const handleRemove = (id: string) => {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, state: "removing" } : e)));

    const timer = setTimeout(() => {
      setItems((prev) => {
        const next = prev.filter((e) => e.id !== id);
        // Defer parent notification to avoid setState-during-render
        setTimeout(() => notifyParent(next), 0);
        return next;
      });
      removingTimers.current.delete(id);
    }, 300);

    removingTimers.current.set(id, timer);
  };

  // ---- Edit ----
  const handleStartEdit = (entry: SubItemEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditAmount(String(entry.amount));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const amount = parseFloat(editAmount);
    if (!editTitle.trim() || isNaN(amount) || amount <= 0) return;

    const next = items.map((e) =>
      e.id === editingId ? { ...e, title: editTitle.trim(), amount } : e,
    );
    setItems(next);
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
    notifyParent(next);
  };

  // ---- Summary ----
  const stableItems = items.filter((e) => e.state !== "removing");
  const sum = stableItems.reduce((acc, si) => acc + si.amount, 0);
  const difference = parentAmount - sum;
  const exceeds = sum > parentAmount;

  return (
    <div className="space-y-2">
      {/* Sub-items list */}
      {items.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg border transition-all duration-300"
          style={{
            background: "var(--color-surface-raised)",
            borderColor: "var(--color-border-subtle)",
            opacity: entry.state === "removing" ? 0 : 1,
            transform:
              entry.state === "adding"
                ? "translateY(0)"
                : entry.state === "removing"
                  ? "translateY(-4px)"
                  : undefined,
            animation:
              entry.state === "adding" ? "fadeSlideIn 300ms ease-out" : undefined,
          }}
        >
          {editingId === entry.id ? (
            <div className="w-full space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t("subItemTitlePlaceholder")}
                className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder={t("subItemAmountPlaceholder")}
                  className="flex-1 p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition text-sm font-semibold"
                  aria-label={t("editSubItem")}
                >
                  <FiCheck size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 rounded-lg border hover:text-red-500 transition text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                  aria-label={t("cancel")}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm truncate block"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {entry.title}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatCurrency(entry.amount)}
                </span>
                {!isReadOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className="p-2 rounded-lg hover:text-[var(--color-accent-primary)] transition"
                      style={{ color: "var(--color-text-muted)" }}
                      aria-label={t("editSubItem")}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.id)}
                      className="p-2 rounded-lg hover:text-red-500 transition"
                      style={{ color: "var(--color-text-muted)" }}
                      aria-label={t("removeSubItem")}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Summary */}
      {stableItems.length > 0 && (
        <div
          className="pt-2 border-t space-y-1"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t("subItemsSum", { value: formatCurrency(sum) })}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t("subItemsDifference", { value: formatCurrency(difference) })}
          </p>
          {exceeds && (
            <p className="text-xs text-amber-600 font-semibold">
              {t("subItemsExceedsWarning")}
            </p>
          )}
        </div>
      )}

      {/* Add sub-item */}
      {!isReadOnly && (
        <div className="mt-1">
          {adding ? (
            <div
              className="space-y-2 p-2 rounded-lg border"
              style={{
                background: "var(--color-surface-raised)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("subItemTitlePlaceholder")}
                className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder={t("subItemAmountPlaceholder")}
                  className="flex-1 p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition text-sm font-semibold"
                  aria-label={t("addSubItem")}
                >
                  <FiCheck size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setNewTitle("");
                    setNewAmount("");
                  }}
                  className="px-3 py-2 rounded-lg border hover:text-red-500 transition text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                  aria-label={t("cancel")}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-xs font-semibold transition min-w-[44px] min-h-[44px]"
              style={{ color: "var(--color-accent-text)" }}
            >
              <FiPlus size={14} />
              {t("addSubItem")}
            </button>
          )}
        </div>
      )}

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
