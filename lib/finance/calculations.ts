import type { FinanceItem } from "@/types/finance";

export type FinanceTotals = {
  incomes: number;
  expenses: number;
  incomesForecast: number;
  expensesForecast: number;
  balance: number;
};

export function getPaidAmount(item: FinanceItem): number {
  if (item.status === "paid") return Number(item.paidAmount ?? item.amount ?? 0);
  if (item.status === "partial") return Number(item.paidAmount ?? 0);
  return 0;
}

export function getOpenAmount(item: FinanceItem): number {
  if (item.status === "paid" || item.status === "moved") return 0;
  return Math.max(Number(item.openAmount ?? item.amount - (item.paidAmount || 0)), 0);
}

export function getForecastAmount(item: FinanceItem): number {
  if (item.status === "pending") return Number(item.amount || 0);
  if (item.status === "partial") return getOpenAmount(item);
  return 0;
}

export function getSignedAmount(item: FinanceItem, amount: number): number {
  return item.type === "income" ? amount : -amount;
}

export function getRealizedBalance(items: FinanceItem[]): number {
  return roundMoney(
    items.reduce((total, item) => {
      if (item.isSynthetic || item.status === "moved") return total;
      return total + getSignedAmount(item, getPaidAmount(item));
    }, 0),
  );
}

export function getFinanceTotals(items: FinanceItem[]): FinanceTotals {
  const totals = items.reduce(
    (acc, item) => {
      if (item.isSynthetic || item.status === "moved") return acc;

      const paidAmount = getPaidAmount(item);
      const forecastAmount = getForecastAmount(item);

      if (item.type === "income") {
        acc.incomes += paidAmount;
        acc.incomesForecast += forecastAmount;
      } else {
        acc.expenses += paidAmount;
        acc.expensesForecast += forecastAmount;
      }

      return acc;
    },
    {
      incomes: 0,
      expenses: 0,
      incomesForecast: 0,
      expensesForecast: 0,
      balance: 0,
    },
  );

  totals.incomes = roundMoney(totals.incomes);
  totals.expenses = roundMoney(totals.expenses);
  totals.incomesForecast = roundMoney(totals.incomesForecast);
  totals.expensesForecast = roundMoney(totals.expensesForecast);
  totals.balance = roundMoney(totals.incomes - totals.expenses);

  return totals;
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
