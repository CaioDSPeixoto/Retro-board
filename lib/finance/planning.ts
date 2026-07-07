import type { FinanceDebt, FinanceItem } from "@/types/finance";
import { getOpenAmount, getPaidAmount, roundMoney } from "@/lib/finance/calculations";

export type PlanningRiskLevel = "low" | "medium" | "high";
export type PlanningPaceStatus = "under" | "near" | "over";

export type FinanceCategoryImpact = {
  category: string;
  amount: number;
  percentage: number;
};

export type PlanningRecommendationCode =
  | "negative_balance"
  | "overdue"
  | "pace_over"
  | "top_category"
  | "debt_priority"
  | "debt_reserve"
  | "healthy";

export type FinancePlanningRecommendation = {
  code: PlanningRecommendationCode;
  priority: "info" | "warning" | "danger" | "success";
  amount?: number;
  count?: number;
  category?: string;
  percentage?: number;
  title?: string;
};

export type FinancePlanningSummary = {
  realizedBalance: number;
  realizedExpense: number;
  pendingIncome: number;
  pendingExpense: number;
  forecastBalance: number;
  dailyRecommendation: number;
  weeklyRecommendation: number;
  daysRemaining: number;
  elapsedDays: number;
  realizedDailyExpense: number;
  spendingPaceStatus: PlanningPaceStatus;
  riskLevel: PlanningRiskLevel;
  overdueCount: number;
  overdueAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
  debtOpenBalance: number;
  debtDueThisMonthAmount: number;
  debtDueThisMonthCount: number;
  debtReserveDaily: number;
  priorityDebt: FinanceDebt | null;
  largestOpenExpenses: FinanceItem[];
  topExpenseCategories: FinanceCategoryImpact[];
  recommendations: FinancePlanningRecommendation[];
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

export function getPlanningElapsedDays(monthKey: string, currentDateKey: string): number {
  const monthStart = getMonthStart(monthKey);
  const monthEnd = getMonthEnd(monthKey);
  const currentDate = parseDateKey(currentDateKey);

  if (currentDate < monthStart) return 0;
  if (currentDate > monthEnd) return getDaysBetweenInclusive(monthStart, monthEnd);
  return getDaysBetweenInclusive(monthStart, currentDate);
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

function getSpendingPaceStatus(realizedDailyExpense: number, dailyRecommendation: number): PlanningPaceStatus {
  if (dailyRecommendation <= 0) return realizedDailyExpense > 0 ? "over" : "near";
  if (realizedDailyExpense > dailyRecommendation * 1.1) return "over";
  if (realizedDailyExpense >= dailyRecommendation * 0.8) return "near";
  return "under";
}

function getTopExpenseCategories(categoryTotals: Map<string, number>, totalExpenseCommitment: number) {
  if (totalExpenseCommitment <= 0) return [];

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount: roundMoney(amount),
      percentage: roundMoney((amount / totalExpenseCommitment) * 100),
    }))
    .toSorted((left, right) => right.amount - left.amount)
    .slice(0, 3);
}

function getPlanningRecommendations(params: {
  forecastBalance: number;
  overdueCount: number;
  overdueAmount: number;
  spendingPaceStatus: PlanningPaceStatus;
  topExpenseCategories: FinanceCategoryImpact[];
  priorityDebt: FinanceDebt | null;
  debtDueThisMonthAmount: number;
  debtReserveDaily: number;
}): FinancePlanningRecommendation[] {
  const recommendations: FinancePlanningRecommendation[] = [];

  if (params.forecastBalance < 0) {
    recommendations.push({
      code: "negative_balance",
      priority: "danger",
      amount: Math.abs(params.forecastBalance),
    });
  }

  if (params.overdueCount > 0) {
    recommendations.push({
      code: "overdue",
      priority: "warning",
      amount: params.overdueAmount,
      count: params.overdueCount,
    });
  }

  if (params.spendingPaceStatus === "over") {
    recommendations.push({
      code: "pace_over",
      priority: "warning",
    });
  }

  const topCategory = params.topExpenseCategories[0];
  if (topCategory && topCategory.percentage >= 40) {
    recommendations.push({
      code: "top_category",
      priority: "info",
      amount: topCategory.amount,
      category: topCategory.category,
      percentage: topCategory.percentage,
    });
  }

  if (params.priorityDebt) {
    recommendations.push({
      code: "debt_priority",
      priority: params.priorityDebt.status === "overdue" ? "danger" : "warning",
      amount: params.priorityDebt.currentBalance,
      title: params.priorityDebt.name,
    });
  }

  if (params.debtDueThisMonthAmount > 0 && params.debtReserveDaily > 0) {
    recommendations.push({
      code: "debt_reserve",
      priority: "info",
      amount: params.debtReserveDaily,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      code: "healthy",
      priority: "success",
    });
  }

  return recommendations.slice(0, 4);
}

function getDebtInsights(debts: FinanceDebt[], monthKey: string, currentDateKey: string, daysRemaining: number) {
  const openDebts = debts.filter((debt) => debt.status !== "paid" && debt.currentBalance > 0);
  const monthDebts = openDebts.filter((debt) => debt.dueDate.slice(0, 7) === monthKey);
  const debtOpenBalance = roundMoney(
    openDebts.reduce((total, debt) => total + debt.currentBalance, 0),
  );
  const debtDueThisMonthAmount = roundMoney(
    monthDebts.reduce((total, debt) => total + debt.currentBalance, 0),
  );
  const priorityDebt = openDebts
    .toSorted((left, right) => {
      const leftOverdue = left.dueDate < currentDateKey ? 0 : 1;
      const rightOverdue = right.dueDate < currentDateKey ? 0 : 1;
      if (leftOverdue !== rightOverdue) return leftOverdue - rightOverdue;
      const dueDiff = left.dueDate.localeCompare(right.dueDate);
      if (dueDiff !== 0) return dueDiff;
      return right.currentBalance - left.currentBalance;
    })[0] ?? null;

  return {
    debtOpenBalance,
    debtDueThisMonthAmount,
    debtDueThisMonthCount: monthDebts.length,
    debtReserveDaily: daysRemaining > 0 ? roundMoney(debtDueThisMonthAmount / daysRemaining) : debtDueThisMonthAmount,
    priorityDebt,
  };
}

export function calculateFinancePlanning(
  items: FinanceItem[],
  monthKey: string,
  currentDateKey = formatDateKey(new Date()),
  debts: FinanceDebt[] = [],
): FinancePlanningSummary {
  const dueSoonLimit = addDaysKey(currentDateKey, 3);
  const daysRemaining = getPlanningDaysRemaining(monthKey, currentDateKey);
  const elapsedDays = getPlanningElapsedDays(monthKey, currentDateKey);

  let realizedIncome = 0;
  let realizedExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let dueSoonAmount = 0;
  let dueSoonCount = 0;
  const openExpenses: FinanceItem[] = [];
  const categoryTotals = new Map<string, number>();

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
      const categoryImpact = paidAmount + openAmount;
      if (categoryImpact > 0) {
        categoryTotals.set(
          item.category,
          (categoryTotals.get(item.category) ?? 0) + categoryImpact,
        );
      }
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
  const realizedDailyExpense = elapsedDays > 0
    ? roundMoney(realizedExpense / elapsedDays)
    : 0;
  const totalExpenseCommitment = realizedExpense + pendingExpense;
  const spendingPaceStatus = getSpendingPaceStatus(realizedDailyExpense, dailyRecommendation);
  const topExpenseCategories = getTopExpenseCategories(categoryTotals, totalExpenseCommitment);
  const debtInsights = getDebtInsights(debts, monthKey, currentDateKey, daysRemaining);

  return {
    realizedBalance,
    realizedExpense: roundMoney(realizedExpense),
    pendingIncome: roundMoney(pendingIncome),
    pendingExpense: roundMoney(pendingExpense),
    forecastBalance,
    dailyRecommendation,
    weeklyRecommendation,
    daysRemaining,
    elapsedDays,
    realizedDailyExpense,
    spendingPaceStatus,
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
    debtOpenBalance: debtInsights.debtOpenBalance,
    debtDueThisMonthAmount: debtInsights.debtDueThisMonthAmount,
    debtDueThisMonthCount: debtInsights.debtDueThisMonthCount,
    debtReserveDaily: debtInsights.debtReserveDaily,
    priorityDebt: debtInsights.priorityDebt,
    largestOpenExpenses: openExpenses
      .toSorted((left, right) => getOpenAmount(right) - getOpenAmount(left))
      .slice(0, 3),
    topExpenseCategories,
    recommendations: getPlanningRecommendations({
      forecastBalance,
      overdueCount,
      overdueAmount: roundMoney(overdueAmount),
      spendingPaceStatus,
      topExpenseCategories,
      priorityDebt: debtInsights.priorityDebt,
      debtDueThisMonthAmount: debtInsights.debtDueThisMonthAmount,
      debtReserveDaily: debtInsights.debtReserveDaily,
    }),
  };
}

export function calculateFinanceProjection(
  items: FinanceItem[],
  startMonth: string,
  monthsCount = 6,
  currentDateKey = formatDateKey(new Date()),
  debts: FinanceDebt[] = [],
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
      summary: calculateFinancePlanning(itemsByMonth.get(month) ?? [], month, currentDateKey, debts),
    };
  });
}
