"use client";

import { useMemo } from "react";
import type { FinanceItem } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  items: FinanceItem[];
  currentMonth: string;
};

export default function FinanceMetricsPanel({ items, currentMonth }: Props) {
  // Ignora lançamentos sintéticos (se houver)
  const baseItems = useMemo(
    () => items.filter((i) => !i.isSynthetic),
    [items],
  );

  const hasData = baseItems.length > 0;

  // Resumo geral
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const item of baseItems) {
      if (item.type === "income") income += item.amount;
      else expense += item.amount;
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [baseItems]);

  // Despesas por categoria
  const expenseByCategory = useMemo(() => {
    const map = new Map<
      string,
      { total: number; count: number }
    >();

    for (const item of baseItems) {
      if (item.type !== "expense") continue;

      const key = item.category || "Outros";
      const prev = map.get(key) || { total: 0, count: 0 };
      prev.total += item.amount;
      prev.count += 1;
      map.set(key, prev);
    }

    const totalExpenses = totalExpense || 1; // evita divisão por zero

    const result = Array.from(map.entries()).map(([category, info]) => ({
      category,
      total: info.total,
      count: info.count,
      percent: (info.total / totalExpenses) * 100,
    }));

    // Ordena da maior despesa pra menor
    result.sort((a, b) => b.total - a.total);

    return result;
  }, [baseItems, totalExpense]);

  // Receitas por categoria (caso queira ver também)
  const incomeByCategory = useMemo(() => {
    const map = new Map<
      string,
      { total: number; count: number }
    >();

    for (const item of baseItems) {
      if (item.type !== "income") continue;

      const key = item.category || "Outros";
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
  }, [baseItems, totalIncome]);

  // Dia mais "ativo" do mês
  const mostActiveDayData = useMemo(() => {
    if (baseItems.length === 0) return null;

    const dailyMap = new Map<
      string,
      { count: number; totalAbs: number }
    >();

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
  const expenseCount = baseItems.filter((i) => i.type === "expense").length;
  const incomeCount = baseItems.filter((i) => i.type === "income").length;

  const avgExpense = expenseCount ? totalExpense / expenseCount : 0;
  const avgIncome = incomeCount ? totalIncome / incomeCount : 0;

  const currentMonthLabel = format(
    new Date(`${currentMonth}-01`),
    "MMMM yyyy",
    { locale: ptBR },
  );

  const currency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center text-sm text-gray-500">
        Nenhum lançamento neste mês para calcular métricas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Resumo de {currentMonthLabel}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Saldo do mês</p>
            <p
              className={`text-2xl font-extrabold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {currency(balance)}
            </p>
          </div>

          <div className="flex-1 flex gap-3">
            <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-[11px] text-green-700 font-semibold mb-1">
                Total de receitas
              </p>
              <p className="text-sm font-bold text-green-700">
                {currency(totalIncome)}
              </p>
              <p className="text-[11px] text-green-600 mt-1">
                {incomeCount} lançamento(s)
              </p>
            </div>

            <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[11px] text-red-700 font-semibold mb-1">
                Total de despesas
              </p>
              <p className="text-sm font-bold text-red-700">
                {currency(totalExpense)}
              </p>
              <p className="text-[11px] text-red-600 mt-1">
                {expenseCount} lançamento(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Despesas por categoria */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Distribuição de despesas por categoria
        </p>

        {expenseByCategory.length === 0 ? (
          <p className="text-xs text-gray-400">
            Nenhuma despesa registrada neste mês.
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
                    {currency(cat.total)} · {cat.percent.toFixed(1)}%
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

      {/* Receitas por categoria (opcional, mas útil) */}
      {incomeByCategory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Distribuição de receitas por categoria
          </p>

          <div className="space-y-2">
            {incomeByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">
                    {cat.category}
                  </span>
                  <span className="text-gray-500">
                    {currency(cat.total)} · {cat.percent.toFixed(1)}%
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

      {/* Dia mais ativo + outros indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dia mais ativo */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Período mais ativo
          </p>

          {mostActiveDayData?.top ? (
            <>
              <p className="text-sm font-semibold text-gray-800">
                {format(parseISO(mostActiveDayData.top.date), "dd 'de' MMM", {
                  locale: ptBR,
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {mostActiveDayData.top.count} lançamento(s) · movimentação de{" "}
                <span className="font-semibold">
                  {currency(mostActiveDayData.top.totalAbs)}
                </span>
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                Dias com movimentação no mês:{" "}
                <span className="font-semibold">
                  {mostActiveDayData.daysWithMovements}
                </span>
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400">
              Não há dados suficientes para calcular.
            </p>
          )}
        </div>

        {/* Outros indicadores */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Indicadores rápidos
          </p>

          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex justify-between">
              <span>Total de lançamentos</span>
              <span className="font-semibold">{totalTransactions}</span>
            </div>

            <div className="flex justify-between">
              <span>Ticket médio das despesas</span>
              <span className="font-semibold">
                {expenseCount ? currency(avgExpense) : "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Ticket médio das receitas</span>
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
