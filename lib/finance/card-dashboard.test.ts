import { describe, expect, it } from "vitest";
import type { FinanceCard, FinanceItem } from "@/types/finance";
import { calculateCardDashboard } from "./card-dashboard";

function card(overrides: Partial<FinanceCard>): FinanceCard {
  return {
    id: "card-1",
    userId: "user-1",
    name: "Cartao",
    mode: "credit",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function item(overrides: Partial<FinanceItem>): FinanceItem {
  return {
    id: "item-1",
    userId: "user-1",
    title: "Compra",
    amount: 100,
    date: "2026-06-10",
    type: "expense",
    status: "pending",
    category: "Cartao",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("card dashboard", () => {
  it("calcula uso, limite e disponivel por cartoes com limite", () => {
    const dashboard = calculateCardDashboard(
      [
        card({ id: "card-1", name: "Nubank", limit: 1000 }),
        card({ id: "card-2", name: "Debito" }),
      ],
      [
        item({ id: "item-1", cardId: "card-1", amount: 250 }),
        item({ id: "item-2", cardId: "card-2", amount: 120 }),
      ],
      "2026-06",
    );

    expect(dashboard.cardTotals.get("card-1")).toBe(250);
    expect(dashboard.cardTotals.get("card-2")).toBe(120);
    expect(dashboard.totalLimit).toBe(1000);
    expect(dashboard.totalUsed).toBe(370);
    expect(dashboard.totalAvailable).toBe(750);
    expect(dashboard.totalUsagePercent).toBe(25);
    expect(dashboard.cardsWithLimit).toBe(1);
  });

  it("permite uso acima do limite e retorna disponivel negativo", () => {
    const dashboard = calculateCardDashboard(
      [card({ id: "card-1", name: "Nubank", limit: 500 })],
      [
        item({ id: "item-1", cardId: "card-1", amount: 400 }),
        item({ id: "item-2", cardId: "card-1", amount: 250 }),
      ],
      "2026-06",
    );

    expect(dashboard.cardTotals.get("card-1")).toBe(650);
    expect(dashboard.totalLimit).toBe(500);
    expect(dashboard.totalLimitedUsed).toBe(650);
    expect(dashboard.totalAvailable).toBe(-150);
    expect(dashboard.totalUsagePercent).toBe(130);
  });

  it("limita cartao sem ciclo ao mes atual", () => {
    const dashboard = calculateCardDashboard(
      [card({ id: "card-1", name: "Nubank" })],
      [
        item({ id: "item-1", cardId: "card-1", date: "2026-06-15", amount: 100 }),
        item({ id: "item-2", cardId: "card-1", date: "2026-05-25", amount: 300 }),
      ],
      "2026-06",
    );

    expect(dashboard.cardTotals.get("card-1")).toBe(100);
  });

  it("usa ciclo de fatura quando fechamento e vencimento existem", () => {
    const dashboard = calculateCardDashboard(
      [card({ id: "card-1", name: "Nubank", closingDay: 20, dueDay: 27 })],
      [
        item({ id: "item-1", cardId: "card-1", date: "2026-05-21", amount: 100 }),
        item({ id: "item-2", cardId: "card-1", date: "2026-06-20", amount: 200 }),
        item({ id: "item-3", cardId: "card-1", date: "2026-06-21", amount: 300 }),
      ],
      "2026-06",
    );

    expect(dashboard.cardTotals.get("card-1")).toBe(300);
  });
});
