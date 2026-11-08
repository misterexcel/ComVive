import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { clp, type Clp } from './clp.js';
import { allocateLargestRemainder, type AllocationShare } from './largest-remainder.js';

// The gold tests of Comunidades B, C, CE and D live in ./gold.test.ts.

// Generators from docs/qa/casos/gasto-comun.md, "Propiedades (fast-check)": totals as bigint from
// $0 to $9.999.999.999 (spec rule B-6); weights from 0 to 1.000.000 (aliquot_e6) or from 0 to 1.000
// (equal parts and relative weights), at least one greater than 0; from 1 to 50 units with unique,
// non-consecutive sort_order values.
const MAX_TOTAL = 9_999_999_999n;
const MAX_UNITS = 50;

const totalArb = fc.bigInt({ min: 0n, max: MAX_TOTAL }).map(clp);

/** One weight family per community: relative weights (0..1.000) or aliquots (0..1.000.000). */
const weightFamilyArb = fc.oneof(
  fc.constant(fc.bigInt({ min: 0n, max: 1_000n })),
  fc.constant(fc.bigInt({ min: 0n, max: 1_000_000n })),
);

/** Unique sort_order values with gaps (not 1..n), in random order. */
const sortOrdersArb = (length: number) =>
  fc.uniqueArray(fc.integer({ min: -10_000, max: 10_000 }), {
    minLength: length,
    maxLength: length,
  });

const hasPositiveWeight = (weights: readonly bigint[]) => weights.some((weight) => weight > 0n);

/** Pairs weights with unique sort_order values. */
const withSortOrders = (weights: readonly bigint[]) =>
  sortOrdersArb(weights.length).map((sortOrders) =>
    weights.map((weight, i): AllocationShare => ({ weight, sortOrder: sortOrders[i] ?? 0 })),
  );

/** 1 to 50 units with arbitrary weights from one family. */
const sharesArb = weightFamilyArb
  .chain((weightArb) => fc.array(weightArb, { minLength: 1, maxLength: MAX_UNITS }))
  .filter(hasPositiveWeight)
  .chain(withSortOrders);

/**
 * Forces remainder ties: every weight appears at least twice (the list is duplicated and shuffled),
 * so units with equal weight have equal remainders and the tie is broken by sort_order.
 */
const tiedSharesArb = weightFamilyArb
  .chain((weightArb) => fc.array(weightArb, { minLength: 1, maxLength: MAX_UNITS / 2 }))
  .filter(hasPositiveWeight)
  .chain((weights) => {
    const duplicated = [...weights, ...weights];
    return fc.shuffledSubarray(duplicated, { minLength: duplicated.length });
  })
  .chain(withSortOrders);

/** Both families: arbitrary weights and weights duplicated to force ties. */
const anySharesArb = fc.oneof(sharesArb, tiedSharesArb);

const sum = (values: readonly bigint[]): bigint => values.reduce((acc, value) => acc + value, 0n);

/** Allocates and pairs each share with its charge, checking that no share was dropped. */
const allocatePairs = (total: Clp, shares: readonly AllocationShare[]) => {
  const charges = allocateLargestRemainder(total, shares);
  expect(charges).toHaveLength(shares.length);
  return shares.map((share, i) => ({ share, charge: charges[i] ?? clp(0n) }));
};

const equalParts = (sortOrders: readonly number[]): AllocationShare[] =>
  sortOrders.map((sortOrder) => ({ sortOrder, weight: 1n }));

describe('allocateLargestRemainder', () => {
  it('breaks remainder ties by the lowest sortOrder, not by input position', () => {
    const shares: AllocationShare[] = [
      { sortOrder: 9, weight: 1n },
      { sortOrder: 10, weight: 1n },
      { sortOrder: 2, weight: 1n },
    ];

    // 100 / 3 = 33 remainder 1: the extra peso goes to sortOrder 2.
    expect(allocateLargestRemainder(clp(100n), shares)).toEqual([33n, 33n, 34n]);
  });

  it('rejects an empty list of shares', () => {
    expect(() => allocateLargestRemainder(clp(100n), [])).toThrow(RangeError);
  });

  it('rejects shares whose weights are all zero', () => {
    expect(() => allocateLargestRemainder(clp(100n), [{ sortOrder: 1, weight: 0n }])).toThrow(
      RangeError,
    );
  });

  it('rejects a negative weight', () => {
    expect(() =>
      allocateLargestRemainder(clp(100n), [
        { sortOrder: 1, weight: 2n },
        { sortOrder: 2, weight: -1n },
      ]),
    ).toThrow(RangeError);
  });

  it('rejects a negative total', () => {
    expect(() => allocateLargestRemainder(clp(-1n), [{ sortOrder: 1, weight: 1n }])).toThrow(
      RangeError,
    );
  });

  it('rejects duplicated sortOrder values, because ties would be ambiguous', () => {
    expect(() =>
      allocateLargestRemainder(clp(100n), [
        { sortOrder: 1, weight: 1n },
        { sortOrder: 1, weight: 1n },
      ]),
    ).toThrow(RangeError);
  });

  describe('edge cases (docs/qa/casos/gasto-comun.md)', () => {
    it('TC-GC-CB-01 · expenses of the same group are added before allocating (allocation part)', () => {
      // Comunidad B (Casa 1..3, sort_order 1..3), three ordinary expenses of $1 in equal parts.
      const shares = equalParts([1, 2, 3]);
      const ordinaryTotal = clp(1n + 1n + 1n);

      // Total 3, 3 div 3 = 1 per house.
      expect(allocateLargestRemainder(ordinaryTotal, shares)).toEqual([1n, 1n, 1n]);

      // Fund (rule D-3 has no code yet, so its total is fixed here):
      // (3 × 500 + 9.999) div 10.000 = 11.499 div 10.000 = $1, to Casa 1 (tied remainders, sort_order 1).
      const fundTotal = clp(1n);
      expect((3n * 500n + 9_999n) / 10_000n).toBe(fundTotal);
      expect(allocateLargestRemainder(fundTotal, shares)).toEqual([1n, 0n, 0n]);
    });

    it('TC-GC-CB-02 · total lower than the number of units: $2 among 3 houses gives 1, 1, 0', () => {
      // Integer parts 0, remainders 2, 2, 2 (out of 3); the 2 pesos go to Casa 1 and Casa 2.
      expect(allocateLargestRemainder(clp(2n), equalParts([1, 2, 3]))).toEqual([1n, 1n, 0n]);
    });

    it('TC-GC-CB-07 · non-consecutive sort_order: the extra peso goes to "Depto 9" (sort_order 10)', () => {
      // Input order: "Depto 10" (sort_order 20), "Depto 9" (sort_order 10), "Depto 2" (sort_order 30).
      expect(allocateLargestRemainder(clp(100_000n), equalParts([20, 10, 30]))).toEqual([
        33_333n,
        33_334n,
        33_333n,
      ]);
    });

    it('TC-GC-CB-11 · large amounts without precision loss', () => {
      // Products 9.999.989.999.000.001 (over 2^53 − 1) and 9.999.999.999; integer parts
      // 9.999.989.999 and 9.999; remainders 1 and 999.999; the missing peso goes to the second unit.
      const shares: AllocationShare[] = [
        { sortOrder: 1, weight: 999_999n },
        { sortOrder: 2, weight: 1n },
      ];
      const charges = allocateLargestRemainder(clp(9_999_999_999n), shares);

      expect(charges).toEqual([9_999_989_999n, 10_000n]);
      expect(sum(charges)).toBe(9_999_999_999n);
    });
  });

  describe('properties (docs/qa/casos/gasto-comun.md, PROP-GC)', () => {
    it('PROP-GC-01 · the charges add up exactly to the total', () => {
      fc.assert(
        fc.property(totalArb, anySharesArb, (total, shares) => {
          expect(sum(allocateLargestRemainder(total, shares))).toBe(total);
        }),
      );
    });

    it('PROP-GC-02 · no charge differs from its exact share by one peso or more', () => {
      fc.assert(
        fc.property(totalArb, anySharesArb, (total, shares) => {
          const weightSum = sum(shares.map((share) => share.weight));
          for (const { share, charge } of allocatePairs(total, shares)) {
            // |charge - total * weight / weightSum| < 1, multiplied by weightSum.
            const scaledDiff = charge * weightSum - total * share.weight;
            expect(scaledDiff > -weightSum && scaledDiff < weightSum).toBe(true);
            // And the charge is the floor of the exact share or the floor plus one.
            const floor = (total * share.weight) / weightSum;
            expect(charge === floor || charge === floor + 1n).toBe(true);
          }
        }),
      );
    });

    it('PROP-GC-03 · no charge is negative', () => {
      fc.assert(
        fc.property(totalArb, anySharesArb, (total, shares) => {
          for (const charge of allocateLargestRemainder(total, shares)) {
            expect(charge >= 0n).toBe(true);
          }
        }),
      );
    });

    it('PROP-GC-03 · a share with weight 0 gets a $0 charge', () => {
      fc.assert(
        fc.property(totalArb, anySharesArb, (total, shares) => {
          for (const { share, charge } of allocatePairs(total, shares)) {
            if (share.weight === 0n) {
              expect(charge).toBe(0n);
            }
          }
        }),
      );
    });

    it('PROP-GC-05 · the result does not depend on the input order', () => {
      fc.assert(
        fc.property(
          totalArb,
          anySharesArb.chain((shares) =>
            fc.tuple(
              fc.constant(shares),
              fc.shuffledSubarray(shares, { minLength: shares.length }),
            ),
          ),
          (total, [shares, shuffled]) => {
            const bySortOrder = (list: readonly AllocationShare[]) =>
              new Map(
                allocatePairs(total, list).map(({ share, charge }) => [share.sortOrder, charge]),
              );

            expect(bySortOrder(shuffled)).toEqual(bySortOrder(shares));
          },
        ),
      );
    });

    it('PROP-GC-06 · equal weights: the lower sort_order never gets less', () => {
      fc.assert(
        fc.property(totalArb, tiedSharesArb, (total, shares) => {
          const pairs = allocatePairs(total, shares);
          for (const u of pairs) {
            for (const v of pairs) {
              if (u.share.weight === v.share.weight && u.share.sortOrder < v.share.sortOrder) {
                expect(u.charge >= v.charge).toBe(true);
              }
            }
          }
        }),
      );
    });

    it('PROP-GC-07 · multiplying every weight by k ≥ 1 does not change any charge', () => {
      fc.assert(
        fc.property(
          totalArb,
          anySharesArb,
          fc.bigInt({ min: 1n, max: 1_000_000n }),
          (total, shares, k) => {
            const scaled = shares.map((share) => ({ ...share, weight: share.weight * k }));
            expect(allocateLargestRemainder(total, scaled)).toEqual(
              allocateLargestRemainder(total, shares),
            );
          },
        ),
      );
    });

    it('PROP-GC-08 · the extra pesos are fewer than the units with weight > 0', () => {
      fc.assert(
        fc.property(totalArb, anySharesArb, (total, shares) => {
          const weightSum = sum(shares.map((share) => share.weight));
          const floors = shares.map((share) => (total * share.weight) / weightSum);
          const extraPesos = total - sum(floors);
          const positiveUnits = BigInt(shares.filter((share) => share.weight > 0n).length);

          // T − Σ ⌊T × w_u / W⌋ < number of units with w_u > 0.
          expect(extraPesos >= 0n && extraPesos < positiveUnits).toBe(true);

          // The allocation hands out exactly those extra pesos, one each, only to units with w_u > 0.
          const receivers = allocatePairs(total, shares).filter(
            ({ charge }, i) => charge > (floors[i] ?? 0n),
          );
          expect(BigInt(receivers.length)).toBe(extraPesos);
          for (const { share } of receivers) {
            expect(share.weight > 0n).toBe(true);
          }
        }),
      );
    });
  });
});
