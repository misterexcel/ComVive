import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { clp, clpFromJson, clpToJson } from './clp.js';

describe('clp', () => {
  it('wraps a bigint as a CLP amount without changing its value', () => {
    expect(clp(12_345n)).toBe(12_345n);
    expect(clp(-1n)).toBe(-1n);
  });
});

describe('clpFromJson', () => {
  it('accepts any safe integer and returns the same value as bigint', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          expect(clpFromJson(n)).toBe(BigInt(n));
        },
      ),
    );
  });

  it.each([0.5, 1.000_1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %s because it is not a safe integer',
    (n) => {
      expect(() => clpFromJson(n)).toThrow(RangeError);
    },
  );
});

describe('clpToJson', () => {
  it('round-trips every safe integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          expect(clpToJson(clpFromJson(n))).toBe(n);
        },
      ),
    );
  });

  it('fails instead of silently losing precision outside the safe range (ADR 0003)', () => {
    expect(() => clpToJson(clp(BigInt(Number.MAX_SAFE_INTEGER) + 1n))).toThrow(RangeError);
    expect(() => clpToJson(clp(-BigInt(Number.MAX_SAFE_INTEGER) - 1n))).toThrow(RangeError);
  });
});
