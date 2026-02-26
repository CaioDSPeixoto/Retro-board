import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: project-standards-documentation, Property Test Example:
 * Demonstrates fast-check integration with Vitest
 */
describe('Fast-check Integration', () => {
  it('should verify addition is commutative', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer(),
        (a, b) => {
          expect(a + b).toBe(b + a);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify string concatenation length', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (str1, str2) => {
          const result = str1 + str2;
          expect(result.length).toBe(str1.length + str2.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
