import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { clp, type Clp } from './clp.js';
import { allocateLargestRemainder, type AllocationShare } from './largest-remainder.js';

// Generator ranges from docs/qa/comunidades-simuladas.md, "Propiedades que siempre deben
// cumplirse": totals from $0 to $9.999.999.999 (spec rule B-6) and arbitrary non-negative
// integer weights with at least one weight greater than 0.
const MAX_TOTAL = 9_999_999_999n;

const totalArb = fc.bigInt({ min: 0n, max: MAX_TOTAL }).map(clp);

const sharesArb = fc
  .uniqueArray(fc.integer({ min: 0, max: 10_000 }), { minLength: 1, maxLength: 40 })
  .chain((sortOrders) =>
    fc.tuple(
      ...sortOrders.map((sortOrder) =>
        fc
          .bigInt({ min: 0n, max: 1_000_000n })
          .map((weight): AllocationShare => ({ sortOrder, weight })),
      ),
    ),
  )
  .filter((shares) => shares.some((share) => share.weight > 0n));

const sum = (values: readonly bigint[]): bigint => values.reduce((acc, value) => acc + value, 0n);

/** Allocates and pairs each share with its charge, checking that no share was dropped. */
const allocatePairs = (total: Clp, shares: readonly AllocationShare[]) => {
  const charges = allocateLargestRemainder(total, shares);
  expect(charges).toHaveLength(shares.length);
  return shares.map((share, i) => ({ share, charge: charges[i] ?? clp(0n) }));
};

describe('allocateLargestRemainder', () => {
  it('allocates the reserve fund of Comunidad D exactly as CA-4 (GOLD-D-01 to GOLD-D-04)', () => {
    const shares: AllocationShare[] = [
      { sortOrder: 1, weight: 187_345n },
      { sortOrder: 2, weight: 243_218n },
      { sortOrder: 3, weight: 256_789n },
      { sortOrder: 4, weight: 312_648n },
    ];

    expect(allocateLargestRemainder(clp(43_828n), shares)).toEqual([
      8_211n,
      10_660n,
      11_254n,
      13_703n,
    ]);
  });

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

  describe('properties (docs/qa/comunidades-simuladas.md)', () => {
    it('1. the charges add up exactly to the total', () => {
      fc.assert(
        fc.property(totalArb, sharesArb, (total, shares) => {
          expect(sum(allocateLargestRemainder(total, shares))).toBe(total);
        }),
      );
    });

    it('2. no charge differs from its exact share by one peso or more', () => {
      fc.assert(
        fc.property(totalArb, sharesArb, (total, shares) => {
          const weightSum = sum(shares.map((share) => share.weight));
          for (const { share, charge } of allocatePairs(total, shares)) {
            // |charge - total * weight / weightSum| < 1, multiplied by weightSum.
            const scaledDiff = charge * weightSum - total * share.weight;
            expect(scaledDiff > -weightSum && scaledDiff < weightSum).toBe(true);
          }
        }),
      );
    });

    it('3. no charge is negative', () => {
      fc.assert(
        fc.property(totalArb, sharesArb, (total, shares) => {
          for (const charge of allocateLargestRemainder(total, shares)) {
            expect(charge >= 0n).toBe(true);
          }
        }),
      );
    });

    it('4. the result does not depend on the input order', () => {
      fc.assert(
        fc.property(
          totalArb,
          sharesArb.chain((shares) =>
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

    it('5. a share with weight 0 gets a $0 charge', () => {
      fc.assert(
        fc.property(totalArb, sharesArb, (total, shares) => {
          for (const { share, charge } of allocatePairs(total, shares)) {
            if (share.weight === 0n) {
              expect(charge).toBe(0n);
            }
          }
        }),
      );
    });
  });
});
