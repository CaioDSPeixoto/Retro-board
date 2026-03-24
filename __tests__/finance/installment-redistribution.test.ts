import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { distributeAmountInCents } from "@/lib/finance/utils";
import type { FinanceItem, FinanceStatus } from "@/types/finance";

// ── Pure logic helpers (mirror the redistribution rules from the spec) ──

/**
 * Calculates the redistribution difference in cents.
 * Property 4: difference = originalTotalCents - sum(editedValuesCents)
 */
function calculateRedistributionDifferenceCents(
  originalTotalCents: number,
  editedValuesCents: number[],
): number {
  const sumCents = editedValuesCents.reduce((a, b) => a + b, 0);
  return originalTotalCents - sumCents;
}

/**
 * Determines if an installment is editable based on its status.
 * Property 5: editable iff status === "pending"
 */
function isInstallmentEditable(status: FinanceStatus): boolean {
  return status === "pending";
}

/**
 * Validates whether a redistribution should be accepted.
 * Property 6: accepted when |originalTotalCents - newSumCents| <= 1
 */
function isRedistributionValid(
  originalTotalCents: number,
  newValuesCents: number[],
): boolean {
  const newSumCents = newValuesCents.reduce((a, b) => a + b, 0);
  return Math.abs(originalTotalCents - newSumCents) <= 1;
}

/**
 * Simulates a redistribution operation on installments.
 * Only updates pending installments' amounts; preserves all metadata.
 */
function applyRedistribution(
  installments: FinanceItem[],
  newPendingAmounts: number[],
): FinanceItem[] {
  const pending = installments
    .filter((i) => i.status === "pending")
    .sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0));

  const updatedIds = new Map<string, number>();
  for (let i = 0; i < pending.length; i++) {
    updatedIds.set(pending[i].id, newPendingAmounts[i]);
  }

  return installments.map((inst) => {
    const newAmount = updatedIds.get(inst.id);
    if (newAmount !== undefined) {
      return { ...inst, amount: newAmount };
    }
    return { ...inst };
  });
}

// ── Generators ──

const statusArb = fc.constantFrom<FinanceStatus>("pending", "paid", "partial", "moved");
const pendingStatusArb = fc.constant<FinanceStatus>("pending");

/**
 * Generates a group of installments sharing the same installmentGroupId.
 * At least 1 installment is pending so redistribution is meaningful.
 */
function installmentGroupArb(opts?: { allPending?: boolean }) {
  const countArb = fc.integer({ min: 2, max: 12 });
  const amountCentsArb = fc.integer({ min: 1, max: 10_000_00 }); // 1 cent to 10000.00

  return countArb.chain((count) => {
    const totalCentsArb = fc.integer({ min: count, max: 100_000_00 });

    return totalCentsArb.chain((totalCents) => {
      const distributedCents = distributeAmountInCents(totalCents, count);

      const statusArbToUse = opts?.allPending ? pendingStatusArb : statusArb;

      // Generate statuses, ensuring at least one is pending
      const statusesArb = fc
        .array(statusArbToUse, { minLength: count, maxLength: count })
        .filter((statuses) => statuses.some((s) => s === "pending"));

      return statusesArb.map((statuses) => {
        const groupId = "group-test-" + totalCents;
        const installments: FinanceItem[] = statuses.map((status, i) => ({
          id: `inst-${i}`,
          userId: "user-1",
          title: `Parcela ${i + 1}/${count}`,
          amount: distributedCents[i] / 100,
          date: "2025-01-15",
          type: "expense" as const,
          status,
          category: "general",
          createdAt: "2025-01-01T00:00:00Z",
          installmentGroupId: groupId,
          installmentIndex: i + 1,
          installmentTotal: count,
          originalAmount: distributedCents[i] / 100,
        }));

        return { installments, totalCents, groupId };
      });
    });
  });
}

// Feature: finance-advanced-features, Property 4: Diferença de redistribuição é correta em tempo real
// **Validates: Requirements 2.2**
describe("Property 4: Redistribution difference is correct in real time", () => {
  it("difference equals originalTotalCents minus sum of edited values in cents", () => {
    fc.assert(
      fc.property(
        installmentGroupArb(),
        ({ installments, totalCents }) => {
          // Generate random edited values for pending installments
          const pending = installments.filter((i) => i.status === "pending");
          // Use the current amounts as "edited values" (could be any values)
          const editedCents = pending.map((i) => Math.round(i.amount * 100));

          // Non-pending amounts stay fixed
          const nonPendingCents = installments
            .filter((i) => i.status !== "pending")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          const diff = calculateRedistributionDifferenceCents(
            totalCents - nonPendingCents,
            editedCents,
          );

          const expectedDiff =
            totalCents -
            nonPendingCents -
            editedCents.reduce((a, b) => a + b, 0);

          expect(diff).toBe(expectedDiff);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("difference is zero when edited values sum to the pending total", () => {
    fc.assert(
      fc.property(
        installmentGroupArb(),
        ({ installments, totalCents }) => {
          const nonPendingCents = installments
            .filter((i) => i.status !== "pending")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          const pendingTotalCents = totalCents - nonPendingCents;
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          // Distribute the pending total evenly — sum should match
          const editedCents = distributeAmountInCents(
            pendingTotalCents,
            pendingCount,
          );

          const diff = calculateRedistributionDifferenceCents(
            pendingTotalCents,
            editedCents,
          );

          expect(diff).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 5: Editabilidade de parcelas depende do status
// **Validates: Requirements 2.3, 2.9**
describe("Property 5: Installment editability depends on status", () => {
  it("installment is editable if and only if status is pending", () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const editable = isInstallmentEditable(status);

        if (status === "pending") {
          expect(editable).toBe(true);
        } else {
          expect(editable).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("paid, partial, and moved installments are always read-only", () => {
    const readOnlyStatusArb = fc.constantFrom<FinanceStatus>(
      "paid",
      "partial",
      "moved",
    );

    fc.assert(
      fc.property(readOnlyStatusArb, (status) => {
        expect(isInstallmentEditable(status)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("in a group, only pending installments are editable", () => {
    fc.assert(
      fc.property(
        installmentGroupArb(),
        ({ installments }) => {
          for (const inst of installments) {
            const editable = isInstallmentEditable(inst.status);
            if (inst.status === "pending") {
              expect(editable).toBe(true);
            } else {
              expect(editable).toBe(false);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 6: Redistribuição preserva o total original
// **Validates: Requirements 2.5**
describe("Property 6: Redistribution preserves the original total", () => {
  it("redistribution is accepted when sum of new values is within 1 centavo of original", () => {
    fc.assert(
      fc.property(
        installmentGroupArb(),
        fc.integer({ min: -1, max: 1 }),
        ({ installments, totalCents }, offset) => {
          const nonPendingCents = installments
            .filter((i) => i.status !== "pending")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          const pendingTotalCents = totalCents - nonPendingCents;
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          // Distribute with a small offset (within tolerance)
          const baseCents = distributeAmountInCents(
            pendingTotalCents,
            pendingCount,
          );
          // Apply offset to the first installment
          const adjustedCents = [...baseCents];
          adjustedCents[0] = adjustedCents[0] + offset;

          const valid = isRedistributionValid(
            totalCents,
            [
              ...adjustedCents,
              ...installments
                .filter((i) => i.status !== "pending")
                .map((i) => Math.round(i.amount * 100)),
            ],
          );

          expect(valid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("redistribution is rejected when difference exceeds 1 centavo", () => {
    fc.assert(
      fc.property(
        installmentGroupArb(),
        fc.oneof(
          fc.integer({ min: 2, max: 1000 }),
          fc.integer({ min: -1000, max: -2 }),
        ),
        ({ installments, totalCents }, bigOffset) => {
          const nonPendingCents = installments
            .filter((i) => i.status !== "pending")
            .reduce((sum, i) => sum + Math.round(i.amount * 100), 0);

          const pendingTotalCents = totalCents - nonPendingCents;
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          const baseCents = distributeAmountInCents(
            pendingTotalCents,
            pendingCount,
          );
          const adjustedCents = [...baseCents];
          adjustedCents[0] = adjustedCents[0] + bigOffset;

          const valid = isRedistributionValid(
            totalCents,
            [
              ...adjustedCents,
              ...installments
                .filter((i) => i.status !== "pending")
                .map((i) => Math.round(i.amount * 100)),
            ],
          );

          expect(valid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 7: Redistribuição preserva metadados de parcelas
// **Validates: Requirements 2.8**
describe("Property 7: Redistribution preserves installment metadata", () => {
  it("installmentGroupId, installmentIndex, installmentTotal and originalAmount remain unchanged after redistribution", () => {
    fc.assert(
      fc.property(
        installmentGroupArb({ allPending: true }),
        ({ installments, totalCents }) => {
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          // Create valid new amounts that sum to the total
          const newPendingCents = distributeAmountInCents(
            totalCents,
            pendingCount,
          );
          const newPendingAmounts = newPendingCents.map((c) => c / 100);

          const result = applyRedistribution(installments, newPendingAmounts);

          for (let i = 0; i < installments.length; i++) {
            const before = installments[i];
            const after = result[i];

            expect(after.installmentGroupId).toBe(before.installmentGroupId);
            expect(after.installmentIndex).toBe(before.installmentIndex);
            expect(after.installmentTotal).toBe(before.installmentTotal);
            expect(after.originalAmount).toBe(before.originalAmount);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("metadata is preserved even when amounts change significantly", () => {
    fc.assert(
      fc.property(
        installmentGroupArb({ allPending: true }),
        fc.integer({ min: 1, max: 100 }),
        ({ installments, totalCents }, seed) => {
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          // Create an uneven distribution (first gets most, rest get minimum)
          const newPendingCents: number[] = [];
          let remaining = totalCents;
          for (let i = 0; i < pendingCount - 1; i++) {
            const val = Math.max(1, Math.floor(remaining / (pendingCount * 2)));
            newPendingCents.push(val);
            remaining -= val;
          }
          newPendingCents.push(remaining);

          const newPendingAmounts = newPendingCents.map((c) => c / 100);
          const result = applyRedistribution(installments, newPendingAmounts);

          for (let i = 0; i < installments.length; i++) {
            expect(result[i].installmentGroupId).toBe(
              installments[i].installmentGroupId,
            );
            expect(result[i].installmentIndex).toBe(
              installments[i].installmentIndex,
            );
            expect(result[i].installmentTotal).toBe(
              installments[i].installmentTotal,
            );
            expect(result[i].originalAmount).toBe(
              installments[i].originalAmount,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: finance-advanced-features, Property 8: Round-trip de redistribuição de parcelas
// **Validates: Requirements 2.7**
describe("Property 8: Round-trip of installment redistribution", () => {
  it("after redistribution, serializing and deserializing preserves the new values", () => {
    fc.assert(
      fc.property(
        installmentGroupArb({ allPending: true }),
        ({ installments, totalCents }) => {
          const pendingCount = installments.filter(
            (i) => i.status === "pending",
          ).length;

          // Create valid new amounts
          const newPendingCents = distributeAmountInCents(
            totalCents,
            pendingCount,
          );
          const newPendingAmounts = newPendingCents.map((c) => c / 100);

          // Apply redistribution
          const redistributed = applyRedistribution(
            installments,
            newPendingAmounts,
          );

          // Simulate Firestore round-trip: serialize to JSON and parse back
          const serialized = JSON.stringify(redistributed);
          const deserialized: FinanceItem[] = JSON.parse(serialized);

          // Verify values match after round-trip
          const pendingRedistributed = redistributed
            .filter((i) => i.status === "pending")
            .sort(
              (a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0),
            );
          const pendingDeserialized = deserialized
            .filter((i) => i.status === "pending")
            .sort(
              (a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0),
            );

          for (let i = 0; i < pendingRedistributed.length; i++) {
            expect(pendingDeserialized[i].amount).toBe(
              pendingRedistributed[i].amount,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("round-trip preserves all installment fields including metadata and new amounts", () => {
    fc.assert(
      fc.property(
        installmentGroupArb({ allPending: true }),
        ({ installments, totalCents }) => {
          const pendingCount = installments.length;

          // Redistribute with different distribution
          const newCents = distributeAmountInCents(totalCents, pendingCount);
          // Reverse the distribution to create different values
          const reversedCents = [...newCents].reverse();
          const newAmounts = reversedCents.map((c) => c / 100);

          const redistributed = applyRedistribution(installments, newAmounts);

          // Simulate round-trip
          const roundTripped: FinanceItem[] = JSON.parse(
            JSON.stringify(redistributed),
          );

          for (let i = 0; i < redistributed.length; i++) {
            const orig = redistributed[i];
            const rt = roundTripped[i];

            // Amount matches
            expect(rt.amount).toBe(orig.amount);
            // Metadata preserved
            expect(rt.installmentGroupId).toBe(orig.installmentGroupId);
            expect(rt.installmentIndex).toBe(orig.installmentIndex);
            expect(rt.installmentTotal).toBe(orig.installmentTotal);
            expect(rt.originalAmount).toBe(orig.originalAmount);
            // Other fields preserved
            expect(rt.id).toBe(orig.id);
            expect(rt.title).toBe(orig.title);
            expect(rt.status).toBe(orig.status);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
