"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FiAlertTriangle, FiCalendar, FiCreditCard, FiTarget, FiTrendingUp } from "react-icons/fi";
import type { FinanceBudget, FinanceCard, FinanceDebt, FinanceItem } from "@/types/finance";
import { getOpenAmount } from "@/lib/finance/calculations";
import { calculateCardDashboard } from "@/lib/finance/card-dashboard";
import {
  calculateFinancePlanning,
  calculateFinanceProjection,
  type FinancePlanningRecommendation,
  type PlanningRiskLevel,
} from "@/lib/finance/planning";
import { calculateDailyCashFlow } from "@/lib/finance/cash-flow";
import { calculateSmartAlerts } from "@/lib/finance/smart-alerts";
import PrivacyValue from "@/components/finance/PrivacyValue";

type Props = {
  items: FinanceItem[];
  projectionItems?: FinanceItem[];
  debts?: FinanceDebt[];
  cards?: FinanceCard[];
  currentMonth: string;
  previousCashBalance?: number;
  previousMonthItems?: FinanceItem[];
  budgets?: FinanceBudget[];
};

function riskClassName(riskLevel: PlanningRiskLevel) {
  if (riskLevel === "high") return "finance-danger-soft";
  if (riskLevel === "medium") return "finance-warning-soft";
  return "finance-success-soft";
}

function recommendationClassName(priority: FinancePlanningRecommendation["priority"]) {
  if (priority === "danger") return "finance-danger-soft";
  if (priority === "warning") return "finance-warning-soft";
  if (priority === "success") return "finance-success-soft";
  return "finance-info-soft";
}

export default function FinancePlanningPanel({ items, projectionItems = [], debts = [], cards = [], currentMonth, previousCashBalance = 0, previousMonthItems = [], budgets = [] }: Props) {
  const t = useTranslations("FinancePage");
  const summary = useMemo(
    () => calculateFinancePlanning(items, currentMonth, undefined, debts),
    [items, currentMonth, debts],
  );
  const projection = useMemo(() => {
    const currentItemIds = new Set(items.map((item) => item.id));
    const mergedItems = [
      ...items,
      ...projectionItems.filter((item) => !currentItemIds.has(item.id)),
    ];
    return calculateFinanceProjection(mergedItems, currentMonth, 6, undefined, debts);
  }, [currentMonth, debts, items, projectionItems]);
  const cardAlerts = useMemo(() => {
    const currentItemIds = new Set(items.map((item) => item.id));
    const mergedItems = [
      ...items,
      ...projectionItems.filter((item) => !currentItemIds.has(item.id)),
    ];
    const dashboard = calculateCardDashboard(cards, mergedItems, currentMonth);

    return cards.reduce(
      (acc, card) => {
        const used = dashboard.cardTotals.get(card.id) ?? 0;
        const limit = Number(card.limit || 0);
        const percent = limit > 0 ? (used / limit) * 100 : 0;
        if (limit > 0 && used > limit) {
          acc.overLimit.push({ card, used, limit, percent });
        } else if ((limit > 0 && percent >= 70) || (limit <= 0 && used >= 1000)) {
          acc.highInvoice.push({ card, used, limit, percent });
        }
        return acc;
      },
      {
        overLimit: [] as Array<{ card: FinanceCard; used: number; limit: number; percent: number }>,
        highInvoice: [] as Array<{ card: FinanceCard; used: number; limit: number; percent: number }>,
      },
    );
  }, [cards, currentMonth, items, projectionItems]);

  const smartAlerts = useMemo(
    () => calculateSmartAlerts(items, previousMonthItems, budgets),
    [items, previousMonthItems, budgets],
  );

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
  const paceMessage =
    summary.spendingPaceStatus === "over"
      ? t("planningPaceOver")
      : summary.spendingPaceStatus === "near"
        ? t("planningPaceNear")
        : t("planningPaceUnder");
  const paceTone =
    summary.spendingPaceStatus === "over"
      ? "finance-danger-text"
      : summary.spendingPaceStatus === "near"
        ? "finance-warning-text"
        : "finance-success-text";

  const getRecommendationText = (recommendation: FinancePlanningRecommendation) => {
    if (recommendation.code === "negative_balance") {
      return t("planningRecommendationNegative", {
        value: currency(recommendation.amount ?? 0),
      });
    }
    if (recommendation.code === "overdue") {
      return t("planningRecommendationOverdue", {
        count: recommendation.count ?? 0,
        value: currency(recommendation.amount ?? 0),
      });
    }
    if (recommendation.code === "pace_over") {
      return t("planningRecommendationPaceOver");
    }
    if (recommendation.code === "top_category") {
      return t("planningRecommendationTopCategory", {
        category: recommendation.category ?? "",
        percent: String(Math.round(recommendation.percentage ?? 0)),
        value: currency(recommendation.amount ?? 0),
      });
    }
    if (recommendation.code === "debt_priority") {
      return t("planningRecommendationDebtPriority", {
        title: recommendation.title ?? "",
        value: currency(recommendation.amount ?? 0),
      });
    }
    if (recommendation.code === "debt_reserve") {
      return t("planningRecommendationDebtReserve", {
        value: currency(recommendation.amount ?? 0),
      });
    }
    return t("planningRecommendationHealthy");
  };

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
            <PrivacyValue>{currency(summary.dailyRecommendation)}</PrivacyValue>
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
            <PrivacyValue>{currency(summary.weeklyRecommendation)}</PrivacyValue>
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
            <PrivacyValue>{t("planningForecastBalance", { value: currency(summary.forecastBalance) })}</PrivacyValue>
          </p>
        </div>
      </section>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <section className="rounded-2xl border finance-warning-soft p-4">
          <h2 className="mb-2 text-sm font-bold">{t("smartAlertsTitle")}</h2>
          <div className="space-y-1">
            {smartAlerts.map((alert, idx) => (
              <p key={idx} className="text-xs font-semibold">
                {alert.type === "unusual_spending"
                  ? t("smartAlertUnusualSpending", { category: alert.category, value: currency(alert.value), average: currency(alert.average ?? 0) })
                  : t("smartAlertBudgetWarning", { category: alert.category, percent: String(alert.percent ?? 0) })}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
          {t("planningRecommendationsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {summary.recommendations.map((recommendation) => (
            <p
              key={recommendation.code}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${recommendationClassName(recommendation.priority)}`}
            >
              <PrivacyValue>{getRecommendationText(recommendation)}</PrivacyValue>
            </p>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiCreditCard size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("planningDebtOpenTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold finance-danger-text">
            <PrivacyValue>{currency(summary.debtOpenBalance)}</PrivacyValue>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("planningDebtOpenHint")}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <FiCalendar size={17} />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {t("planningDebtDueTitle")}
            </h2>
          </div>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)]">
            <PrivacyValue>{currency(summary.debtDueThisMonthAmount)}</PrivacyValue>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {t("planningDebtDueHint", { count: summary.debtDueThisMonthCount })}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 ${summary.priorityDebt ? "finance-warning-soft" : "finance-success-soft"}`}>
          <div className="mb-3 flex items-center gap-2">
            <FiAlertTriangle size={17} />
            <h2 className="text-sm font-bold">{t("planningDebtPriorityTitle")}</h2>
          </div>
          {summary.priorityDebt ? (
            <>
              <p className="truncate text-lg font-extrabold">
                {summary.priorityDebt.name}
              </p>
              <p className="mt-1 text-xs">
                <PrivacyValue>
                  {t("planningDebtPriorityHint", {
                    value: currency(summary.priorityDebt.currentBalance),
                    date: summary.priorityDebt.dueDate,
                  })}
                </PrivacyValue>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold">{t("planningDebtPriorityEmpty")}</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
            {t("planningPaceTitle")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningRealizedDailyExpense")}</span>
              <span className="font-bold finance-danger-text">
                <PrivacyValue>{currency(summary.realizedDailyExpense)}</PrivacyValue>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningDailyAvailable")}</span>
              <span className={`font-bold ${recommendationTone}`}>
                <PrivacyValue>{currency(summary.dailyRecommendation)}</PrivacyValue>
              </span>
            </div>
            <p className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs font-semibold ${paceTone}`}>
              {paceMessage}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
            {t("planningTopCategoriesTitle")}
          </h2>
          {summary.topExpenseCategories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
              {t("planningTopCategoriesEmpty")}
            </p>
          ) : (
            <div className="space-y-2">
              {summary.topExpenseCategories.map((entry) => (
                <div key={entry.category} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold text-[var(--color-text-primary)]">
                      {entry.category}
                    </span>
                    <span className="font-bold finance-danger-text"><PrivacyValue>{currency(entry.amount)}</PrivacyValue></span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {t("planningCategoryShare", { percent: entry.percentage.toFixed(0) })}
                  </p>
                </div>
              ))}
            </div>
          )}
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
                <PrivacyValue>{currency(summary.realizedBalance)}</PrivacyValue>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningPendingIncome")}</span>
              <span className="font-bold finance-success-text">
                <PrivacyValue>{currency(summary.pendingIncome)}</PrivacyValue>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">{t("planningPendingExpense")}</span>
              <span className="font-bold finance-danger-text">
                <PrivacyValue>{currency(summary.pendingExpense)}</PrivacyValue>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-2">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {t("planningProjectedBalance")}
              </span>
              <span className={`font-extrabold ${summary.forecastBalance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                <PrivacyValue>{currency(summary.forecastBalance)}</PrivacyValue>
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
                <PrivacyValue>
                  {t("planningOverdueAlert", {
                    count: summary.overdueCount,
                    value: currency(summary.overdueAmount),
                  })}
                </PrivacyValue>
              </p>
            )}
            {summary.dueSoonCount > 0 && (
              <p className="rounded-xl border finance-info-soft px-3 py-2 text-xs font-semibold">
                <PrivacyValue>
                  {t("planningDueSoonAlert", {
                    count: summary.dueSoonCount,
                    value: currency(summary.dueSoonAmount),
                  })}
                </PrivacyValue>
              </p>
            )}
            {summary.forecastBalance < 0 && (
              <p className="rounded-xl border finance-danger-soft px-3 py-2 text-xs font-semibold">
                <PrivacyValue>{t("planningNegativeAlert", { value: currency(Math.abs(summary.forecastBalance)) })}</PrivacyValue>
              </p>
            )}
            {cardAlerts.overLimit.map((alert) => (
              <p key={`over-${alert.card.id}`} className="rounded-xl border finance-danger-soft px-3 py-2 text-xs font-semibold">
                <PrivacyValue>
                  {t("planningCardOverLimitAlert", {
                    card: alert.card.name,
                    value: currency(alert.used - alert.limit),
                    percent: alert.percent.toFixed(0),
                  })}
                </PrivacyValue>
              </p>
            ))}
            {cardAlerts.highInvoice.map((alert) => (
              <p key={`high-${alert.card.id}`} className="rounded-xl border finance-warning-soft px-3 py-2 text-xs font-semibold">
                <PrivacyValue>
                  {t("planningCardHighInvoiceAlert", {
                    card: alert.card.name,
                    value: currency(alert.used),
                    percent: alert.limit > 0 ? alert.percent.toFixed(0) : "0",
                  })}
                </PrivacyValue>
              </p>
            ))}
            {summary.overdueCount === 0 &&
              summary.dueSoonCount === 0 &&
              summary.forecastBalance >= 0 &&
              cardAlerts.overLimit.length === 0 &&
              cardAlerts.highInvoice.length === 0 && (
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
                  <PrivacyValue>{currency(getOpenAmount(item))}</PrivacyValue>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Daily Cash Flow */}
      <DailyCashFlowSection items={items} currentMonth={currentMonth} startBalance={previousCashBalance} currency={currency} />

      {/* What-if scenario */}
      <WhatIfSection items={items} currentMonth={currentMonth} debts={debts} currency={currency} />

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
                      <PrivacyValue>{currency(entry.summary.pendingIncome)}</PrivacyValue>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--color-text-muted)]">{t("planningPendingExpense")}</span>
                    <span className="font-semibold finance-danger-text">
                      <PrivacyValue>{currency(entry.summary.pendingExpense)}</PrivacyValue>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {t("planningProjectedBalance")}
                    </span>
                    <span className={`font-bold ${entry.summary.forecastBalance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
                      <PrivacyValue>{currency(entry.summary.forecastBalance)}</PrivacyValue>
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

function WhatIfSection({
  items,
  currentMonth,
  debts,
  currency,
}: {
  items: FinanceItem[];
  currentMonth: string;
  debts: FinanceDebt[];
  currency: (v: number) => string;
}) {
  const t = useTranslations("FinancePage");
  const [open, setOpen] = useState(false);
  const [cuts, setCuts] = useState<Map<string, number>>(new Map());

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.type !== "expense" || item.status === "moved" || item.isSynthetic) continue;
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [items]);

  const whatIfSummary = useMemo(() => {
    if (cuts.size === 0) return null;

    const adjustedItems = items.map((item) => {
      if (item.type !== "expense" || item.status === "moved" || item.isSynthetic) return item;
      const cutPercent = cuts.get(item.category);
      if (!cutPercent || cutPercent <= 0) return item;
      const factor = 1 - cutPercent / 100;
      return { ...item, amount: item.amount * factor };
    });

    return calculateFinancePlanning(adjustedItems, currentMonth, undefined, debts);
  }, [cuts, currentMonth, debts, items]);

  const originalSummary = useMemo(
    () => calculateFinancePlanning(items, currentMonth, undefined, debts),
    [items, currentMonth, debts],
  );

  const handleCut = (category: string, percent: number) => {
    setCuts((prev) => {
      const next = new Map(prev);
      if (percent <= 0) next.delete(category);
      else next.set(category, percent);
      return next;
    });
  };

  if (!open) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left"
        >
          <h2 className="text-sm font-bold text-[var(--color-accent-text)]">
            {t("whatIfTitle")}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{t("whatIfHint")}</p>
        </button>
      </section>
    );
  }

  const savings = whatIfSummary
    ? whatIfSummary.forecastBalance - originalSummary.forecastBalance
    : 0;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{t("whatIfTitle")}</h2>
        <button
          type="button"
          onClick={() => { setOpen(false); setCuts(new Map()); }}
          className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline"
        >
          {t("whatIfClose")}
        </button>
      </div>

      <div className="space-y-3">
        {categories.map(({ category, total }) => {
          const cutValue = cuts.get(category) ?? 0;
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                  {category}
                </span>
                <span className="shrink-0 text-[var(--color-text-muted)]">
                  {currency(total)} → {currency(total * (1 - cutValue / 100))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={cutValue}
                  onChange={(e) => handleCut(category, Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-[var(--color-border)] accent-[var(--color-accent-primary)]"
                />
                <span className="text-[11px] font-bold w-10 text-right" style={{ color: cutValue > 0 ? "var(--color-accent-primary)" : "var(--color-text-muted)" }}>
                  -{cutValue}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {whatIfSummary && savings !== 0 && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--color-text-primary)]">{t("whatIfResult")}</span>
            <span className="font-bold finance-success-text">
              <PrivacyValue>+{currency(savings)}</PrivacyValue>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>{t("whatIfProjectedBalance")}</span>
            <span className={`font-bold ${whatIfSummary.forecastBalance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
              <PrivacyValue>{currency(whatIfSummary.forecastBalance)}</PrivacyValue>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function DailyCashFlowSection({
  items,
  currentMonth,
  startBalance,
  currency,
}: {
  items: FinanceItem[];
  currentMonth: string;
  startBalance: number;
  currency: (v: number) => string;
}) {
  const t = useTranslations("FinancePage");
  const [open, setOpen] = useState(false);

  const cashFlow = useMemo(
    () => calculateDailyCashFlow(items, currentMonth, startBalance),
    [items, currentMonth, startBalance],
  );

  const minBalance = Math.min(...cashFlow.map((e) => e.balance));
  const maxBalance = Math.max(...cashFlow.map((e) => e.balance));
  const range = maxBalance - minBalance || 1;
  const today = new Date().toISOString().split("T")[0];
  const negativeDay = cashFlow.find((e) => e.balance < 0);

  if (!open) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
          <h2 className="text-sm font-bold text-[var(--color-accent-text)]">{t("cashFlowTitle")}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{t("cashFlowHint")}</p>
          {negativeDay && (
            <p className="text-xs finance-danger-text font-semibold mt-1">
              {t("cashFlowNegativeWarning", { date: negativeDay.date.slice(8) })}
            </p>
          )}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{t("cashFlowTitle")}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline"
        >
          {t("cashFlowClose")}
        </button>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-[2px] h-32 rounded-lg bg-[var(--color-surface-raised)] p-2 overflow-hidden">
        {cashFlow.map((entry) => {
          const height = Math.max(((entry.balance - minBalance) / range) * 100, 3);
          const isToday = entry.date === today;
          const isNeg = entry.balance < 0;

          return (
            <div
              key={entry.date}
              className={`flex-1 rounded-t transition-all ${isNeg ? "bg-[var(--color-danger-strong)]" : isToday ? "bg-[var(--color-accent-primary)]" : "bg-[var(--color-success-strong)] opacity-60"}`}
              style={{ height: `${height}%` }}
              title={`${entry.date.slice(8)}/${entry.date.slice(5, 7)}: ${currency(entry.balance)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>01</span>
        <span>{String(cashFlow.length)}</span>
      </div>

      {/* Key stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-[var(--color-surface-raised)] p-2 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("cashFlowMin")}</p>
          <p className={`font-bold ${minBalance < 0 ? "finance-danger-text" : "text-[var(--color-text-primary)]"}`}>
            <PrivacyValue>{currency(minBalance)}</PrivacyValue>
          </p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-raised)] p-2 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("cashFlowMax")}</p>
          <p className="font-bold finance-success-text">
            <PrivacyValue>{currency(maxBalance)}</PrivacyValue>
          </p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-raised)] p-2 text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">{t("cashFlowEnd")}</p>
          <p className={`font-bold ${cashFlow[cashFlow.length - 1]?.balance < 0 ? "finance-danger-text" : "finance-success-text"}`}>
            <PrivacyValue>{currency(cashFlow[cashFlow.length - 1]?.balance ?? 0)}</PrivacyValue>
          </p>
        </div>
      </div>

      {negativeDay && (
        <p className="mt-2 text-[11px] finance-danger-text font-semibold">
          {t("cashFlowNegativeWarning", { date: negativeDay.date.slice(8) })}
        </p>
      )}
    </section>
  );
}
