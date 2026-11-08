// Gold tests (CLAUDE.md, rule 2). Every expected amount is copied verbatim from
// docs/qa/comunidades-simuladas.md, where it is calculated by hand step by step. Each test carries
// its GOLD ID so it can be traced back to the document. Never change an expected value to make a
// test pass: if the code and the document disagree, report it.
import { describe, expect, it } from 'vitest';

import { clp, type Clp } from './clp.js';
import { allocateLargestRemainder, type AllocationShare } from './largest-remainder.js';

interface GoldRow {
  readonly id: string;
  readonly unit: string;
  readonly expected: bigint;
}

/** Builds the shares from `[sortOrder, weight]` pairs, in the order of the document table. */
const toShares = (rows: readonly (readonly [number, bigint])[]): AllocationShare[] =>
  rows.map(([sortOrder, weight]) => ({ sortOrder, weight }));

/** Charge at `index`, failing loudly instead of returning `undefined`. */
const at = (charges: readonly Clp[], index: number): bigint => {
  const charge = charges[index];
  if (charge === undefined) {
    throw new Error(`Missing charge at position ${String(index)}`);
  }
  return charge;
};

const sum = (values: readonly bigint[]): bigint => values.reduce((acc, value) => acc + value, 0n);

// Reserve fund totals. Rule D-3 (ceiling to the peso, F = (O × pb + 9.999) div 10.000) has no code
// yet, so the totals are fixed here as constants copied from docs/qa/comunidades-simuladas.md,
// "Total del fondo de reserva: techo al peso". When D-3 is implemented, its own tests must produce
// these same values.

/** Comunidad C (CA-3): (1.175.778 × 500 + 9.999) div 10.000 = 587.898.999 div 10.000 = $58.789. */
const C_RESERVE_FUND_TOTAL = clp(58_789n);
/** Comunidad D (CA-4): (876.543 × 500 + 9.999) div 10.000 = 438.281.499 div 10.000 = $43.828. */
const D_RESERVE_FUND_TOTAL = clp(43_828n);

describe('gold tests (docs/qa/comunidades-simuladas.md)', () => {
  it('the fixed reserve fund totals match the D-3 formula worked out in docs/qa', () => {
    // Only checks the arithmetic of the document; it does not replace the D-3 implementation.
    expect((1_175_778n * 500n + 9_999n) / 10_000n).toBe(C_RESERVE_FUND_TOTAL);
    expect((876_543n * 500n + 9_999n) / 10_000n).toBe(D_RESERVE_FUND_TOTAL);
  });

  describe('Comunidad B · Condominio Las Brisas ($100.000, equal parts, tie)', () => {
    // Casa 1..3, sort_order 1..3, relative weight 1 each.
    const shares = toShares([
      [1, 1n],
      [2, 1n],
      [3, 1n],
    ]);
    const charges = allocateLargestRemainder(clp(100_000n), shares);

    // 100.000 / 3 = 33.333,33 each; integer parts add up to 99.999; the missing peso goes to the
    // lowest sort_order among the tied remainders (Casa 1).
    const rows: GoldRow[] = [
      { id: 'GOLD-B-01', unit: 'Casa 1', expected: 33_334n },
      { id: 'GOLD-B-02', unit: 'Casa 2', expected: 33_333n },
      { id: 'GOLD-B-03', unit: 'Casa 3', expected: 33_333n },
    ];

    it.each(rows.map((row, index) => ({ ...row, index })))('$id · $unit', ({ index, expected }) => {
      expect(at(charges, index)).toBe(expected);
    });

    it('the charges add up to $100.000', () => {
      expect(sum(charges)).toBe(100_000n);
    });
  });

  describe('Comunidad C · Edificio Mirador ($1.234.567 in one single account)', () => {
    // Depto 11, 12, 21, 22, 31 with sort_order 1..5 and stored aliquots (10^-6 scale).
    const shares = toShares([
      [1, 185_000n],
      [2, 195_000n],
      [3, 200_000n],
      [4, 210_000n],
      [5, 210_000n],
    ]);
    const charges = allocateLargestRemainder(clp(1_234_567n), shares);

    // Integer parts add up to 1.234.565; the 2 missing pesos go to the remainders 0,895 (Depto 11)
    // and 0,565 (Depto 12).
    const rows: GoldRow[] = [
      { id: 'GOLD-C-01', unit: 'Depto 11', expected: 228_395n },
      { id: 'GOLD-C-02', unit: 'Depto 12', expected: 240_741n },
      { id: 'GOLD-C-03', unit: 'Depto 21', expected: 246_913n },
      { id: 'GOLD-C-04', unit: 'Depto 22', expected: 259_259n },
      { id: 'GOLD-C-05', unit: 'Depto 31', expected: 259_259n },
    ];

    it.each(rows.map((row, index) => ({ ...row, index })))('$id · $unit', ({ index, expected }) => {
      expect(at(charges, index)).toBe(expected);
    });

    it('the charges add up to $1.234.567', () => {
      expect(sum(charges)).toBe(1_234_567n);
    });
  });

  describe('Comunidad C · emisión por cuenta (CA-3)', () => {
    const shares = toShares([
      [1, 185_000n],
      [2, 195_000n],
      [3, 200_000n],
      [4, 210_000n],
      [5, 210_000n],
    ]);
    const ordinary = allocateLargestRemainder(clp(1_175_778n), shares);
    const fund = allocateLargestRemainder(C_RESERVE_FUND_TOTAL, shares);
    const singleAccount = allocateLargestRemainder(clp(1_234_567n), shares);

    it('Paso 1 · ordinario ($1.175.778): 3 pesos to the remainders 930.000, 710.000 and 600.000', () => {
      expect(ordinary).toEqual([217_519n, 229_277n, 235_156n, 246_913n, 246_913n]);
      expect(sum(ordinary)).toBe(1_175_778n);
    });

    it('Paso 2 · fondo ($58.789): 4 pesos; Depto 22 wins the 690.000 tie against Depto 31', () => {
      expect(fund).toEqual([10_876n, 11_464n, 11_758n, 12_346n, 12_345n]);
      expect(sum(fund)).toBe(58_789n);
    });

    // Paso 3: total per unit = ordinary + fund.
    const rows: (GoldRow & { readonly diffWithGoldC: bigint })[] = [
      { id: 'GOLD-CE-01', unit: 'Depto 11', expected: 228_395n, diffWithGoldC: 0n },
      { id: 'GOLD-CE-02', unit: 'Depto 12', expected: 240_741n, diffWithGoldC: 0n },
      { id: 'GOLD-CE-03', unit: 'Depto 21', expected: 246_914n, diffWithGoldC: 1n },
      { id: 'GOLD-CE-04', unit: 'Depto 22', expected: 259_259n, diffWithGoldC: 0n },
      { id: 'GOLD-CE-05', unit: 'Depto 31', expected: 259_258n, diffWithGoldC: -1n },
    ];

    it.each(rows.map((row, index) => ({ ...row, index })))(
      '$id · $unit',
      ({ index, expected, diffWithGoldC }) => {
        const total = at(ordinary, index) + at(fund, index);
        expect(total).toBe(expected);
        // Differs from GOLD-C (one single account of $1.234.567) only in Depto 21 (+1) and
        // Depto 31 (−1): this catches an implementation that rounds the combined total.
        expect(total - at(singleAccount, index)).toBe(diffWithGoldC);
      },
    );

    it('the totals add up to 1.175.778 + 58.789 = $1.234.567', () => {
      expect(sum(ordinary) + sum(fund)).toBe(1_234_567n);
    });
  });

  describe('Comunidad D · Edificio Alto Quillay (ordinario $876.543 + fondo $43.828)', () => {
    // Depto 1..4, sort_order 1..4, stored aliquots 187.345 + 243.218 + 256.789 + 312.648 = 1.000.000.
    const shares = toShares([
      [1, 187_345n],
      [2, 243_218n],
      [3, 256_789n],
      [4, 312_648n],
    ]);
    const ordinary = allocateLargestRemainder(clp(876_543n), shares);
    const fund = allocateLargestRemainder(D_RESERVE_FUND_TOTAL, shares);

    it('Comunidad D, Paso 1 · ordinario: 2 pesos to the remainders 0,948335 and 0,600427', () => {
      expect(ordinary).toEqual([164_216n, 213_191n, 225_087n, 274_049n]);
      expect(sum(ordinary)).toBe(876_543n);
    });

    it('Comunidad D, Paso 2 · fondo (CA-4): 3 pesos to 0,956660, 0,758504 and 0,736544', () => {
      expect(fund).toEqual([8_211n, 10_660n, 11_254n, 13_703n]);
      expect(sum(fund)).toBe(43_828n);
    });

    // Paso 3: total per unit = ordinary + fund.
    const rows: GoldRow[] = [
      { id: 'GOLD-D-01', unit: 'Depto 1', expected: 172_427n },
      { id: 'GOLD-D-02', unit: 'Depto 2', expected: 223_851n },
      { id: 'GOLD-D-03', unit: 'Depto 3', expected: 236_341n },
      { id: 'GOLD-D-04', unit: 'Depto 4', expected: 287_752n },
    ];

    it.each(rows.map((row, index) => ({ ...row, index })))('$id · $unit', ({ index, expected }) => {
      expect(at(ordinary, index) + at(fund, index)).toBe(expected);
    });

    it('the totals add up to 876.543 + 43.828 = $920.371', () => {
      expect(sum(ordinary) + sum(fund)).toBe(920_371n);
    });
  });
});
