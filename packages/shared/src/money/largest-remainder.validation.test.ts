import { describe, expect, it } from 'vitest';

import { clp } from './clp.js';
import { allocateLargestRemainder } from './largest-remainder.js';

// Input validation of `sortOrder` (review 2026-11-08, minor 1). The tie-break comparator is only
// consistent when every `sortOrder` is a safe integer.
describe('allocateLargestRemainder · sortOrder validation', () => {
  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    -Number.MAX_SAFE_INTEGER - 1,
  ])('rejects sortOrder %s with RangeError', (sortOrder) => {
    expect(() =>
      allocateLargestRemainder(clp(100n), [
        { weight: 1n, sortOrder: 1 },
        { weight: 1n, sortOrder },
      ]),
    ).toThrow(RangeError);
  });

  it('accepts the safe integer limits and negative values', () => {
    expect(
      allocateLargestRemainder(clp(3n), [
        { weight: 1n, sortOrder: Number.MAX_SAFE_INTEGER },
        { weight: 1n, sortOrder: -Number.MAX_SAFE_INTEGER },
      ]),
    ).toEqual([1n, 2n]);
  });

  it('breaks a tie at the extremes by the lowest sortOrder', () => {
    expect(
      allocateLargestRemainder(clp(1n), [
        { weight: 1n, sortOrder: Number.MAX_SAFE_INTEGER },
        { weight: 1n, sortOrder: -Number.MAX_SAFE_INTEGER },
        { weight: 1n, sortOrder: 0 },
      ]),
    ).toEqual([0n, 1n, 0n]);
  });
});
