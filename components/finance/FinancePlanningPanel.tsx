"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FiAlertTriangle, FiCalendar, FiTarget, FiTrendingUp } from "react-icons/fi";
import type { FinanceItem } from "@/types/finance";
import { getOpenAmount } from "@/lib/finance/calculations";
import {
  calculateFinancePlanning,
  calculateFinanceProjection,
  type PlanningRiskLevel,
} from "@/lib/finance/planning";

type Props = {
  items: FinanceItem[];
  projectionItems?: FinanceItem[];
  currentMonth: string;
};

function riskClassName(riskLevel: PlanningRiskLevel) {
  if (riskLevel === "high") return "finance-danger-soft";
  if (riskLevel === "medium") return "finance-warning-soft";
  return "finance-success-soft";
}

export default function FinancePlanningPanel({ items, projectionItems = [], currentMonth }: Props) {
  const t = useTranslations("FinancePage");
  const summary = useMemo(
    () => calculateFinancePlanning(items, currentMonth),
    [items, currentMonth],
  );
  const projection = useMemo(() => {
    const currentItemIds = new Set(items.map((item) => item.id));
    const mergedItems = [
      ...items,
      ...projectionItems.filter((item) => !currentItemIds.has(item.id)),
    ];
    return calculateFinanceProjection(mergedItems, currentMonth, 6);
  }, [currentMonth, items, projectionItems]);

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const recommendationTone =
    summary.dailyRecommendation >= 0 ? "finance-success-text" : "finance-danger-text";
  const riskLabel =
    summary.riskLevel === "high"
      ? t("planningRiskHigh")
      : summary.riskLevel === "medium"
        ? t("planningRiskMedium")
        : t("planningRiskLow");

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiTarget size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("planningDailyTitle")}
            </h2>
          </div>
          <p className={`text-2xl font-extrabold ${recommendationTone}`}>
            {currency(summary.dailyRecommendation)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("planningDailyHint", { days: summary.daysRemaining })}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiCalendar size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("planningWeeklyTitle")}
            </h2>
          </div>
          <p className={`text-2xl font-extrabold ${recommendationTone}`}>
            {currency(summary.weeklyRecommendation)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("planningWeeklyHint")}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 ${riskClassName(summary.riskLevel)}`}>
          <div className="mb-3 flex items-center gap-2">
            <FiAlertTriangle size={17} />
            <h2 className="text-sm font-bold">{t("planningRiskTitle")}</h2>
          </div>
          <p className="text-2xl font-extrabold">
            {riskLabel}
          </p>
          <p className="mt-1 text-xs">
            {t("planningForecastBalance", { value: currency(summary.forecastBalance) })}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiTrendingUp size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("planningMonthSummaryTitle")}
            </h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningRealizedBalance")}</span>
              <span className="font-bold text-[var(--color-text-primary)]">
                {currency(summary.realizedBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningPendingIncome")}</span>
              <span className="font-bold finance-success-text">
                {currency(summary.pendingIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningPendingExpense")}</span>
              <span className="font-bold finance-danger-text">
                {currency(summary.pendingExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-2">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {t("planningProjectedBalance")}
              </span>
              <span className={`font-extrabold ${summary.forecastBalance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                {currency(summary.forecastBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
            {t("planningAlertsTitle")}
          </h2>
          <div className="space-y-2">
            {summary.overdueCount > 0 && (
              <p className="rounded-xl border finance-warning-soft px-3 py-2 text-xs font-semibold">
                {t("planningOverdueAlert", {
                  count: summary.overdueCount,
                  value: currency(summary.overdueAmount),
                })}
              </p>
            )}
            {summary.dueSoonCount > 0 && (
              <p className="rounded-xl border finance-info-soft px-3 py-2 text-xs font-semibold">
                {t("planningDueSoonAlert", {
                  count: summary.dueSoonCount,
                  value: currency(summary.dueSoonAmount),
                })}
              </p>
            )}
            {summary.forecastBalance < 0 && (
              <p className="rounded-xl border finance-danger-soft px-3 py-2 text-xs font-semibold">
                {t("planningNegativeAlert", { value: currency(Math.abs(summary.forecastBalance)) })}
              </p>
            )}
            {summary.overdueCount === 0 && summary.dueSoonCount === 0 && summary.forecastBalance >= 0 && (
              <p className="rounded-xl border finance-success-soft px-3 py-2 text-xs font-semibold">
                {t("planningNoAlerts")}
              </p>
            )}
          </div>
        </div>
      </section>

      {summary.largestOpenExpenses.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
            {t("planningLargestExpensesTitle")}
          </h2>
          <div className="divide-y divide-[var(--color-border)]">
            {summary.largestOpenExpenses.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.date}</p>
                </div>
                <span className="shrink-0 font-bold finance-danger-text">
                  {currency(getOpenAmount(item))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            {t("planningProjectionTitle")}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t("planningProjectionHint")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {projection.map((entry) => {
            const entryRiskLabel =
              entry.summary.riskLevel === "high"
                ? t("planningRiskHigh")
                : entry.summary.riskLevel === "medium"
                  ? t("planningRiskMedium")
                  : t("planningRiskLow");

            return (
              <article
                key={entry.month}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {entry.month}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${riskClassName(entry.summary.riskLevel)}`}>
                    {entryRiskLabel}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-text-muted)]">{t("planningPendingIncome")}</span>
                    <span className="font-semibold finance-success-text">
                      {currency(entry.summary.pendingIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-text-muted)]">{t("planningPendingExpense")}</span>
                    <span className="font-semibold finance-danger-text">
                      {currency(entry.summary.pendingExpense)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {t("planningProjectedBalance")}
                    </span>
                    <span className={`font-bold ${entry.summary.forecastBalance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                      {currency(entry.summary.forecastBalance)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
