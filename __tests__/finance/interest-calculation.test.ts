import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateInterestInstallments,
  distributeAmountInCents,
} from "@/lib/finance/utils";
import type { InterestConfig, InterestType } from "@/types/finance";

// Feature: finance-advanced-features, Property 1: Interest calculation on installments preserves correctness
// **Validates: Requirements 1.2, 1.3, 1.4**
describe("Property 1: Interest calculation on installments preserves correctness", () => {
  const interestTypeArb = fc.constantFrom<InterestType>("percentage", "fixed", "both");
  const totalArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true });
  const installmentsArb = fc.integer({ min: 1, max: 60 });
  const rateArb = fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true });
  const fixedAmountArb = fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true });

  it("percentage interest is calculated on outstanding balance", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        rateArb,
        (total, installments, rate) => {
          const config: InterestConfig = { type: "percentage", rate };
          const result = calculateInterestInstallments(total, installments, config);

          const totalCents = Math.round(total * 100);
          const baseCentsArr = distributeAmountInCents(totalCents, installments);

          let paidBaseCents = 0;
          for (let i = 0; i < installments; i++) {
            const outstandingCents = totalCents - paidBaseCents;
            const expectedInterestCents = Math.round(outstandingCents * (rate / 100));

            expect(result[i].interest).toBeCloseTo(expectedInterestCents / 100, 10);
            paidBaseCents += baseCentsArr[i];
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("fixed interest adds the same fixed amount to each installment", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        fixedAmountArb,
        (total, installments, fixedAmount) => {
          const config: InterestConfig = { type: "fixed", fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          const expectedInterestCents = Math.round(fixedAmount * 100);
          for (let i = 0; i < installments; i++) {
            expect(result[i].interest).toBeCloseTo(expectedInterestCents / 100, 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("both: percentage is applied first on outstanding balance, then fixed is added", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        rateArb,
        fixedAmountArb,
        (total, installments, rate, fixedAmount) => {
          const config: InterestConfig = { type: "both", rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          const totalCents = Math.round(total * 100);
          const baseCentsArr = distributeAmountInCents(totalCents, installments);
          const fixedCents = Math.round(fixedAmount * 100);

          let paidBaseCents = 0;
          for (let i = 0; i < installments; i++) {
            const outstandingCents = totalCents - paidBaseCents;
            const percentageCents = Math.round(outstandingCents * (rate / 100));
            const expectedInterestCents = percentageCents + fixedCents;

            expect(result[i].interest).toBeCloseTo(expectedInterestCents / 100, 10);
            paidBaseCents += baseCentsArr[i];
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("each installment stores base and interest separately", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestTypeArb,
        rateArb,
        fixedAmountArb,
        (total, installments, type, rate, fixedAmount) => {
          const config: InterestConfig = { type, rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          for (const inst of result) {
            expect(inst).toHaveProperty("base");
            expect(inst).toHaveProperty("interest");
            expect(inst).toHaveProperty("total");
            expect(typeof inst.base).toBe("number");
            expect(typeof inst.interest).toBe("number");
            expect(typeof inst.total).toBe("number");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("number of installments returned matches the requested count", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestTypeArb,
        rateArb,
        fixedAmountArb,
        (total, installments, type, rate, fixedAmount) => {
          const config: InterestConfig = { type, rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);
          expect(result).toHaveLength(installments);
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: finance-advanced-features, Property 2: Sum of installments with interest in cents is precise
// **Validates: Requirements 1.7**
describe("Property 2: Sum of installments with interest in cents is precise", () => {
  const interestTypeArb = fc.constantFrom<InterestType>("percentage", "fixed", "both");
  const totalArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true });
  const installmentsArb = fc.integer({ min: 1, max: 60 });
  const rateArb = fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true });
  const fixedAmountArb = fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true });

  it("sum of all base values in cents equals the original total in cents (no cent loss)", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestTypeArb,
        rateArb,
        fixedAmountArb,
        (total, installments, type, rate, fixedAmount) => {
          const config: InterestConfig = { type, rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          const totalCents = Math.round(total * 100);
          const sumBaseCents = result.reduce(
            (acc, inst) => acc + Math.round(inst.base * 100),
            0,
          );

          expect(sumBaseCents).toBe(totalCents);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("each installment total equals base + interest (consistency check)", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestTypeArb,
        rateArb,
        fixedAmountArb,
        (total, installments, type, rate, fixedAmount) => {
          const config: InterestConfig = { type, rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          for (const inst of result) {
            const expectedTotalCents =
              Math.round(inst.base * 100) + Math.round(inst.interest * 100);
            const actualTotalCents = Math.round(inst.total * 100);
            expect(actualTotalCents).toBe(expectedTotalCents);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("all values are non-negative", () => {
    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestTypeArb,
        rateArb,
        fixedAmountArb,
        (total, installments, type, rate, fixedAmount) => {
          const config: InterestConfig = { type, rate, fixedAmount };
          const result = calculateInterestInstallments(total, installments, config);

          for (const inst of result) {
            expect(inst.base).toBeGreaterThanOrEqual(0);
            expect(inst.interest).toBeGreaterThanOrEqual(0);
            expect(inst.total).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: finance-advanced-features, Property 3: Persistência round-trip da configuração de juros
// **Validates: Requirements 1.5**
describe("Property 3: Round-trip persistence of interest configuration", () => {
  const interestTypeArb = fc.constantFrom<InterestType>("percentage", "fixed", "both");
  const rateArb = fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true });
  const fixedAmountArb = fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true });

  const interestConfigArb = fc.record({
    type: interestTypeArb,
    rate: rateArb,
    fixedAmount: fixedAmountArb,
  }) as fc.Arbitrary<InterestConfig>;

  it("serializing an InterestConfig to JSON and parsing it back produces an identical config", () => {
    fc.assert(
      fc.property(interestConfigArb, (config) => {
        const serialized = JSON.stringify(config);
        const deserialized: InterestConfig = JSON.parse(serialized);

        expect(deserialized.type).toBe(config.type);
        expect(deserialized.rate).toBe(config.rate);
        expect(deserialized.fixedAmount).toBe(config.fixedAmount);
      }),
      { numRuns: 100 },
    );
  });

  it("interest config stored in each installment matches the original config after round-trip", () => {
    const totalArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true });
    const installmentsArb = fc.integer({ min: 1, max: 60 });

    fc.assert(
      fc.property(
        totalArb,
        installmentsArb,
        interestConfigArb,
        (total, installments, config) => {
          const result = calculateInterestInstallments(total, installments, config);

          // Simulate storing the config in each installment (as the action does)
          const storedInstallments = result.map((inst) => ({
            ...inst,
            interestConfig: config,
          }));

          // Simulate Firestore round-trip: serialize to JSON and parse back
          const serialized = JSON.stringify(storedInstallments);
          const deserialized = JSON.parse(serialized) as Array<{
            base: number;
            interest: number;
            total: number;
            interestConfig: InterestConfig;
          }>;

          for (const installment of deserialized) {
            expect(installment.interestConfig.type).toBe(config.type);
            expect(installment.interestConfig.rate).toBe(config.rate);
            expect(installment.interestConfig.fixedAmount).toBe(config.fixedAmount);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
