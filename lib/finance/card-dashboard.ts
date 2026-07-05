import type { FinanceCard, FinanceItem } from "@/types/finance";
import { getCardStatementCycle, isDateInCycle } from "@/lib/finance/card-cycle";
import { getMonthRange } from "@/lib/finance/utils";

export type CardDashboard = {
  cardTotals: Map<string, number>;
  totalLimit: number;
  totalUsed: number;
  totalLimitedUsed: number;
  totalAvailable: number;
  totalUsagePercent: number;
  cardsWithLimit: number;
};

function isItemInCardPeriod(item: FinanceItem, card: FinanceCard, currentMonth: string): boolean {
  const cycle = getCardStatementCycle(currentMonth, card.closingDay, card.dueDay);
  if (cycle) return isDateInCycle(item.date, cycle);

  const monthRange = getMonthRange(currentMonth);
  return item.date >= monthRange.start && item.date <= monthRange.end;
}

function matchesCard(item: FinanceItem, card: FinanceCard): boolean {
  return item.cardId === card.id || (!item.cardId && item.cardName === card.name);
}

export function calculateCardDashboard(
  cards: FinanceCard[],
  items: FinanceItem[],
  currentMonth: string,
): CardDashboard {
  const cardTotals = new Map<string, number>();

  for (const card of cards) {
    const used = items.reduce((total, item) => {
      if (item.type !== "expense" || item.status === "moved") return total;
      if (!matchesCard(item, card)) return total;
      if (!isItemInCardPeriod(item, card, currentMonth)) return total;
      return total + Number(item.amount || 0);
    }, 0);

    cardTotals.set(card.id, used);
  }

  const summary = cards.reduce(
    (current, card) => {
      const limit = Number(card.limit || 0);
      const used = cardTotals.get(card.id) ?? 0;

      return {
        totalLimit: current.totalLimit + limit,
        totalUsed: current.totalUsed + used,
        totalLimitedUsed: current.totalLimitedUsed + (limit > 0 ? used : 0),
        cardsWithLimit: current.cardsWithLimit + (limit > 0 ? 1 : 0),
      };
    },
    { totalLimit: 0, totalUsed: 0, totalLimitedUsed: 0, cardsWithLimit: 0 },
  );

  return {
    cardTotals,
    ...summary,
    totalAvailable: summary.totalLimit - summary.totalLimitedUsed,
    totalUsagePercent:
      summary.totalLimit > 0 ? (summary.totalLimitedUsed / summary.totalLimit) * 100 : 0,
  };
}
