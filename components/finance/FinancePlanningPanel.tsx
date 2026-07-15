"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FiAlertTriangle, FiCalendar, FiCreditCard, FiTarget, FiTrendingUp } from "react-icons/fi";
import type { FinanceCard, FinanceDebt, FinanceItem } from "@/types/finance";
import { getOpenAmount } from "@/lib/finance/calculations";
import { calculateCardDashboard } from "@/lib/finance/card-dashboard";
import {
  calculateFinancePlanning,
  calculateFinanceProjection,
  type FinancePlanningRecommendation,
  type PlanningRiskLevel,
} from "@/lib/finance/planning";
import PrivacyValue from "@/components/finance/PrivacyValue";

type Props = {
  items: FinanceItem[];
  projectionItems?: FinanceItem[];
  debts?: FinanceDebt[];
  cards?: FinanceCard[];
  currentMonth: string;
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

export default function FinancePlanningPanel({ items, projectionItems = [], debts = [], cards = [], currentMonth }: Props) {
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
