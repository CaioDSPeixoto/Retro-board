import { describe, expect, it } from "vitest";
import type { FinanceItem } from "@/types/finance";
import { calculateFinancePlanning, calculateFinanceProjection, getPlanningDaysRemaining } from "./planning";

function item(overrides: Partial<FinanceItem>): FinanceItem {
  return {
    id: "item-1",
    userId: "user-1",
    title: "Lancamento",
    amount: 100,
    date: "2026-07-10",
    type: "expense",
    status: "pending",
    category: "Geral",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("finance planning", () => {
  it("calcula saldo previsto e recomendacao diaria", () => {
    const summary = calculateFinancePlanning(
      [
        item({ id: "income-paid", type: "income", status: "paid", amount: 3000, paidAmount: 3000 }),
        item({ id: "income-open", type: "income", status: "pending", amount: 1000, date: "2026-07-25" }),
        item({ id: "expense-paid", type: "expense", status: "paid", amount: 900, paidAmount: 900 }),
        item({ id: "expense-open", type: "expense", status: "pending", amount: 700, date: "2026-07-25" }),
      ],
      "2026-07",
      "2026-07-22",
    );

    expect(summary.realizedBalance).toBe(2100);
    expect(summary.pendingIncome).toBe(1000);
    expect(summary.pendingExpense).toBe(700);
    expect(summary.forecastBalance).toBe(2400);
    expect(summary.daysRemaining).toBe(10);
    expect(summary.dailyRecommendation).toBe(240);
    expect(summary.weeklyRecommendation).toBe(1680);
    expect(summary.riskLevel).toBe("low");
  });

  it("sinaliza risco alto quando o saldo previsto fica negativo", () => {
    const summary = calculateFinancePlanning(
      [
        item({ id: "income-paid", type: "income", status: "paid", amount: 1000, paidAmount: 1000 }),
        item({ id: "expense-open", type: "expense", status: "pending", amount: 1600 }),
      ],
      "2026-07",
      "2026-07-20",
    );

    expect(summary.forecastBalance).toBe(-600);
    expect(summary.riskLevel).toBe("high");
  });

  it("identifica vencidos e proximos vencimentos", () => {
    const summary = calculateFinancePlanning(
      [
        item({ id: "income-paid", type: "income", status: "paid", amount: 1000, paidAmount: 1000 }),
        item({ id: "overdue", type: "expense", status: "pending", amount: 300, date: "2026-07-09" }),
        item({ id: "due-soon", type: "expense", status: "pending", amount: 120, date: "2026-07-12" }),
      ],
      "2026-07",
      "2026-07-10",
    );

    expect(summary.overdueCount).toBe(1);
    expect(summary.overdueAmount).toBe(300);
    expect(summary.dueSoonCount).toBe(1);
    expect(summary.dueSoonAmount).toBe(120);
    expect(summary.riskLevel).toBe("medium");
  });

  it("calcula dias restantes para mes passado, atual e futuro", () => {
    expect(getPlanningDaysRemaining("2026-06", "2026-07-10")).toBe(0);
    expect(getPlanningDaysRemaining("2026-07", "2026-07-10")).toBe(22);
    expect(getPlanningDaysRemaining("2026-08", "2026-07-10")).toBe(31);
  });

  it("projeta meses futuros com os lancamentos existentes", () => {
    const projection = calculateFinanceProjection(
      [
        item({ id: "july-income", type: "income", amount: 2000, date: "2026-07-15" }),
        item({ id: "august-expense", type: "expense", amount: 800, date: "2026-08-10" }),
      ],
      "2026-07",
      3,
      "2026-07-01",
    );

    expect(projection.map((entry) => entry.month)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(projection[0].summary.forecastBalance).toBe(2000);
    expect(projection[1].summary.forecastBalance).toBe(-800);
    expect(projection[2].summary.forecastBalance).toBe(0);
  });
});
