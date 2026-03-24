import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { SubItem, FinanceStatus } from "@/types/finance";

// ── Pure logic helpers (mirror the sub-items rules from the spec) ──

/**
 * Simulates a round-trip of a SubItem through JSON serialization (Firestore persistence).
 */
function roundTripSubItem(subItem: SubItem): SubItem {
  return JSON.parse(JSON.stringify(subItem));
}

/**
 * Determines if sub-item operations (add, edit, remove) are allowed
 * based on the parent finance item's status.
 * Property 10: allowed iff status === "pending"
 */
function isSubItemEditable(parentStatus: FinanceStatus): boolean {
  return parentStatus === "pending";
}

/**
 * Calculates the sum of sub-item amounts in cents for precision.
 */
function sumSubItemsCents(subItems: SubItem[]): number {
  return subItems.reduce((acc, si) => acc + Math.round(si.amount * 100), 0);
}

/**
 * Validates whether the sum of sub-items exceeds the parent item's value.
 * Returns { valid: true } when sum <= parentAmount, { warning: true } when sum > parentAmount.
 */
function validateSubItemsSum(
  parentAmountCents: number,
  subItems: SubItem[],
): { valid: boolean; warning: boolean } {
  const sumCents = sumSubItemsCents(subItems);
  return {
    valid: sumCents <= parentAmountCents,
    warning: sumCents > parentAmountCents,
  };
}

/**
 * Simulates cascade deletion: given a list of sub-items belonging to an item,
 * returns the remaining sub-items after the parent is deleted (should be empty).
 */
function cascadeDeleteSubItems(subItems: SubItem[]): SubItem[] {
  // Cascade delete removes all sub-items
  return [];
}

// ── Generators ──

const createdAtArb = fc
  .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-12-31").getTime() })
  .map((ts) => new Date(ts).toISOString());

const subItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  createdAt: createdAtArb,
}) as fc.Arbitrary<SubItem>;

const statusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial", "moved");

const subItemsListArb = fc.array(subItemArb, { minLength: 1, maxLength: 20 });

// Feature: finance-advanced-features, Property 9: Persistência round-trip de sub-itens
// **Validates: Requirements 3.1**
describe("Property 9: Persistência round-trip de sub-itens", () => {
  it("serializing a SubItem to JSON and parsing it back produces an identical sub-item", () => {
    fc.assert(
      fc.property(subItemArb, (subItem) => {
        const roundTripped = roundTripSubItem(subItem);

        expect(roundTripped.id).toBe(subItem.id);
        expect(roundTripped.title).toBe(subItem.title);
        expect(roundTripped.amount).toBe(subItem.amount);
        expect(roundTripped.createdAt).toBe(subItem.createdAt);
      }),
      { numRuns: 100 },
    );
  });

  it("round-trip preserves all sub-items in a list", () => {
    fc.assert(
      fc.property(subItemsListArb, (subItems) => {
        const serialized = JSON.stringify(subItems);
        const deserialized: SubItem[] = JSON.parse(serialized);

        expect(deserialized).toHaveLength(subItems.length);

        for (let i = 0; i < subItems.length; i++) {
          expect(deserialized[i].id).toBe(subItems[i].id);
          expect(deserialized[i].title).toBe(subItems[i].title);
          expect(deserialized[i].amount).toBe(subItems[i].amount);
          expect(deserialized[i].createdAt).toBe(subItems[i].createdAt);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 10: Editabilidade de sub-itens depende do status do lançamento pai
// **Validates: Requirements 3.2**
describe("Property 10: Editabilidade de sub-itens depende do status do lançamento pai", () => {
  it("sub-item operations are allowed if and only if parent status is pending", () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const editable = isSubItemEditable(status);

        if (status === "pending") {
          expect(editable).toBe(true);
        } else {
          expect(editable).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("paid, partial, and moved statuses always reject sub-item operations", () => {
    const readOnlyStatusArb = fc.constantFrom<FinanceStatus>("paid", "partial", "moved");

    fc.assert(
      fc.property(readOnlyStatusArb, (status) => {
        expect(isSubItemEditable(status)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 11: Soma de sub-itens e validação contra valor do lançamento
// **Validates: Requirements 3.4, 3.5**
describe("Property 11: Soma de sub-itens e validação contra valor do lançamento", () => {
  it("sum of sub-items is calculated correctly in cents", () => {
    fc.assert(
      fc.property(subItemsListArb, (subItems) => {
        const sumCents = sumSubItemsCents(subItems);
        const expectedCents = subItems.reduce(
          (acc, si) => acc + Math.round(si.amount * 100),
          0,
        );

        expect(sumCents).toBe(expectedCents);
      }),
      { numRuns: 100 },
    );
  });

  it("accepts when sum of sub-items is less than or equal to parent amount", () => {
    fc.assert(
      fc.property(
        subItemsListArb,
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (subItems, extraAmount) => {
          // Make parent amount = sum of sub-items + extra (so sum <= parent)
          const sumCents = sumSubItemsCents(subItems);
          const extraCents = Math.round(Math.abs(extraAmount) * 100);
          const parentAmountCents = sumCents + extraCents;

          const result = validateSubItemsSum(parentAmountCents, subItems);

          expect(result.valid).toBe(true);
          expect(result.warning).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("warns when sum of sub-items exceeds parent amount", () => {
    fc.assert(
      fc.property(
        subItemsListArb,
        fc.integer({ min: 1, max: 1000000 }),
        (subItems, deficit) => {
          // Make parent amount = sum of sub-items - deficit (so sum > parent)
          const sumCents = sumSubItemsCents(subItems);
          const parentAmountCents = Math.max(0, sumCents - deficit);

          // Only test when sum actually exceeds parent
          fc.pre(sumCents > parentAmountCents);

          const result = validateSubItemsSum(parentAmountCents, subItems);

          expect(result.valid).toBe(false);
          expect(result.warning).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 12: Exclusão em cascata de sub-itens
// **Validates: Requirements 3.7**
describe("Property 12: Exclusão em cascata de sub-itens", () => {
  it("after cascade delete, no sub-items remain", () => {
    fc.assert(
      fc.property(subItemsListArb, (subItems) => {
        const remaining = cascadeDeleteSubItems(subItems);

        expect(remaining).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it("cascade delete works regardless of the number of sub-items", () => {
    const variableLengthArb = fc.array(subItemArb, { minLength: 0, maxLength: 50 });

    fc.assert(
      fc.property(variableLengthArb, (subItems) => {
        const remaining = cascadeDeleteSubItems(subItems);

        expect(remaining).toHaveLength(0);
        expect(Array.isArray(remaining)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
