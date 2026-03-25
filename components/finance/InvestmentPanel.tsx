"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FiTrendingUp, FiPlus, FiEdit2, FiTrash2, FiDollarSign } from "react-icons/fi";
import Spinner from "@/components/ui/Spinner";
import InvestmentBucketForm from "@/components/finance/InvestmentBucketForm";
import { deleteBucket, updateBucketBalance } from "@/app/[locale]/tools/finance/(protected)/actions";
import type { FinanceItem, InvestmentBucket } from "@/types/finance";

type Props = {
  items: FinanceItem[];
  buckets: InvestmentBucket[];
  boardId: string | null;
  locale: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function InvestmentPanel({ items, buckets, boardId, locale }: Props) {
  const t = useTranslations("FinanceInvestments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<InvestmentBucket | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [balanceEditId, setBalanceEditId] = useState<string | null>(null);
  const [newBalanceValue, setNewBalanceValue] = useState("");
  const [error, setError] = useState("");

  // Receitas disponíveis para vincular (fixas ou recorrentes do mês)
  const availableIncomes = useMemo(
    () => items.filter((i) => i.type === "income"),
    [items],
  );

  const totalBalance = useMemo(
    () => buckets.reduce((sum, b) => sum + b.currentBalance, 0),
    [buckets],
  );

  function handleEdit(bucket: InvestmentBucket) {
    setEditingBucket(bucket);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditingBucket(null);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingBucket(null);
  }

  async function handleDelete(bucketId: string) {
    setError("");
    const res = await deleteBucket(bucketId, locale);
    if (res && "error" in res && res.error) {
      setError(res.error as string);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(null);
    startTransition(() => router.refresh());
  }

  async function handleUpdateBalance(bucketId: string) {
    setError("");
    const parsed = parseFloat(newBalanceValue.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      setError(t("errors.invalidBalance"));
      return;
    }
    const res = await updateBucketBalance(bucketId, parsed, locale);
    if (res && "error" in res && res.error) {
      setError(res.error as string);
      return;
    }
    setBalanceEditId(null);
    setNewBalanceValue("");
    startTransition(() => router.refresh());
  }

  // Form modal open
  if (formOpen) {
    return (
      <InvestmentBucketForm
        bucket={editingBucket}
        boardId={boardId}
        locale={locale}
        incomes={availableIncomes}
        onClose={handleFormClose}
      />
    );
  }

  // Empty state
  if (buckets.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <FiTrendingUp
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("noBuckets")}
          </p>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("noBucketsHint")}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--color-accent-primary)" }}
          >
            <FiPlus size={16} />
            {t("createBucket")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
        >
          <FiPlus size={14} />
          {t("createBucket")}
        </button>
      </div>

      {/* Total Balance */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("totalBalance")}
        </p>
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[12px] text-red-500 px-1">{error}</p>
      )}

      {/* Bucket Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buckets.map((bucket) => (
          <div
            key={bucket.id}
            className="rounded-xl border shadow-sm p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Bucket header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                  <FiDollarSign size={18} />
                </div>
                <h4
                  className="text-sm font-bold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {bucket.name}
                </h4>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(bucket)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-raised)]"
                  style={{ color: "var(--color-text-muted)" }}
                  aria-label={t("editBucket")}
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(bucket.id)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: "var(--color-text-muted)" }}
                  aria-label={t("deleteBucket")}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-2">
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("balanceLabel")}
              </p>
              {balanceEditId === bucket.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newBalanceValue}
                    onChange={(e) => setNewBalanceValue(e.target.value)}
                    placeholder={t("newBalancePlaceholder")}
                    className="flex-1 p-2 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none text-sm"
                    style={{
                      background: "var(--color-surface-raised)",
                      color: "var(--color-text-primary)",
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateBalance(bucket.id)}
                    disabled={isPending}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: "var(--color-accent-primary)" }}
                  >
                    {isPending ? <Spinner size="sm" color="white" /> : t("confirmUpdateBalance")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBalanceEditId(null); setNewBalanceValue(""); }}
                    className="px-2 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t("cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBalanceEditId(bucket.id);
                    setNewBalanceValue(String(bucket.currentBalance));
                  }}
                  className="text-lg font-bold hover:underline cursor-pointer"
                  style={{ color: "var(--color-text-primary)" }}
                  title={t("updateBalanceLabel")}
                >
                  {formatCurrency(bucket.currentBalance)}
                </button>
              )}
            </div>

            {/* Allocation info */}
            {bucket.allocationType && (
              <div
                className="mt-2 pt-2 border-t text-xs"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  {t("allocationLabel")}:{" "}
                </span>
                <span className="font-semibold">
                  {bucket.allocationType === "percentage"
                    ? `${bucket.allocationValue}%`
                    : formatCurrency(bucket.allocationValue)}
                </span>
                {bucket.linkedIncomeTitle && (
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {" "}{t("ofIncome", { title: bucket.linkedIncomeTitle })}
                  </span>
                )}
                <span style={{ color: "var(--color-text-muted)" }}>
                  {" "}{t("perMonth")}
                </span>
              </div>
            )}

            {/* Delete confirmation */}
            {confirmDeleteId === bucket.id && (
              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t("confirmDeleteBucket")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(bucket.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all"
                  >
                    {isPending ? <Spinner size="sm" color="white" /> : t("deleteBucket")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
