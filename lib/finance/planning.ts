import type { FinanceItem } from "@/types/finance";
import { getOpenAmount, getPaidAmount, roundMoney } from "@/lib/finance/calculations";

export type PlanningRiskLevel = "low" | "medium" | "high";

export type FinancePlanningSummary = {
  realizedBalance: number;
  pendingIncome: number;
  pendingExpense: number;
  forecastBalance: number;
  dailyRecommendation: number;
  weeklyRecommendation: number;
  daysRemaining: number;
  riskLevel: PlanningRiskLevel;
  overdueCount: number;
  overdueAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
  largestOpenExpenses: FinanceItem[];
};

export type FinanceMonthlyProjection = {
  month: string;
  summary: FinancePlanningSummary;
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthEnd(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0);
}

function getMonthStart(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function addMonthsKey(monthKey: string, monthsToAdd: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysBetweenInclusive(start: Date, end: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(Math.floor((endUtc - startUtc) / dayMs) + 1, 0);
}

export function getPlanningDaysRemaining(monthKey: string, currentDateKey: string): number {
  const monthStart = getMonthStart(monthKey);
  const monthEnd = getMonthEnd(monthKey);
  const currentDate = parseDateKey(currentDateKey);

  if (currentDate < monthStart) return getDaysBetweenInclusive(monthStart, monthEnd);
  if (currentDate > monthEnd) return 0;
  return getDaysBetweenInclusive(currentDate, monthEnd);
}

function addDaysKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function getRiskLevel(params: {
  forecastBalance: number;
  overdueAmount: number;
  dailyRecommendation: number;
  pendingExpense: number;
}): PlanningRiskLevel {
  if (params.forecastBalance < 0) return "high";
  if (params.overdueAmount > 0) return "medium";
  if (params.pendingExpense > 0 && params.dailyRecommendation < 30) return "medium";
  return "low";
}

export function calculateFinancePlanning(
  items: FinanceItem[],
  monthKey: string,
  currentDateKey = formatDateKey(new Date()),
): FinancePlanningSummary {
  const dueSoonLimit = addDaysKey(currentDateKey, 3);
  const daysRemaining = getPlanningDaysRemaining(monthKey, currentDateKey);

  let realizedIncome = 0;
  let realizedExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let dueSoonAmount = 0;
  let dueSoonCount = 0;
  const openExpenses: FinanceItem[] = [];

  for (const item of items) {
    if (item.isSynthetic || item.status === "moved") continue;

    const paidAmount = getPaidAmount(item);
    const openAmount = getOpenAmount(item);

    if (item.type === "income") {
      realizedIncome += paidAmount;
      pendingIncome += openAmount;
    } else {
      realizedExpense += paidAmount;
      pendingExpense += openAmount;
      if (openAmount > 0) openExpenses.push(item);
    }

    if (openAmount <= 0) continue;

    if (item.date < currentDateKey) {
      overdueCount += 1;
      overdueAmount += openAmount;
    } else if (item.date >= currentDateKey && item.date <= dueSoonLimit) {
      dueSoonCount += 1;
      dueSoonAmount += openAmount;
    }
  }

  const realizedBalance = roundMoney(realizedIncome - realizedExpense);
  const forecastBalance = roundMoney(realizedBalance + pendingIncome - pendingExpense);
  const dailyRecommendation = daysRemaining > 0
    ? roundMoney(forecastBalance / daysRemaining)
    : forecastBalance;
  const weeklyRecommendation = roundMoney(dailyRecommendation * 7);

  return {
    realizedBalance,
    pendingIncome: roundMoney(pendingIncome),
    pendingExpense: roundMoney(pendingExpense),
    forecastBalance,
    dailyRecommendation,
    weeklyRecommendation,
    daysRemaining,
    riskLevel: getRiskLevel({
      forecastBalance,
      overdueAmount,
      dailyRecommendation,
      pendingExpense,
    }),
    overdueCount,
    overdueAmount: roundMoney(overdueAmount),
    dueSoonCount,
    dueSoonAmount: roundMoney(dueSoonAmount),
    largestOpenExpenses: openExpenses
      .toSorted((left, right) => getOpenAmount(right) - getOpenAmount(left))
      .slice(0, 3),
  };
}

export function calculateFinanceProjection(
  items: FinanceItem[],
  startMonth: string,
  monthsCount = 6,
  currentDateKey = formatDateKey(new Date()),
): FinanceMonthlyProjection[] {
  const itemsByMonth = items.reduce((acc, item) => {
    const monthKey = item.date.slice(0, 7);
    const monthItems = acc.get(monthKey) ?? [];
    monthItems.push(item);
    acc.set(monthKey, monthItems);
    return acc;
  }, new Map<string, FinanceItem[]>());

  return Array.from({ length: monthsCount }, (_, index) => {
    const month = addMonthsKey(startMonth, index);
    return {
      month,
      summary: calculateFinancePlanning(itemsByMonth.get(month) ?? [], month, currentDateKey),
    };
  });
}
