"use client";

import type { FinanceItem } from "@/types/finance";
import { getOpenAmount } from "@/lib/finance/calculations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";

type Props = {
  items: FinanceItem[];
};

export default function FinanceAccountsPanel({ items }: Props) {
  const t = useTranslations("FinancePage");
  const today = new Date().toISOString().split("T")[0];
  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const openItems = items
    .filter((item) => !item.isSynthetic && item.status !== "paid" && item.status !== "moved")
    .map((item) => ({ item, openAmount: getOpenAmount(item) }))
    .filter(({ openAmount }) => openAmount > 0)
    .sort((a, b) => a.item.date.localeCompare(b.item.date));

  const expenses = openItems.filter(({ item }) => item.type === "expense");
  const incomes = openItems.filter(({ item }) => item.type === "income");

  const renderList = (entries: typeof openItems, emptyLabel: string) => {
    if (entries.length === 0) {
      return (
        <p className="text-sm text-[var(--color-text-muted)] py-4">
          {emptyLabel}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(({ item, openAmount }) => {
          const overdue = item.date < today;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${
                overdue
                  ? "bg-amber-50 border-amber-200"
                  : "bg-[var(--color-surface)] border-[var(--color-border)]"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {format(parseISO(item.date), "dd 'de' MMM", { locale: ptBR })}
                  {item.category ? ` · ${item.category}` : ""}
                  {overdue ? ` · ${t("accountOverdueBadge")}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {currency(openAmount)}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {item.status === "partial" ? t("accountPartialBadge") : t("accountPendingBadge")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
          {t("accountsPayableTitle")}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          {t("accountsPayableSubtitle")}
        </p>
        {renderList(expenses, t("accountsPayableEmpty"))}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
          {t("accountsReceivableTitle")}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          {t("accountsReceivableSubtitle")}
        </p>
        {renderList(incomes, t("accountsReceivableEmpty"))}
      </section>
    </div>
  );
}
