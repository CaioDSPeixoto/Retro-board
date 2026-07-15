"use client";

import { useMemo } from "react";
import type { FinanceItem } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { getFinanceTotals, getForecastAmount, getPaidAmount } from "@/lib/finance/calculations";
import PrivacyValue from "@/components/finance/PrivacyValue";

type Props = {
  items: FinanceItem[];
  currentMonth: string;
  rangeFrom?: string | null;
  rangeTo?: string | null;
};

export default function FinanceMetricsPanel({
  items,
  currentMonth,
  rangeFrom,
  rangeTo,
}: Props) {
  const t = useTranslations("FinanceMetrics");

  const baseItems = useMemo(
    () => items.filter((i) => !i.isSynthetic),
    [items],
  );

  const hasData = baseItems.length > 0;
  const todayStr = new Date().toISOString().split("T")[0];

  const othersLabel = t("othersCategory");
  const unknownUserLabel = t("unknownUserLabel");

  const metrics = useMemo(() => {
    const totals = getFinanceTotals(baseItems);
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    let finishedIncomeTotal = 0;
    let pendingIncomeTotal = 0;
    let finishedExpenseTotal = 0;
    let pendingExpenseTotal = 0;

    let overdueIncomeCount = 0;
    let overdueExpenseCount = 0;

    let movedIncomeTotal = 0;
    let movedExpenseTotal = 0;

    for (const item of baseItems) {
      const isPaid = item.status === "paid";
      const isMoved = item.status === "moved";
      const isOverdue = !isPaid && !isMoved && item.date < todayStr;

      if (isMoved) {
        if (item.type === "income") {
          movedIncomeTotal += item.amount;
        } else {
          movedExpenseTotal += item.amount;
        }
        continue;
      }

      const paidAmount = getPaidAmount(item);
      const forecastAmount = getForecastAmount(item);
      const totalAmount = paidAmount + forecastAmount;

      if (item.type === "income") {
        totalIncome += totalAmount;
        incomeCount++;
        finishedIncomeTotal += paidAmount;
        pendingIncomeTotal += forecastAmount;
        if (isOverdue) overdueIncomeCount++;
      } else {
        totalExpense += totalAmount;
        expenseCount++;
        finishedExpenseTotal += paidAmount;
        pendingExpenseTotal += forecastAmount;
        if (isOverdue) overdueExpenseCount++;
      }
    }

    const balance = totals.balance;

    return {
      totalIncome,
      totalExpense,
      balance,
      incomeCount,
      expenseCount,
      finishedIncomeTotal,
      pendingIncomeTotal,
      finishedExpenseTotal,
      pendingExpenseTotal,
      overdueIncomeCount,
      overdueExpenseCount,
      movedIncomeTotal,
      movedExpenseTotal,
    };
  }, [baseItems, todayStr]);

  const {
    totalIncome,
    totalExpense,
    balance,
    incomeCount,
    expenseCount,
    finishedIncomeTotal,
    pendingIncomeTotal,
    finishedExpenseTotal,
    pendingExpenseTotal,
    overdueIncomeCount,
    overdueExpenseCount,
    movedIncomeTotal,
    movedExpenseTotal,
  } = metrics;

  // Despesas por categoria (global)
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    for (const item of baseItems) {
      if (item.type !== "expense") continue;
      if (item.status === "moved") continue;

      const key = item.category || othersLabel;
      const prev = map.get(key) || { total: 0, count: 0 };
      prev.total += item.amount;
      prev.count += 1;
      map.set(key, prev);
    }

    const totalExpenses = totalExpense || 1;

    const result = Array.from(map.entries()).map(([category, info]) => ({
      category,
      total: info.total,
      count: info.count,
      percent: (info.total / totalExpenses) * 100,
    }));

    result.sort((a, b) => b.total - a.total);

    return result;
  }, [baseItems, totalExpense, othersLabel]);

  // Receitas por categoria (global)
  const incomeByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    for (const item of baseItems) {
      if (item.type !== "income") continue;
      if (item.status === "moved") continue;

      const key = item.category || othersLabel;
      const prev = map.get(key) || { total: 0, count: 0 };
      prev.total += item.amount;
      prev.count += 1;
      map.set(key, prev);
    }

    const totalIncomes = totalIncome || 1;

    const result = Array.from(map.entries()).map(([category, info]) => ({
      category,
      total: info.total,
      count: info.count,
      percent: (info.total / totalIncomes) * 100,
    }));

    result.sort((a, b) => b.total - a.total);

    return result;
  }, [baseItems, totalIncome, othersLabel]);

  // Dia mais ativo
  const mostActiveDayData = useMemo(() => {
    if (baseItems.length === 0) return null;

    const dailyMap = new Map<string, { count: number; totalAbs: number }>();

    for (const item of baseItems) {
      if (item.status === "moved") continue;
      const date = item.date;
      const prev = dailyMap.get(date) || { count: 0, totalAbs: 0 };
      prev.count += 1;
      prev.totalAbs += Math.abs(item.amount);
      dailyMap.set(date, prev);
    }

    const days = Array.from(dailyMap.entries()).map(([date, info]) => ({
      date,
      count: info.count,
      totalAbs: info.totalAbs,
    }));

    days.sort((a, b) => {
      if (b.totalAbs !== a.totalAbs) return b.totalAbs - a.totalAbs;
      return b.count - a.count;
    });

    const top = days[0];
    const daysWithMovements = days.length;

    return { top, daysWithMovements };
  }, [baseItems]);

  // Tickets médios
  const avgExpense = expenseCount ? totalExpense / expenseCount : 0;
  const avgIncome = incomeCount ? totalIncome / incomeCount : 0;

  // Métricas por usuário (quadro compartilhado)
  const userStats = useMemo(() => {
    if (baseItems.length === 0) return [];

    type UserAgg = {
      userId: string;
      name: string;
      totalExpense: number;
      totalIncome: number;
      expensesCount: number;
      incomesCount: number;
      expenseCategories: Map<string, { total: number; count: number }>;
    };

    const map = new Map<string, UserAgg>();

    for (const item of baseItems) {
      if (item.status === "moved") continue;

      const userId = item.createdBy || "__unknown__";
      const name = item.createdByName || unknownUserLabel;

      let agg = map.get(userId);
      if (!agg) {
        agg = {
          userId,
          name,
          totalExpense: 0,
          totalIncome: 0,
          expensesCount: 0,
          incomesCount: 0,
          expenseCategories: new Map(),
        };
        map.set(userId, agg);
      }

      if (item.type === "expense") {
        agg.totalExpense += item.amount;
        agg.expensesCount++;
        const catKey = item.category || othersLabel;
        const prev = agg.expenseCategories.get(catKey) || {
          total: 0,
          count: 0,
        };
        prev.total += item.amount;
        prev.count += 1;
        agg.expenseCategories.set(catKey, prev);
      } else {
        agg.totalIncome += item.amount;
        agg.incomesCount++;
      }
    }

    const result = Array.from(map.values()).map((u) => {
      const total = u.totalExpense || 1;
      const categories = Array.from(u.expenseCategories.entries())
        .map(([category, info]) => ({
          category,
          total: info.total,
          count: info.count,
          percent: (info.total / total) * 100,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        userId: u.userId,
        name: u.name,
        totalExpense: u.totalExpense,
        totalIncome: u.totalIncome,
        expensesCount: u.expensesCount,
        incomesCount: u.incomesCount,
        categories,
      };
    });

    // quem gastou mais primeiro
    result.sort((a, b) => b.totalExpense - a.totalExpense);
    return result;
  }, [baseItems, othersLabel, unknownUserLabel]);

  let periodLabel: string;
  if (rangeFrom && rangeTo) {
    const fromLabel = format(new Date(`${rangeFrom}-01`), "MMM yyyy", {
      locale: ptBR,
    });
    const toLabel = format(new Date(`${rangeTo}-01`), "MMM yyyy", {
      locale: ptBR,
    });
    periodLabel = `${fromLabel} — ${toLabel}`;
  } else {
    periodLabel = format(new Date(`${currentMonth}-01`), "MMMM yyyy", {
      locale: ptBR,
    });
  }

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (!hasData) {
    return (
      <div
        className="rounded-2xl border p-4 text-center text-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      >
        {t("noData")}
      </div>
    );
  }

  const incomesLaunchesLabel = t("incomesLaunchesLabel", { count: incomeCount });
  const expensesLaunchesLabel = t("expensesLaunchesLabel", { count: expenseCount });

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>
          {t("summaryTitle", { period: periodLabel })}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{t("balanceLabel")}</p>
            <p className={`text-2xl font-extrabold ${balance >= 0 ? "finance-success-text" : "finance-danger-text"}`}>
              <PrivacyValue>{currency(balance)}</PrivacyValue>
            </p>
          </div>

          <div className="flex-1 flex gap-3">
            <div className="flex-1 finance-success-soft border rounded-xl p-3">
              <p className="text-[11px] font-semibold mb-1">
                {t("incomesTitle")} – {incomesLaunchesLabel}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p><span className="font-medium">{t("totalPaidAndPending")} </span><PrivacyValue><span className="font-semibold">{currency(totalIncome)}</span></PrivacyValue></p>
                <p><span className="font-medium">{t("avgTicketLabel")} </span><PrivacyValue><span className="font-semibold">{incomeCount ? currency(avgIncome) : "—"}</span></PrivacyValue></p>
                <p className="mt-1">{t("onlyFinished")} <PrivacyValue><span className="font-semibold">{currency(finishedIncomeTotal)}</span></PrivacyValue></p>
                <p>{t("onlyPending")} <PrivacyValue><span className="font-semibold">{currency(pendingIncomeTotal)}</span></PrivacyValue></p>
                {overdueIncomeCount > 0 && (
                  <p className="mt-1"><span className="font-medium">{t("incomesOverdueLabel", { count: overdueIncomeCount })}</span></p>
                )}
              </div>
            </div>

            <div className="flex-1 finance-danger-soft border rounded-xl p-3">
              <p className="text-[11px] font-semibold mb-1">
                {t("expensesTitle")} – {expensesLaunchesLabel}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p><span className="font-medium">{t("totalPaidAndPending")} </span><PrivacyValue><span className="font-semibold">{currency(totalExpense)}</span></PrivacyValue></p>
                <p><span className="font-medium">{t("avgTicketLabel")} </span><PrivacyValue><span className="font-semibold">{expenseCount ? currency(avgExpense) : "—"}</span></PrivacyValue></p>
                <p className="mt-1">{t("onlyFinished")} <PrivacyValue><span className="font-semibold">{currency(finishedExpenseTotal)}</span></PrivacyValue></p>
                <p>{t("onlyPending")} <PrivacyValue><span className="font-semibold">{currency(pendingExpenseTotal)}</span></PrivacyValue></p>
                {overdueExpenseCount > 0 && (
                  <p className="mt-1"><span className="font-medium">{t("expensesOverdueLabel", { count: overdueExpenseCount })}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {(movedIncomeTotal > 0 || movedExpenseTotal > 0) && (
          <div
            className="mt-4 rounded-2xl border p-3 text-[11px]"
            style={{ background: "var(--color-accent-subtle)", borderColor: "var(--color-border)" }}
          >
            <p className="text-[10px] font-semibold mb-2" style={{ color: "var(--color-accent-text)" }}>
              {t("movedTotalsTitle")}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <PrivacyValue as="div" className="font-medium" >
                <span style={{ color: "var(--color-accent-text)" }}>
                  {t("movedExpensesLine", { value: currency(movedExpenseTotal) })}
                </span>
              </PrivacyValue>
              {movedIncomeTotal > 0 && (
                <PrivacyValue as="div" className="font-medium">
                  <span style={{ color: "var(--color-accent-text)" }}>
                    {t("movedIncomesLine", { value: currency(movedIncomeTotal) })}
                  </span>
                </PrivacyValue>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Despesas por categoria */}
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
          {t("expensesDistributionTitle")}
        </p>
        {expenseByCategory.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("noExpensesInPeriod")}</p>
        ) : (
          <div className="space-y-2">
            {expenseByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{cat.category}</span>
                  <PrivacyValue>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {t("categoryLine", { total: currency(cat.total), percent: cat.percent.toFixed(1) })}
                    </span>
                  </PrivacyValue>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-2 rounded-full bg-[var(--color-danger-strong)]" style={{ width: `${Math.max(cat.percent, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receitas por categoria */}
      {incomeByCategory.length > 0 && (
        <div
          className="rounded-2xl border p-4 shadow-sm"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
            {t("incomesDistributionTitle")}
          </p>
          <div className="space-y-2">
            {incomeByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{cat.category}</span>
                  <PrivacyValue>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {t("categoryLine", { total: currency(cat.total), percent: cat.percent.toFixed(1) })}
                    </span>
                  </PrivacyValue>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-2 rounded-full bg-[var(--color-success-strong)]" style={{ width: `${Math.max(cat.percent, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dia mais ativo */}
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
          {t("mostActivePeriodTitle")}
        </p>
        {mostActiveDayData?.top ? (
          <>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {format(parseISO(mostActiveDayData.top.date), t("mostActiveDateFormat"), { locale: ptBR })}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              <PrivacyValue>{t("mostActiveDayLine", { count: mostActiveDayData.top.count, amount: currency(mostActiveDayData.top.totalAbs) })}</PrivacyValue>
            </p>
            <p className="text-[11px] mt-2" style={{ color: "var(--color-text-muted)" }}>
              {t("daysWithMovements", { count: mostActiveDayData.daysWithMovements })}
            </p>
          </>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("notEnoughData")}</p>
        )}
      </div>

      {/* Métricas por usuário */}
      {userStats.length > 1 && (
        <div
          className="rounded-2xl border p-4 shadow-sm"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>
            {t("perUserTitle")}
          </p>
          <p className="text-[11px] mb-2" style={{ color: "var(--color-text-muted)" }}>{t("perUserSubtitle")}</p>
          <p className="text-[11px] finance-info-text font-semibold mb-3">{t("topSpenderBadge")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            {userStats.map((user, index) => (
              <div
                key={user.userId || index}
                className="rounded-xl border p-3 flex flex-col gap-2 shadow-sm"
                style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full finance-info-soft border whitespace-nowrap">
                        {t("rankFormat", { index: index + 1, name: user.name })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="finance-danger-soft border rounded-lg px-2 py-1.5">
                    <p className="text-[10px] font-semibold mb-0.5">{t("userTotalExpenseLabel")}</p>
                    <PrivacyValue><p className="font-bold text-xs">{currency(user.totalExpense)}</p></PrivacyValue>
                  </div>
                  <div className="finance-success-soft border rounded-lg px-2 py-1.5">
                    <p className="text-[10px] font-semibold mb-0.5">{t("userTotalIncomeShort")}</p>
                    <PrivacyValue><p className="font-bold text-xs">{currency(user.totalIncome)}</p></PrivacyValue>
                  </div>
                </div>

                {user.categories.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      {t("userTopCategoriesTitle")}
                    </p>
                    <div className="space-y-2">
                      {user.categories.slice(0, 3).map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{cat.category}</span>
                            <PrivacyValue>
                              <span style={{ color: "var(--color-text-muted)" }}>
                                {t("categoryLine", { total: currency(cat.total), percent: cat.percent.toFixed(1) })}
                              </span>
                            </PrivacyValue>
                          </div>
                          <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "var(--color-border)" }}>
                            <div className="h-2 rounded-full bg-[var(--color-danger-strong)]" style={{ width: `${Math.max(cat.percent, 4)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
