"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiCheckCircle, FiEdit2, FiSearch, FiSkipForward } from "react-icons/fi";
import { bulkFinanceItemsAction } from "@/app/[locale]/tools/finance/(protected)/actions";
import { getOpenAmount } from "@/lib/finance/calculations";
import { normalizeForSearch } from "@/lib/finance/utils";
import type { FinanceItem } from "@/types/finance";
import Spinner from "@/components/ui/Spinner";

type Props = {
  items: FinanceItem[];
  locale: string;
  onEdit: (item: FinanceItem) => void;
};

type AccountFilter = "all" | "overdue" | "partial";

export default function FinanceAccountsPanel({ items, locale, onEdit }: Props) {
  const t = useTranslations("FinancePage");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];
  const query = normalizeForSearch(search);

  const accounts = useMemo(() => {
    return items
      .filter((item) => !item.isSynthetic && item.status !== "paid" && item.status !== "moved")
      .map((item) => ({ item, openAmount: getOpenAmount(item) }))
      .filter(({ item, openAmount }) => {
        if (openAmount <= 0) return false;
        const matchesSearch =
          !query ||
          normalizeForSearch(item.title).includes(query) ||
          normalizeForSearch(item.category || "").includes(query);
        const matchesFilter =
          filter === "all" ||
          (filter === "overdue" && item.date < today) ||
          (filter === "partial" && item.status === "partial");
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.item.date.localeCompare(b.item.date));
  }, [filter, items, query, today]);

  const payable = accounts.filter(({ item }) => item.type === "expense");
  const receivable = accounts.filter(({ item }) => item.type === "income");
  const payableTotal = payable.reduce((sum, entry) => sum + entry.openAmount, 0);
  const receivableTotal = receivable.reduce((sum, entry) => sum + entry.openAmount, 0);

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const runAction = (item: FinanceItem, action: "pay" | "move") => {
    setError(null);
    setActionKey(`${item.id}:${action}`);
    startTransition(async () => {
      const result = await bulkFinanceItemsAction([item.id], action, locale);
      if (result && "error" in result && result.error) {
        setError(result.error as string);
      } else {
        router.refresh();
      }
      setActionKey(null);
    });
  };

  const renderSection = (
    title: string,
    emptyText: string,
    rows: typeof accounts,
    total: number,
    tone: "expense" | "income",
  ) => (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h2>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {t("accountsSectionCount", { count: rows.length })}
          </p>
        </div>
        <span className={`text-sm font-bold ${tone === "income" ? "finance-success-text" : "finance-danger-text"}`}>
          {currency(total)}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
          {emptyText}
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {rows.map(({ item, openAmount }) => {
            const overdue = item.date < today;
            const settling = actionKey === `${item.id}:pay`;
            const moving = actionKey === `${item.id}:move`;
            return (
              <article key={item.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </p>
                    {overdue && (
                      <span className="rounded-full finance-warning-soft px-2 py-0.5 text-[10px] font-bold">
                        {t("accountsOverdueBadge")}
                      </span>
                    )}
                    {item.status === "partial" && (
                      <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
                        {t("accountsPartialBadge")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {item.date} · {item.category}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                  <span className={`text-sm font-bold ${tone === "income" ? "finance-success-text" : "finance-danger-text"}`}>
                    {currency(openAmount)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => runAction(item, "pay")}
                      disabled={isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-success-strong)] disabled:opacity-60"
                      title={item.type === "income" ? t("accountsReceiveAction") : t("accountsPayAction")}
                    >
                      {settling ? <Spinner size="sm" color="gray" /> : <FiCheckCircle size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(item, "move")}
                      disabled={isPending || item.status === "partial"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] disabled:opacity-50"
                      title={t("accountsMoveAction")}
                    >
                      {moving ? <Spinner size="sm" color="gray" /> : <FiSkipForward size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                      title={t("accountsEditAction")}
                    >
                      <FiEdit2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
            <FiSearch className="text-[var(--color-text-muted)]" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("accountsSearchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as AccountFilter)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
          >
            <option value="all">{t("accountsFilterAll")}</option>
            <option value="overdue">{t("accountsFilterOverdue")}</option>
            <option value="partial">{t("accountsFilterPartial")}</option>
          </select>
        </div>
        {error && (
          <p className="mt-3 rounded-xl border finance-danger-soft px-3 py-2 text-xs font-semibold">
            {error}
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {renderSection(
          t("accountsPayableTitle"),
          t("accountsPayableEmpty"),
          payable,
          payableTotal,
          "expense",
        )}
        {renderSection(
          t("accountsReceivableTitle"),
          t("accountsReceivableEmpty"),
          receivable,
          receivableTotal,
          "income",
        )}
      </div>
    </div>
  );
}
