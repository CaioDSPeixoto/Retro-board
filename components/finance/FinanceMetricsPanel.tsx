"use client";

import { useMemo } from "react";
import type { FinanceItem } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";

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

  const metrics = useMemo(() => {
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

    for (const item of baseItems) {
      const isPaid = item.status === "paid";
      const isOverdue = !isPaid && item.date < todayStr;

      if (item.type === "income") {
        totalIncome += item.amount;
        incomeCount++;
        if (isPaid) finishedIncomeTotal += item.amount;
        else pendingIncomeTotal += item.amount;
        if (isOverdue) overdueIncomeCount++;
      } else {
        totalExpense += item.amount;
        expenseCount++;
        if (isPaid) finishedExpenseTotal += item.amount;
        else pendingExpenseTotal += item.amount;
        if (isOverdue) overdueExpenseCount++;
      }
    }

    const balance = totalIncome - totalExpense;
    const overdueCount = overdueIncomeCount + overdueExpenseCount;

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
      overdueCount,
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
    overdueCount,
  } = metrics;

  const othersLabel = t("othersCategory");

  // Despesas por categoria
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    for (const item of baseItems) {
      if (item.type !== "expense") continue;

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

  // Receitas por categoria
  const incomeByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    for (const item of baseItems) {
      if (item.type !== "income") continue;

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

  const totalTransactions = baseItems.length;
  const avgExpense = expenseCount ? totalExpense / expenseCount : 0;
  const avgIncome = incomeCount ? totalIncome / incomeCount : 0;

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
      <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center text-sm text-gray-500">
        {t("noData")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {t("summaryTitle", { period: periodLabel })}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">
              {t("balanceLabel")}
            </p>
            <p
              className={`text-2xl font-extrabold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {currency(balance)}
            </p>
          </div>

          <div className="flex-1 flex gap-3">
            {/* Receitas */}
            <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-[11px] text-green-700 font-semibold mb-1">
                {t("incomesTitle")}
              </p>
              <p className="text-[11px] text-gray-500">
                {t("totalPaidAndPending")}
              </p>
              <p className="text-sm font-bold text-green-700 mt-1">
                {currency(totalIncome)}
              </p>
              <p className="text-[11px] text-green-700 mt-1">
                {t("onlyFinished")}{" "}
                <span className="font-semibold">
                  {currency(finishedIncomeTotal)}
                </span>
              </p>
              <p className="text-[11px] text-green-700">
                {t("onlyPending")}{" "}
                <span className="font-semibold">
                  {currency(pendingIncomeTotal)}
                </span>
              </p>
              <p className="text-[11px] text-green-700 mt-1">
                {t("incomesCountLabel", { count: incomeCount })}
                {overdueIncomeCount > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold">
                      {t("incomesOverdueLabel", {
                        count: overdueIncomeCount,
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Despesas */}
            <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[11px] text-red-700 font-semibold mb-1">
                {t("expensesTitle")}
              </p>
              <p className="text-[11px] text-gray-500">
                {t("totalPaidAndPending")}
              </p>
              <p className="text-sm font-bold text-red-700 mt-1">
                {currency(totalExpense)}
              </p>
              <p className="text-[11px] text-red-700 mt-1">
                {t("onlyFinished")}{" "}
                <span className="font-semibold">
                  {currency(finishedExpenseTotal)}
                </span>
              </p>
              <p className="text-[11px] text-red-700">
                {t("onlyPending")}{" "}
                <span className="font-semibold">
                  {currency(pendingExpenseTotal)}
                </span>
              </p>
              <p className="text-[11px] text-red-700 mt-1">
                {t("expensesCountLabel", { count: expenseCount })}
                {overdueExpenseCount > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold">
                      {t("expensesOverdueLabel", {
                        count: overdueExpenseCount,
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Despesas por categoria */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("expensesDistributionTitle")}
        </p>

        {expenseByCategory.length === 0 ? (
          <p className="text-xs text-gray-400">
            {t("noExpensesInPeriod")}
          </p>
        ) : (
          <div className="space-y-2">
            {expenseByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">
                    {cat.category}
                  </span>
                  <span className="text-gray-500">
                    {t("categoryLine", {
                      total: currency(cat.total),
                      percent: cat.percent.toFixed(1),
                    })}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-red-400"
                    style={{
                      width: `${Math.max(cat.percent, 4)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receitas por categoria */}
      {incomeByCategory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t("incomesDistributionTitle")}
          </p>

          <div className="space-y-2">
            {incomeByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">
                    {cat.category}
                  </span>
                  <span className="text-gray-500">
                    {t("categoryLine", {
                      total: currency(cat.total),
                      percent: cat.percent.toFixed(1),
                    })}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-green-400"
                    style={{
                      width: `${Math.max(cat.percent, 4)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dia mais ativo + indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dia mais ativo */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("mostActivePeriodTitle")}
          </p>

          {mostActiveDayData?.top ? (
            <>
              <p className="text-sm font-semibold text-gray-800">
                {format(parseISO(mostActiveDayData.top.date), "dd 'de' MMM", {
                  locale: ptBR,
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("mostActiveDayLine", {
                  count: mostActiveDayData.top.count,
                  amount: currency(mostActiveDayData.top.totalAbs),
                })}
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                {t("daysWithMovements", {
                  count: mostActiveDayData.daysWithMovements,
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400">
              {t("notEnoughData")}
            </p>
          )}
        </div>

        {/* Indicadores rápidos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("quickIndicatorsTitle")}
          </p>

          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex justify-between">
              <span>{t("totalTransactionsLabel")}</span>
              <span className="font-semibold">{totalTransactions}</span>
            </div>

            <div className="flex justify-between">
              <span>{t("avgExpenseTicketLabel")}</span>
              <span className="font-semibold">
                {expenseCount ? currency(avgExpense) : "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>{t("avgIncomeTicketLabel")}</span>
              <span className="font-semibold">
                {incomeCount ? currency(avgIncome) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
