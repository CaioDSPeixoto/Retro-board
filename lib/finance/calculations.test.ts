import { describe, expect, it } from "vitest";
import {
  getFinanceTotals,
  getBulkSelectionTotal,
  getForecastAmount,
  getOpenAmount,
  getPaidAmount,
  getRealizedBalance,
  isBulkActionEligible,
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

  it("nao projeta no mes atual saldo parcial movido para o proximo mes", () => {
    const partialMoved = item({
      amount: 900,
      status: "partial",
      paidAmount: 100,
      openAmount: 0,
      carriedToMonth: "2026-07",
      carriedRemainderAmount: 800,
    });

    expect(getPaidAmount(partialMoved)).toBe(100);
    expect(getOpenAmount(partialMoved)).toBe(0);
    expect(getForecastAmount(partialMoved)).toBe(0);
    expect(isBulkActionEligible(partialMoved, "pay")).toBe(false);
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

  it("calcula total selecionado usando valor em aberto e ignorando itens inacionaveis", () => {
    const selectedItems = [
      item({ id: "income-1", type: "income", status: "pending", amount: 500 }),
      item({ id: "expense-1", type: "expense", status: "partial", amount: 400, paidAmount: 150, openAmount: 250 }),
      item({ id: "moved-1", type: "expense", status: "moved", amount: 900 }),
      item({ id: "synthetic-1", type: "income", status: "pending", amount: 700, isSynthetic: true }),
    ];

    expect(
      getBulkSelectionTotal(
        selectedItems,
        new Set(["income-1", "expense-1", "moved-1", "synthetic-1"]),
      ),
    ).toBe(250);
  });

  it("define elegibilidade das acoes em massa por status", () => {
    expect(isBulkActionEligible(item({ status: "pending" }), "pay")).toBe(true);
    expect(isBulkActionEligible(item({ status: "partial" }), "pay")).toBe(true);
    expect(isBulkActionEligible(item({ status: "paid" }), "pay")).toBe(false);

    expect(isBulkActionEligible(item({ status: "pending" }), "move")).toBe(true);
    expect(isBulkActionEligible(item({ status: "partial" }), "move")).toBe(false);
    expect(isBulkActionEligible(item({ status: "paid" }), "delete")).toBe(false);
    expect(isBulkActionEligible(item({ status: "pending", isSynthetic: true }), "delete")).toBe(false);
    expect(isBulkActionEligible(item({ status: "moved" }), "pay")).toBe(false);
  });
});
