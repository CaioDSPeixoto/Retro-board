import { describe, expect, it } from "vitest";
import {
  getFinanceTotals,
  getOpenAmount,
  getPaidAmount,
  getRealizedBalance,
} from "./calculations";
import type { FinanceItem } from "../../types/finance";

function item(overrides: Partial<FinanceItem>): FinanceItem {
  return {
    id: "item-1",
    userId: "user-1",
    title: "Teste",
    amount: 100,
    date: "2026-06-10",
    type: "expense",
    status: "pending",
    category: "Geral",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("finance calculations", () => {
  it("calcula valores pagos e em aberto para lançamento parcial", () => {
    const partial = item({
      amount: 300,
      status: "partial",
      paidAmount: 125,
      openAmount: 175,
    });

    expect(getPaidAmount(partial)).toBe(125);
    expect(getOpenAmount(partial)).toBe(175);
  });

  it("ignora lançamentos movidos e sintéticos nos totais", () => {
    const totals = getFinanceTotals([
      item({ type: "income", status: "paid", amount: 500, paidAmount: 500 }),
      item({ type: "expense", status: "paid", amount: 120, paidAmount: 120 }),
      item({ type: "expense", status: "moved", amount: 80 }),
      item({ type: "income", status: "paid", amount: 999, paidAmount: 999, isSynthetic: true }),
    ]);

    expect(totals.incomes).toBe(500);
    expect(totals.expenses).toBe(120);
    expect(totals.balance).toBe(380);
  });

  it("calcula saldo realizado somente com valores pagos", () => {
    const balance = getRealizedBalance([
      item({ type: "income", status: "paid", amount: 1000, paidAmount: 1000 }),
      item({ type: "expense", status: "partial", amount: 400, paidAmount: 150 }),
      item({ type: "expense", status: "pending", amount: 700 }),
    ]);

    expect(balance).toBe(850);
  });
});
