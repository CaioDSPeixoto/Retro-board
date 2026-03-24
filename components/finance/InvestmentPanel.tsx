"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FiTrendingUp, FiChevronDown, FiChevronUp } from "react-icons/fi";
import InvestmentCategoryCard from "@/components/finance/InvestmentCategoryCard";
import InvestmentConfigForm from "@/components/finance/InvestmentConfigForm";
import { INVESTMENT_CATEGORIES } from "@/lib/finance/constants";
import type { FinanceItem, InvestmentConfig, InvestmentCategory } from "@/types/finance";

type Props = {
  items: FinanceItem[];
  investmentConfig: InvestmentConfig | null;
  boardId: string | null;
  locale: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function groupItemsByMonth(items: FinanceItem[]): Record<string, FinanceItem[]> {
  const grouped: Record<string, FinanceItem[]> = {};
  for (const item of items) {
    const month = item.date.slice(0, 7); // "YYYY-MM"
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(item);
  }
  return grouped;
}

function getLast12MonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${y}-${m}`);
  }
  return keys;
}

function formatMonthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function InvestmentPanel({ items, investmentConfig, boardId, locale }: Props) {
  const t = useTranslations("FinanceInvestments");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Filter only items with investmentCategory
  const investmentItems = useMemo(
    () => items.filter((item) => item.investmentCategory && item.status !== "moved"),
    [items],
  );

  // Calculate totals per category
  const totalsPerCategory = useMemo(() => {
    const totals: Record<InvestmentCategory, number> = {
      emergency: 0,
      "fixed-income": 0,
      "variable-income": 0,
    };
    for (const item of investmentItems) {
      if (item.investmentCategory) {
        totals[item.investmentCategory] += item.amount;
      }
    }
    return totals;
  }, [investmentItems]);

  const totalInvested = useMemo(
    () => Object.values(totalsPerCategory).reduce((a, b) => a + b, 0),
    [totalsPerCategory],
  );

  // Calculate suggested amounts based on config
  const suggestedAmounts = useMemo(() => {
    if (!investmentConfig?.allocations?.length) return undefined;
    const map: Partial<Record<InvestmentCategory, number>> = {};
    for (const alloc of investmentConfig.allocations) {
      map[alloc.category] = (totalInvested * alloc.percentage) / 100;
    }
    return map;
  }, [investmentConfig, totalInvested]);

  // Allocation percentages from config
  const allocationPercentages = useMemo(() => {
    if (!investmentConfig?.allocations?.length) return undefined;
    const map: Partial<Record<InvestmentCategory, number>> = {};
    for (const alloc of investmentConfig.allocations) {
      map[alloc.category] = alloc.percentage;
    }
    return map;
  }, [investmentConfig]);

  // Last 12 months history
  const monthlyHistory = useMemo(() => {
    const grouped = groupItemsByMonth(investmentItems);
    const months = getLast12MonthKeys();
    return months.map((monthKey) => {
      const monthItems = grouped[monthKey] || [];
      const perCategory: Record<InvestmentCategory, number> = {
        emergency: 0,
        "fixed-income": 0,
        "variable-income": 0,
      };
      for (const item of monthItems) {
        if (item.investmentCategory) {
          perCategory[item.investmentCategory] += item.amount;
        }
      }
      const total = Object.values(perCategory).reduce((a, b) => a + b, 0);
      return { monthKey, perCategory, total };
    });
  }, [investmentItems]);

  // Empty state
  if (investmentItems.length === 0) {
    return (
      <div className="space-y-6">
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
            className="text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("noInvestments")}
          </p>
        </div>

        <InvestmentConfigForm
          boardId={boardId}
          initialConfig={investmentConfig}
          locale={locale}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel Title */}
      <h2
        className="text-lg font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {t("panelTitle")}
      </h2>

      {/* Total Invested Summary */}
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
          {t("totalInvested")}
        </p>
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {formatCurrency(totalInvested)}
        </p>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INVESTMENT_CATEGORIES.map((category) => (
          <InvestmentCategoryCard
            key={category}
            category={category}
            totalAmount={totalsPerCategory[category]}
            suggestedAmount={suggestedAmounts?.[category]}
            percentage={allocationPercentages?.[category]}
          />
        ))}
      </div>

      {/* Suggested Allocation Section */}
      {investmentConfig?.allocations?.length ? (
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-base font-bold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("suggestedAllocation")}
          </h3>
          <div className="space-y-2">
            {INVESTMENT_CATEGORIES.map((category) => {
              const suggested = suggestedAmounts?.[category] ?? 0;
              const actual = totalsPerCategory[category];
              const diff = actual - suggested;
              return (
                <div
                  key={category}
                  className="flex items-center justify-between text-sm"
                >
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {t(
                      category === "emergency"
                        ? "emergencyLabel"
                        : category === "fixed-income"
                          ? "fixedIncomeLabel"
                          : "variableIncomeLabel",
                    )}
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        diff >= 0
                          ? "var(--color-text-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {formatCurrency(actual)} / {formatCurrency(suggested)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Investment Config Form */}
      <InvestmentConfigForm
        boardId={boardId}
        initialConfig={investmentConfig}
        locale={locale}
      />

      {/* Expandable 12-Month History */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <button
          type="button"
          onClick={() => setHistoryOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-5 min-h-[44px] transition-colors duration-200"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span className="text-base font-bold">{t("last12Months")}</span>
          {historyOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </button>

        {historyOpen && (
          <div className="px-5 pb-5 space-y-2">
            {monthlyHistory.map(({ monthKey, perCategory, total }) => (
              <div
                key={monthKey}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {formatMonthLabel(monthKey, locale)}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {INVESTMENT_CATEGORIES.map((cat) =>
                    perCategory[cat] > 0 ? (
                      <span
                        key={cat}
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatCurrency(perCategory[cat])}
                      </span>
                    ) : null,
                  )}
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            ))}

            {monthlyHistory.every((m) => m.total === 0) && (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("noInvestments")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
