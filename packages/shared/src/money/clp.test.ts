import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { clp, clpFromJson, clpToJson, signedClpFromJson } from './clp.js';

const notSafeIntegers = [
  0.5,
  1.000_1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
];

describe('clp', () => {
  it('wraps a bigint as a CLP amount without changing its value', () => {
    expect(clp(12_345n)).toBe(12_345n);
    expect(clp(-1n)).toBe(-1n);
  });
});

describe('clpFromJson (non-negative amounts, ADR 0003 decision 2)', () => {
  it('accepts any safe integer from 0 to MAX_SAFE_INTEGER and returns the same value as bigint', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (n) => {
        expect(clpFromJson(n)).toBe(BigInt(n));
      }),
    );
  });

  it('accepts the limits 0 and MAX_SAFE_INTEGER', () => {
    expect(clpFromJson(0)).toBe(0n);
    expect(clpFromJson(Number.MAX_SAFE_INTEGER)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  it('rejects -1', () => {
    expect(() => clpFromJson(-1)).toThrow(RangeError);
  });

  it('reads -0 as 0', () => {
    expect(clpFromJson(-0)).toBe(0n);
  });

  it('rejects every negative safe integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: -1 }), (n) => {
        expect(() => clpFromJson(n)).toThrow(RangeError);
      }),
    );
  });

  it.each(notSafeIntegers)('rejects %s because it is not a safe integer', (n) => {
    expect(() => clpFromJson(n)).toThrow(RangeError);
  });
});

describe('signedClpFromJson (closed list of signed fields, ADR 0003 decision 2)', () => {
  it('accepts any safe integer and returns the same value as bigint', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          expect(signedClpFromJson(n)).toBe(BigInt(n));
        },
      ),
    );
  });

  it('accepts -1', () => {
    expect(signedClpFromJson(-1)).toBe(-1n);
  });

  it('reads -0 as 0', () => {
    expect(signedClpFromJson(-0)).toBe(0n);
  });

  it.each([...notSafeIntegers, -Number.MAX_SAFE_INTEGER - 1])(
    'rejects %s because it is not a safe integer',
    (n) => {
      expect(() => signedClpFromJson(n)).toThrow(RangeError);
    },
  );
});

describe('clpToJson', () => {
  it('round-trips every safe integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          expect(clpToJson(signedClpFromJson(n))).toBe(n);
        },
      ),
    );
  });

  it('fails instead of silently losing precision outside the safe range (ADR 0003)', () => {
    expect(() => clpToJson(clp(BigInt(Number.MAX_SAFE_INTEGER) + 1n))).toThrow(RangeError);
    expect(() => clpToJson(clp(-BigInt(Number.MAX_SAFE_INTEGER) - 1n))).toThrow(RangeError);
  });
});
