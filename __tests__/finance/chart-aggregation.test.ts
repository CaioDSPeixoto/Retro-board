import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  FinanceItem,
  FinanceStatus,
  ChartDataPoint,
  CategoryChartDataPoint,
  ChartGroupBy,
} from "@/types/finance";

// ── Pure logic helpers (mirror the chart aggregation rules from the spec) ──

/**
 * Returns a period key for a given date string based on the groupBy parameter.
 * - "month" → "YYYY-MM"
 * - "year"  → "YYYY"
 * - "week"  → "YYYY-WNN"
 */
function getPeriodKey(dateStr: string, groupBy: ChartGroupBy): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (groupBy === "year") return `${year}`;
  if (groupBy === "month") return `${year}-${String(month).padStart(2, "0")}`;
  // week: ISO week number
  const date = new Date(year, month - 1, day);
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Filters items: excludes "moved" status, and optionally filters by boardId.
 */
function filterItems(
  items: Pick<FinanceItem, "status" | "boardId">[],
  boardId?: string,
): Pick<FinanceItem, "status" | "boardId">[] {
  return items.filter((item) => {
    if (item.status === "moved") return false;
    if (boardId !== undefined && item.boardId !== boardId) return false;
    return true;
  });
}

/**
 * Aggregates chart data points by period.
 * Property 18: For each period, income = sum of "income" items, expense = sum of "expense" items,
 * balance = income - expense.
 */
function aggregateChartData(
  items: Pick<FinanceItem, "date" | "type" | "amount" | "status" | "boardId">[],
  groupBy: ChartGroupBy,
  boardId?: string,
): ChartDataPoint[] {
  const filtered = filterItems(items, boardId) as Pick<
    FinanceItem,
    "date" | "type" | "amount" | "status" | "boardId"
  >[];

  const map = new Map<string, { income: number; expense: number }>();

  for (const item of filtered) {
    const key = getPeriodKey(item.date, groupBy);
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    const entry = map.get(key)!;
    const cents = Math.round(item.amount * 100);
    if (item.type === "income") {
      entry.income += cents;
    } else {
      entry.expense += cents;
    }
  }

  const result: ChartDataPoint[] = [];
  for (const [label, { income, expense }] of map.entries()) {
    result.push({
      label,
      income: income / 100,
      expense: expense / 100,
      balance: (income - expense) / 100,
    });
  }

  return result.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Aggregates expense items by category for a given period.
 * Property 19: Category totals must sum exactly to total expenses of the period.
 */
function aggregateExpensesByCategory(
  items: Pick<FinanceItem, "type" | "amount" | "status" | "category">[],
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const item of items) {
    if (item.status === "moved") continue;
    if (item.type !== "expense") continue;
    const cents = Math.round(item.amount * 100);
    if (!result[item.category]) result[item.category] = 0;
    result[item.category] += cents;
  }

  // Convert back to reais
  for (const key of Object.keys(result)) {
    result[key] = result[key] / 100;
  }

  return result;
}

// ── Generators ──

const typeArb = fc.constantFrom<"income" | "expense">("income", "expense");
const statusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial", "moved");
const nonMovedStatusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial");
const groupByArb = fc.constantFrom<ChartGroupBy>("week", "month", "year");
const boardIdArb = fc.option(fc.uuid(), { nil: undefined });

const categoryArb = fc.constantFrom(
  "alimentacao",
  "transporte",
  "moradia",
  "saude",
  "educacao",
  "lazer",
  "outros",
);

const amountArb = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(10000),
  noNaN: true,
});

/**
 * Generates a random date string "YYYY-MM-DD" within a year range (2024-01-01 to 2025-12-31).
 */
const dateArb = fc
  .integer({ min: 0, max: 729 }) // ~2 years of days
  .map((dayOffset) => {
    const base = new Date(2024, 0, 1);
    base.setDate(base.getDate() + dayOffset);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

/**
 * Generates a random FinanceItem-like object for chart testing.
 */
const chartItemArb = fc.record({
  date: dateArb,
  type: typeArb,
  amount: amountArb,
  status: statusArb,
  category: categoryArb,
  boardId: boardIdArb,
});

type ChartItem = {
  date: string;
  type: "income" | "expense";
  amount: number;
  status: FinanceStatus;
  category: string;
  boardId: string | undefined;
};

const chartItemsListArb = fc.array(chartItemArb, {
  minLength: 1,
  maxLength: 50,
}) as fc.Arbitrary<ChartItem[]>;

// Feature: finance-advanced-features, Property 18: Agregação de dados de gráficos por período é correta
// **Validates: Requirements 5.1, 5.2, 5.3**
describe("Property 18: Agregação de dados de gráficos por período é correta", () => {
  it("income equals sum of 'income' items, expense equals sum of 'expense' items, balance = income - expense, for each period", () => {
    fc.assert(
      fc.property(chartItemsListArb, groupByArb, (items, groupBy) => {
        const dataPoints = aggregateChartData(items, groupBy);

        // For each data point, manually verify
        for (const dp of dataPoints) {
          // Get all non-moved items in this period
          const periodItems = items.filter(
            (item) =>
              item.status !== "moved" &&
              getPeriodKey(item.date, groupBy) === dp.label,
          );

          const expectedIncomeCents = periodItems
            .filter((i) => i.type === "income")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          const expectedExpenseCents = periodItems
            .filter((i) => i.type === "expense")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          expect(Math.round(dp.income * 100)).toBe(expectedIncomeCents);
          expect(Math.round(dp.expense * 100)).toBe(expectedExpenseCents);
          expect(Math.round(dp.balance * 100)).toBe(
            expectedIncomeCents - expectedExpenseCents,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every non-moved item appears in exactly one data point period", () => {
    fc.assert(
      fc.property(chartItemsListArb, groupByArb, (items, groupBy) => {
        const dataPoints = aggregateChartData(items, groupBy);
        const nonMovedItems = items.filter((i) => i.status !== "moved");

        // Every non-moved item's period key should exist in the data points
        for (const item of nonMovedItems) {
          const key = getPeriodKey(item.date, groupBy);
          const found = dataPoints.find((dp) => dp.label === key);
          expect(found).toBeDefined();
        }

        // Total income across all data points should equal total income of non-moved items
        const totalIncomeCents = dataPoints.reduce(
          (sum, dp) => sum + Math.round(dp.income * 100),
          0,
        );
        const expectedTotalIncomeCents = nonMovedItems
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

        expect(totalIncomeCents).toBe(expectedTotalIncomeCents);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 19: Distribuição de despesas por categoria é correta
// **Validates: Requirements 5.4**
describe("Property 19: Distribuição de despesas por categoria é correta", () => {
  it("category totals sum exactly to total expenses of the period", () => {
    fc.assert(
      fc.property(chartItemsListArb, (items) => {
        const categoryTotals = aggregateExpensesByCategory(items);

        // Sum of all category totals in cents
        const categoryTotalCents = Object.values(categoryTotals).reduce(
          (sum, val) => sum + Math.round(val * 100),
          0,
        );

        // Total expenses (non-moved) in cents
        const expectedTotalCents = items
          .filter((i) => i.status !== "moved" && i.type === "expense")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

        expect(categoryTotalCents).toBe(expectedTotalCents);
      }),
      { numRuns: 100 },
    );
  });

  it("each category total equals sum of expense amounts for that category", () => {
    fc.assert(
      fc.property(chartItemsListArb, (items) => {
        const categoryTotals = aggregateExpensesByCategory(items);

        // For each category in the result, verify manually
        for (const [cat, total] of Object.entries(categoryTotals)) {
          const expectedCents = items
            .filter(
              (i) =>
                i.status !== "moved" &&
                i.type === "expense" &&
                i.category === cat,
            )
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          expect(Math.round(total * 100)).toBe(expectedCents);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("income items are never included in category expense totals", () => {
    // Generate items that are all income
    const allIncomeArb = fc.array(
      fc.record({
        date: dateArb,
        type: fc.constant<"income">("income"),
        amount: amountArb,
        status: nonMovedStatusArb,
        category: categoryArb,
        boardId: boardIdArb,
      }),
      { minLength: 1, maxLength: 20 },
    );

    fc.assert(
      fc.property(allIncomeArb, (items) => {
        const categoryTotals = aggregateExpensesByCategory(items);

        // All categories should be empty since there are no expenses
        const totalCents = Object.values(categoryTotals).reduce(
          (sum, val) => sum + Math.round(val * 100),
          0,
        );
        expect(totalCents).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 20: Dados de gráficos excluem itens "moved" e respeitam escopo de board
// **Validates: Requirements 5.8, 5.9**
describe("Property 20: Dados de gráficos excluem itens 'moved' e respeitam escopo de board", () => {
  it("moved items are completely excluded from chart calculations", () => {
    // Generate items where all are moved
    const allMovedArb = fc.array(
      fc.record({
        date: dateArb,
        type: typeArb,
        amount: amountArb,
        status: fc.constant<FinanceStatus>("moved"),
        category: categoryArb,
        boardId: boardIdArb,
      }),
      { minLength: 1, maxLength: 20 },
    );

    fc.assert(
      fc.property(allMovedArb, groupByArb, (items, groupBy) => {
        const dataPoints = aggregateChartData(items, groupBy);

        // No data points should be generated since all items are moved
        expect(dataPoints).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it("when boardId is specified, only items from that board are included", () => {
    const targetBoardId = "target-board-id";

    // Generate items with mixed boardIds
    const mixedBoardItemsArb = fc.array(
      fc.record({
        date: dateArb,
        type: typeArb,
        amount: amountArb,
        status: nonMovedStatusArb,
        category: categoryArb,
        boardId: fc.constantFrom(targetBoardId, "other-board-1", "other-board-2"),
      }),
      { minLength: 2, maxLength: 30 },
    );

    fc.assert(
      fc.property(mixedBoardItemsArb, groupByArb, (items, groupBy) => {
        const dataPoints = aggregateChartData(items, groupBy, targetBoardId);

        // Total income + expense across all data points
        const totalIncomeCents = dataPoints.reduce(
          (sum, dp) => sum + Math.round(dp.income * 100),
          0,
        );
        const totalExpenseCents = dataPoints.reduce(
          (sum, dp) => sum + Math.round(dp.expense * 100),
          0,
        );

        // Expected: only items from targetBoardId
        const targetItems = items.filter((i) => i.boardId === targetBoardId);
        const expectedIncomeCents = targetItems
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);
        const expectedExpenseCents = targetItems
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

        expect(totalIncomeCents).toBe(expectedIncomeCents);
        expect(totalExpenseCents).toBe(expectedExpenseCents);
      }),
      { numRuns: 100 },
    );
  });

  it("moved items with a matching boardId are still excluded", () => {
    const targetBoardId = "target-board-id";

    // Generate items: some moved with target board, some non-moved with target board
    const itemsArb = fc.tuple(
      // Moved items on target board
      fc.array(
        fc.record({
          date: dateArb,
          type: typeArb,
          amount: amountArb,
          status: fc.constant<FinanceStatus>("moved"),
          category: categoryArb,
          boardId: fc.constant(targetBoardId),
        }),
        { minLength: 1, maxLength: 10 },
      ),
      // Non-moved items on target board
      fc.array(
        fc.record({
          date: dateArb,
          type: typeArb,
          amount: amountArb,
          status: nonMovedStatusArb,
          category: categoryArb,
          boardId: fc.constant(targetBoardId),
        }),
        { minLength: 1, maxLength: 10 },
      ),
    );

    fc.assert(
      fc.property(itemsArb, groupByArb, ([movedItems, nonMovedItems], groupBy) => {
        const allItems = [...movedItems, ...nonMovedItems];
        const dataPoints = aggregateChartData(allItems, groupBy, targetBoardId);

        // Total should only include non-moved items
        const totalIncomeCents = dataPoints.reduce(
          (sum, dp) => sum + Math.round(dp.income * 100),
          0,
        );
        const totalExpenseCents = dataPoints.reduce(
          (sum, dp) => sum + Math.round(dp.expense * 100),
          0,
        );

        const expectedIncomeCents = nonMovedItems
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);
        const expectedExpenseCents = nonMovedItems
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

        expect(totalIncomeCents).toBe(expectedIncomeCents);
        expect(totalExpenseCents).toBe(expectedExpenseCents);
      }),
      { numRuns: 100 },
    );
  });
});
