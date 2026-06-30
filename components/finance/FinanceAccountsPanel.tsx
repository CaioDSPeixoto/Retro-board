"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiChevronRight, FiEdit2, FiX } from "react-icons/fi";
import {
  applyPaymentToFinanceItem,
  bulkFinanceItemsAction,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import { getOpenAmount } from "@/lib/finance/calculations";
import type { FinanceItem } from "@/types/finance";
import Spinner from "@/components/ui/Spinner";

type Props = {
  items: FinanceItem[];
  locale: string;
  onEdit?: (item: FinanceItem) => void;
};

export default function FinanceAccountsPanel({ items, locale, onEdit }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentItem, setPaymentItem] = useState<FinanceItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<"all" | "overdue" | "partial">("all");

  const today = new Date().toISOString().split("T")[0];
  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const normalizedSearch = accountSearch.trim().toLowerCase();
  const openItems = items
    .filter((item) => !item.isSynthetic && item.status !== "paid" && item.status !== "moved")
    .map((item) => ({ item, openAmount: getOpenAmount(item) }))
    .filter(({ openAmount }) => openAmount > 0)
    .filter(({ item }) => {
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        (item.category || "").toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        accountFilter === "all" ||
        (accountFilter === "overdue" && item.date < today) ||
        (accountFilter === "partial" && item.status === "partial");
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.item.date.localeCompare(b.item.date));

  const expenses = openItems.filter(({ item }) => item.type === "expense");
  const incomes = openItems.filter(({ item }) => item.type === "income");

  const runQuickAction = (item: FinanceItem, action: "pay" | "move") => {
    setError(null);
    setActionKey(`${item.id}:${action}`);
    startTransition(async () => {
      const res = await bulkFinanceItemsAction([item.id], action, locale);
      if (res && "error" in res && res.error) {
        setError(res.error as string);
      } else {
        router.refresh();
      }
      setActionKey(null);
    });
  };

  const openPayment = (item: FinanceItem) => {
    setError(null);
    setPaymentItem(item);
    setPaymentMode("full");
    setPartialValue("");
  };

  const confirmPayment = () => {
    if (!paymentItem || actionKey) return;

    setError(null);
    setActionKey(`${paymentItem.id}:pay`);
    startTransition(async () => {
      const res = await applyPaymentToFinanceItem(
        paymentItem.id,
        paymentMode,
        paymentMode === "partial" ? partialValue : null,
        locale,
      );

      if (res && "error" in res && res.error) {
        setError(res.error as string);
      } else {
        setPaymentItem(null);
        router.refresh();
      }

      setActionKey(null);
    });
  };

  const renderList = (entries: typeof openItems, emptyLabel: string) => {
    if (entries.length === 0) {
      return (
        <p className="py-4 text-sm text-[var(--color-text-muted)]">
          {emptyLabel}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(({ item, openAmount }) => {
          const overdue = item.date < today;
          const actionPending = actionKey !== null || isPending;
          const loadingPay = actionKey === `${item.id}:pay`;
          const loadingMove = actionKey === `${item.id}:move`;
          const canMove = item.status !== "partial";

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-xl border p-3 ${
                overdue
                  ? "finance-warning-soft"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {format(parseISO(item.date), "dd 'de' MMM", { locale: ptBR })}
                    {item.category ? ` · ${item.category}` : ""}
                    {overdue ? ` · ${t("accountOverdueBadge")}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.type === "income" ? "finance-success-text" : "finance-danger-text"}`}>
                    {currency(openAmount)}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {item.status === "partial" ? t("accountPartialBadge") : t("accountPendingBadge")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    disabled={actionPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                  >
                    <FiEdit2 size={13} />
                    {t("accountEditAction")}
                  </button>
                )}
                {canMove && (
                  <button
                    type="button"
                    onClick={() => runQuickAction(item, "move")}
                    disabled={actionPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border finance-info-soft px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-60"
                  >
                    {loadingMove ? <Spinner size="sm" color="gray" /> : <FiChevronRight size={13} />}
                    {t("accountMoveAction")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openPayment(item)}
                  disabled={actionPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-success-strong)] px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                >
                  {loadingPay ? <Spinner size="sm" color="white" /> : <FiCheckCircle size={13} />}
                  {item.type === "income" ? t("accountReceiveAction") : t("accountPayAction")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border finance-danger-soft px-3 py-2 text-xs font-medium">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={accountSearch}
          onChange={(event) => setAccountSearch(event.target.value)}
          placeholder={t("accountsSearchPlaceholder")}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-blue-500"
        />
        <select
          value={accountFilter}
          onChange={(event) => setAccountFilter(event.target.value as typeof accountFilter)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-blue-500"
        >
          <option value="all">{t("accountsFilterAll")}</option>
          <option value="overdue">{t("accountsFilterOverdue")}</option>
          <option value="partial">{t("accountsFilterPartial")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-1 text-sm font-bold text-[var(--color-text-primary)]">
            {t("accountsPayableTitle")}
          </h2>
          <p className="mb-3 text-xs text-[var(--color-text-muted)]">
            {t("accountsPayableSubtitle")}
          </p>
          {renderList(expenses, t("accountsPayableEmpty"))}
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-1 text-sm font-bold text-[var(--color-text-primary)]">
            {t("accountsReceivableTitle")}
          </h2>
          <p className="mb-3 text-xs text-[var(--color-text-muted)]">
            {t("accountsReceivableSubtitle")}
          </p>
          {renderList(incomes, t("accountsReceivableEmpty"))}
        </section>
      </div>

      {paymentItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {paymentItem.type === "income" ? t("accountReceiveAction") : t("accountPayAction")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {paymentItem.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentItem(null)}
                disabled={!!actionKey}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] disabled:opacity-50"
                aria-label={t("accountClosePayment")}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  checked={paymentMode === "full"}
                  onChange={() => setPaymentMode("full")}
                  className="h-4 w-4 accent-[var(--color-accent-primary)]"
                />
                <span>
                  {t("accountFullPayment")}{" "}
                  <strong>{currency(getOpenAmount(paymentItem))}</strong>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  checked={paymentMode === "partial"}
                  onChange={() => setPaymentMode("partial")}
                  className="h-4 w-4 accent-[var(--color-accent-primary)]"
                />
                <span>{t("accountPartialPayment")}</span>
              </label>

              {paymentMode === "partial" && (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={partialValue}
                  onChange={(event) => setPartialValue(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-blue-500"
                />
              )}

              {error && (
                <p className="rounded-lg border finance-danger-soft px-3 py-2 text-xs font-medium">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentItem(null)}
                disabled={!!actionKey}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-50"
              >
                {t("accountCancelPayment")}
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={!!actionKey}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-success-strong)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {actionKey === `${paymentItem.id}:pay` && <Spinner size="sm" color="white" />}
                {t("accountConfirmPayment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
