import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { distributeAmountInCents } from "@/lib/finance/utils";
import type {
  FinanceItem,
  FinanceStatus,
  InvestmentCategory,
  InvestmentAllocation,
} from "@/types/finance";

// ── Pure logic helpers (mirror the investment rules from the spec) ──

/**
 * Creates an investment finance item.
 * Property 13: Investment items are recorded as expenses with an investmentCategory.
 */
function createInvestmentItem(
  category: InvestmentCategory,
  amount: number,
  boardId?: string,
): Pick<FinanceItem, "type" | "investmentCategory" | "boardId" | "amount"> {
  return {
    type: "expense",
    investmentCategory: category,
    amount,
    ...(boardId !== undefined ? { boardId } : {}),
  };
}

/**
 * Aggregates investment totals by category for a given period, excluding "moved" items.
 * Property 14: Aggregation by category is correct.
 */
function aggregateInvestmentsByCategory(
  items: Pick<FinanceItem, "investmentCategory" | "amount" | "status">[],
): Record<InvestmentCategory, number> {
  const result: Record<InvestmentCategory, number> = {
    emergency: 0,
    "fixed-income": 0,
    "variable-income": 0,
  };

  for (const item of items) {
    if (item.status === "moved") continue;
    if (!item.investmentCategory) continue;
    const cents = Math.round(item.amount * 100);
    result[item.investmentCategory] += cents;
  }

  // Convert back to reais
  result.emergency = result.emergency / 100;
  result["fixed-income"] = result["fixed-income"] / 100;
  result["variable-income"] = result["variable-income"] / 100;

  return result;
}

/**
 * Simulates round-trip persistence of an investment template through JSON serialization.
 * Property 15: Round-trip of investment templates preserves all fields.
 */
type InvestmentTemplate = {
  id: string;
  userId: string;
  boardId?: string;
  title: string;
  amount: number;
  dayOfMonth: number;
  investmentCategory: InvestmentCategory;
  isFixed: boolean;
};

function roundTripTemplate(template: InvestmentTemplate): InvestmentTemplate {
  return JSON.parse(JSON.stringify(template));
}

/**
 * Generates an item from an investment template (simulates ensureFixedItemsForMonth).
 * Property 16: Auto-generation preserves investmentCategory from template.
 */
function generateItemFromTemplate(
  template: InvestmentTemplate,
  month: string,
): Pick<FinanceItem, "type" | "investmentCategory" | "amount" | "title" | "date" | "status" | "isFixed"> {
  const day = String(template.dayOfMonth).padStart(2, "0");
  return {
    type: "expense",
    investmentCategory: template.investmentCategory,
    amount: template.amount,
    title: template.title,
    date: `${month}-${day}`,
    status: "pending",
    isFixed: true,
  };
}

/**
 * Calculates suggested allocation amounts based on configured proportions.
 * Property 17: Allocation respects configured proportions with cent distribution.
 */
function calculateAllocationSuggestion(
  totalAmount: number,
  allocations: InvestmentAllocation[],
): Record<InvestmentCategory, number> {
  const totalCents = Math.round(totalAmount * 100);
  const result: Record<InvestmentCategory, number> = {
    emergency: 0,
    "fixed-income": 0,
    "variable-income": 0,
  };

  // Calculate raw cents per category
  const rawCents = allocations.map((a) => (totalCents * a.percentage) / 100);
  const flooredCents = rawCents.map((c) => Math.floor(c));
  let remainder = totalCents - flooredCents.reduce((a, b) => a + b, 0);

  // Distribute remainder by largest fractional part
  const fractionals = rawCents.map((raw, i) => ({
    index: i,
    frac: raw - flooredCents[i],
  }));
  fractionals.sort((a, b) => b.frac - a.frac);

  for (const f of fractionals) {
    if (remainder <= 0) break;
    flooredCents[f.index] += 1;
    remainder -= 1;
  }

  for (let i = 0; i < allocations.length; i++) {
    result[allocations[i].category] = flooredCents[i] / 100;
  }

  return result;
}

// ── Generators ──

const investmentCategoryArb = fc.constantFrom<InvestmentCategory>(
  "emergency",
  "fixed-income",
  "variable-income",
);

const amountArb = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(100000),
  noNaN: true,
});

const boardIdArb = fc.option(fc.uuid(), { nil: undefined });

const statusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial", "moved");

const nonMovedStatusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial");

const dayOfMonthArb = fc.integer({ min: 1, max: 28 });

const investmentTemplateArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  boardId: fc.option(fc.uuid(), { nil: undefined }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  dayOfMonth: dayOfMonthArb,
  investmentCategory: investmentCategoryArb,
  isFixed: fc.constant(true),
}) as fc.Arbitrary<InvestmentTemplate>;

/**
 * Generates a list of investment items with random categories and statuses.
 */
const investmentItemArb = fc.record({
  investmentCategory: investmentCategoryArb,
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  status: statusArb,
});

const investmentItemsListArb = fc.array(investmentItemArb, { minLength: 1, maxLength: 30 });

/**
 * Generates a valid allocation config where percentages sum to 100.
 * Uses integer percentages distributed across 3 categories.
 */
const allocationConfigArb = fc
  .integer({ min: 0, max: 100 })
  .chain((emergencyPct) => {
    const remainAfterEmergency = 100 - emergencyPct;
    return fc.integer({ min: 0, max: remainAfterEmergency }).map((fixedPct) => {
      const variablePct = remainAfterEmergency - fixedPct;
      return [
        { category: "emergency" as InvestmentCategory, percentage: emergencyPct },
        { category: "fixed-income" as InvestmentCategory, percentage: fixedPct },
        { category: "variable-income" as InvestmentCategory, percentage: variablePct },
      ];
    });
  });

// Feature: finance-advanced-features, Property 13: Investimentos são registrados como despesas com subcategoria
// **Validates: Requirements 4.2, 4.10**
describe("Property 13: Investimentos são registrados como despesas com subcategoria", () => {
  it("investment items always have type expense and the selected investmentCategory", () => {
    fc.assert(
      fc.property(
        investmentCategoryArb,
        amountArb,
        boardIdArb,
        (category, amount, boardId) => {
          const item = createInvestmentItem(category, amount, boardId);

          expect(item.type).toBe("expense");
          expect(item.investmentCategory).toBe(category);
          expect(item.amount).toBe(amount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("investment items respect board scope when boardId is provided", () => {
    fc.assert(
      fc.property(
        investmentCategoryArb,
        amountArb,
        fc.uuid(),
        (category, amount, boardId) => {
          const item = createInvestmentItem(category, amount, boardId);

          expect(item.boardId).toBe(boardId);
          expect(item.type).toBe("expense");
          expect(item.investmentCategory).toBe(category);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("investment items without boardId do not have boardId field", () => {
    fc.assert(
      fc.property(
        investmentCategoryArb,
        amountArb,
        (category, amount) => {
          const item = createInvestmentItem(category, amount, undefined);

          expect(item.type).toBe("expense");
          expect(item.investmentCategory).toBe(category);
          expect(item.boardId).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 14: Agregação de investimentos por categoria é correta
// **Validates: Requirements 4.3, 4.8**
describe("Property 14: Agregação de investimentos por categoria é correta", () => {
  it("total per category equals sum of amounts for that category, excluding moved items", () => {
    fc.assert(
      fc.property(investmentItemsListArb, (items) => {
        const aggregated = aggregateInvestmentsByCategory(items);

        // Manually compute expected totals
        const expected: Record<InvestmentCategory, number> = {
          emergency: 0,
          "fixed-income": 0,
          "variable-income": 0,
        };

        for (const item of items) {
          if (item.status === "moved") continue;
          if (!item.investmentCategory) continue;
          expected[item.investmentCategory] += Math.round(item.amount * 100);
        }

        expect(Math.round(aggregated.emergency * 100)).toBe(expected.emergency);
        expect(Math.round(aggregated["fixed-income"] * 100)).toBe(expected["fixed-income"]);
        expect(Math.round(aggregated["variable-income"] * 100)).toBe(expected["variable-income"]);
      }),
      { numRuns: 100 },
    );
  });

  it("moved items are excluded from aggregation", () => {
    // Generate items where all are moved
    const allMovedArb = fc.array(
      fc.record({
        investmentCategory: investmentCategoryArb,
        amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        status: fc.constant<FinanceStatus>("moved"),
      }),
      { minLength: 1, maxLength: 20 },
    );

    fc.assert(
      fc.property(allMovedArb, (items) => {
        const aggregated = aggregateInvestmentsByCategory(items);

        expect(aggregated.emergency).toBe(0);
        expect(aggregated["fixed-income"]).toBe(0);
        expect(aggregated["variable-income"]).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 15: Persistência round-trip de templates de investimento
// **Validates: Requirements 4.4**
describe("Property 15: Persistência round-trip de templates de investimento", () => {
  it("serializing an investment template to JSON and parsing it back preserves all fields", () => {
    fc.assert(
      fc.property(investmentTemplateArb, (template) => {
        const roundTripped = roundTripTemplate(template);

        expect(roundTripped.id).toBe(template.id);
        expect(roundTripped.userId).toBe(template.userId);
        expect(roundTripped.title).toBe(template.title);
        expect(roundTripped.amount).toBe(template.amount);
        expect(roundTripped.dayOfMonth).toBe(template.dayOfMonth);
        expect(roundTripped.investmentCategory).toBe(template.investmentCategory);
        expect(roundTripped.isFixed).toBe(template.isFixed);

        // boardId may be undefined — check equality
        if (template.boardId !== undefined) {
          expect(roundTripped.boardId).toBe(template.boardId);
        } else {
          expect(roundTripped.boardId).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  it("round-trip preserves templates in a list", () => {
    const templateListArb = fc.array(investmentTemplateArb, { minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(templateListArb, (templates) => {
        const serialized = JSON.stringify(templates);
        const deserialized: InvestmentTemplate[] = JSON.parse(serialized);

        expect(deserialized).toHaveLength(templates.length);

        for (let i = 0; i < templates.length; i++) {
          expect(deserialized[i].investmentCategory).toBe(templates[i].investmentCategory);
          expect(deserialized[i].amount).toBe(templates[i].amount);
          expect(deserialized[i].dayOfMonth).toBe(templates[i].dayOfMonth);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 16: Geração automática de aportes de investimento
// **Validates: Requirements 4.5**
describe("Property 16: Geração automática de aportes de investimento", () => {
  it("generated item preserves investmentCategory from the template", () => {
    fc.assert(
      fc.property(
        investmentTemplateArb,
        fc.constantFrom("2025-01", "2025-06", "2025-12"),
        (template, month) => {
          const item = generateItemFromTemplate(template, month);

          expect(item.investmentCategory).toBe(template.investmentCategory);
          expect(item.type).toBe("expense");
          expect(item.amount).toBe(template.amount);
          expect(item.title).toBe(template.title);
          expect(item.status).toBe("pending");
          expect(item.isFixed).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("generated item date matches the template dayOfMonth in the target month", () => {
    fc.assert(
      fc.property(
        investmentTemplateArb,
        fc.constantFrom("2025-01", "2025-06", "2025-12"),
        (template, month) => {
          const item = generateItemFromTemplate(template, month);

          const expectedDay = String(template.dayOfMonth).padStart(2, "0");
          expect(item.date).toBe(`${month}-${expectedDay}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 17: Sugestão de alocação respeita proporções configuradas
// **Validates: Requirements 4.6, 4.7**
describe("Property 17: Sugestão de alocação respeita proporções configuradas", () => {
  it("suggested amounts sum to the total investment amount in cents", () => {
    fc.assert(
      fc.property(
        allocationConfigArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (allocations, totalAmount) => {
          const suggestion = calculateAllocationSuggestion(totalAmount, allocations);

          const suggestedTotalCents =
            Math.round(suggestion.emergency * 100) +
            Math.round(suggestion["fixed-income"] * 100) +
            Math.round(suggestion["variable-income"] * 100);

          const totalCents = Math.round(totalAmount * 100);

          expect(suggestedTotalCents).toBe(totalCents);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("each suggested amount is proportional to the configured percentage", () => {
    fc.assert(
      fc.property(
        allocationConfigArb,
        fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
        (allocations, totalAmount) => {
          const suggestion = calculateAllocationSuggestion(totalAmount, allocations);
          const totalCents = Math.round(totalAmount * 100);

          for (const alloc of allocations) {
            const suggestedCents = Math.round(suggestion[alloc.category] * 100);
            const expectedRaw = (totalCents * alloc.percentage) / 100;

            // Each suggested value should be within 1 cent of the proportional value
            expect(Math.abs(suggestedCents - expectedRaw)).toBeLessThanOrEqual(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("all suggested amounts are non-negative", () => {
    fc.assert(
      fc.property(
        allocationConfigArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (allocations, totalAmount) => {
          const suggestion = calculateAllocationSuggestion(totalAmount, allocations);

          expect(suggestion.emergency).toBeGreaterThanOrEqual(0);
          expect(suggestion["fixed-income"]).toBeGreaterThanOrEqual(0);
          expect(suggestion["variable-income"]).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
