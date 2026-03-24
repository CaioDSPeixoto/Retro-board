"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import type { FinanceStatus, SubItem } from "@/types/finance";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import {
  addSubItem,
  updateSubItem,
  deleteSubItem,
} from "@/app/[locale]/tools/finance/(protected)/actions";

type Props = {
  itemId: string;
  parentAmount: number;
  parentStatus: FinanceStatus;
  locale: string;
};

export default function SubItemsList({
  itemId,
  parentAmount,
  parentStatus,
  locale,
}: Props) {
  const t = useTranslations("Finance");
  const [expanded, setExpanded] = useState(false);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [isPending, startTransition] = useTransition();

  // inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // inline adding
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isReadOnly = parentStatus !== "pending";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const fetchSubItems = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        collection(db, "finance_items", itemId, "sub_items"),
      );
      const items: SubItem[] = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          title: data.title,
          amount: data.amount,
          createdAt: data.createdAt,
        };
      });
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setSubItems(items);
      setFetched(true);
    } catch {
      setSubItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubItems();
  }, []);

  useEffect(() => {
    if (expanded && !fetched) {
      fetchSubItems();
    }
  }, [expanded, fetched]);

  const sum = subItems.reduce((acc, si) => acc + si.amount, 0);
  const difference = parentAmount - sum;
  const exceeds = sum > parentAmount;

  const handleToggle = () => {
    setExpanded((prev) => !prev);
    setActionError(null);
  };

  const handleStartEdit = (si: SubItem) => {
    setEditingId(si.id);
    setEditTitle(si.title);
    setEditAmount(String(si.amount));
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
  };

  const handleSaveEdit = (subItemId: string) => {
    const amount = parseFloat(editAmount);
    if (!editTitle.trim() || isNaN(amount) || amount <= 0) return;

    startTransition(async () => {
      setActionError(null);
      const res = await updateSubItem(itemId, subItemId, editTitle.trim(), amount, locale);
      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }
      setEditingId(null);
      setFetched(false);
      fetchSubItems();
    });
  };

  const handleDelete = (subItemId: string) => {
    startTransition(async () => {
      setActionError(null);
      const res = await deleteSubItem(itemId, subItemId, locale);
      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }
      setFetched(false);
      fetchSubItems();
    });
  };

  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amount) || amount <= 0) return;

    startTransition(async () => {
      setActionError(null);
      const res = await addSubItem(itemId, newTitle.trim(), amount, locale);
      if (res && "error" in res && res.error) {
        setActionError(res.error as string);
        return;
      }
      setNewTitle("");
      setNewAmount("");
      setAdding(false);
      setFetched(false);
      fetchSubItems();
    });
  };

  // Don't render anything until initial fetch completes
  if (!fetched) {
    return loading ? (
      <div className="mt-2 flex items-center justify-center py-2">
        <Spinner size="sm" color="blue" />
      </div>
    ) : null;
  }

  const hasSubItems = subItems.length > 0;

  // No sub-items and read-only → nothing to show
  if (!hasSubItems && isReadOnly) return null;

  // No sub-items and pending → show only the add button
  if (!hasSubItems && !isReadOnly) {
    return (
      <div className="mt-2">
        {adding ? (
          <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("subItemTitlePlaceholder")}
                className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder={t("subItemAmountPlaceholder")}
                className="w-full sm:w-28 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 hover:text-green-700 transition disabled:opacity-60"
                aria-label={t("addSubItem")}
              >
                {isPending ? <Spinner size="sm" color="gray" /> : <FiCheck size={16} />}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewTitle(""); setNewAmount(""); }}
                disabled={isPending}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 transition disabled:opacity-60"
                aria-label={t("cancel")}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setAdding(true); setActionError(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-hover)] transition min-w-[44px] min-h-[44px]"
          >
            <FiPlus size={14} />
            {t("addSubItem")}
          </button>
        )}
        {actionError && (
          <p className="text-xs text-red-500 mt-2">{actionError}</p>
        )}
      </div>
    );
  }

  // Has sub-items → show toggle + list
  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-hover)] transition min-w-[44px] min-h-[44px]"
        aria-expanded={expanded}
      >
        {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        {expanded ? t("collapseSubItems") : t("expandSubItems")}
      </button>

      {/* Expandable content with CSS transition */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? `${(contentRef.current?.scrollHeight ?? 0) + 500}px` : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pt-2 pb-1">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" color="blue" />
            </div>
          )}

          {!loading && fetched && subItems.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)] py-2">
              {t("noSubItems")}
            </p>
          )}

          {!loading && subItems.length > 0 && (
            <div className="space-y-2">
              {subItems.map((si) => (
                <div
                  key={si.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] transition-all duration-200"
                >
                  {editingId === si.id ? (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder={t("subItemTitlePlaceholder")}
                          className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder={t("subItemAmountPlaceholder")}
                          className="w-full sm:w-28 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(si.id)}
                          disabled={isPending}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 hover:text-green-700 transition disabled:opacity-60"
                          aria-label={t("confirmAction")}
                        >
                          {isPending ? <Spinner size="sm" color="gray" /> : <FiCheck size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 transition disabled:opacity-60"
                          aria-label={t("cancel")}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[var(--color-text-primary)] truncate block">
                          {si.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                          {formatCurrency(si.amount)}
                        </span>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(si)}
                              disabled={isPending}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition disabled:opacity-60"
                              aria-label={t("editSubItem")}
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(si.id)}
                              disabled={isPending}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 transition disabled:opacity-60"
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
            </div>
          )}

          {/* Summary: sum vs parent */}
          {!loading && fetched && subItems.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] space-y-1">
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t("subItemsSum", { value: formatCurrency(sum) })}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t("subItemsDifference", { value: formatCurrency(difference) })}
              </p>
              {exceeds && (
                <p className="text-xs text-amber-600 font-semibold">
                  {t("subItemsExceedsWarning")}
                </p>
              )}
            </div>
          )}

          {/* Add sub-item (only when pending) */}
          {!isReadOnly && !loading && fetched && (
            <div className="mt-3">
              {adding ? (
                <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={t("subItemTitlePlaceholder")}
                      className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder={t("subItemAmountPlaceholder")}
                      className="w-full sm:w-28 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={isPending}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 hover:text-green-700 transition disabled:opacity-60"
                      aria-label={t("addSubItem")}
                    >
                      {isPending ? <Spinner size="sm" color="gray" /> : <FiCheck size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdding(false); setNewTitle(""); setNewAmount(""); }}
                      disabled={isPending}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 transition disabled:opacity-60"
                      aria-label={t("cancel")}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAdding(true); setActionError(null); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-hover)] transition min-w-[44px] min-h-[44px]"
                >
                  <FiPlus size={14} />
                  {t("addSubItem")}
                </button>
              )}
            </div>
          )}

          {actionError && (
            <p className="text-xs text-red-500 mt-2">{actionError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
