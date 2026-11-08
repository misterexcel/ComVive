import { clp, type Clp } from './clp.js';

/** One participant of an allocation: its integer weight and its tie-break order. */
export interface AllocationShare {
  /** Non-negative integer weight (e.g. `aliquot_e6` or `share_weight`). */
  readonly weight: bigint;
  /** Safe integer order of the unit inside the community (`UNIT.sort_order`); unique per call. */
  readonly sortOrder: number;
}

/**
 * Splits `total` among `shares` with the largest remainder method, using integer arithmetic only
 * (docs/qa/comunidades-simuladas.md, ADR 0004 decision 7):
 *
 * 1. Each share gets `total * weight div weightSum`.
 * 2. The missing pesos go, one each, to the largest remainders `total * weight mod weightSum`.
 * 3. Equal remainders are broken by the lowest `sortOrder`.
 *
 * The result has the same order as `shares` and always adds up exactly to `total`.
 *
 * The business ceiling of rule B-6 ($9.999.999.999, 422 `AMOUNT_TOO_LARGE` in
 * docs/specs/gasto-comun.md) is not checked here: the caller validates it before allocating. This
 * function only rejects inputs that would make the result undefined (negative total, negative
 * weights, all weights zero, no shares, or `sortOrder` values that are not unique safe integers).
 *
 * @throws {RangeError} When any of those inputs is invalid.
 */
export function allocateLargestRemainder(total: Clp, shares: readonly AllocationShare[]): Clp[] {
  if (total < 0n) {
    throw new RangeError('Total to allocate must not be negative');
  }
  if (shares.length === 0) {
    throw new RangeError('At least one share is required');
  }
  if (shares.some((share) => share.weight < 0n)) {
    throw new RangeError('Weights must not be negative');
  }
  // NaN, Infinity or a decimal would make the tie-break comparator inconsistent.
  if (shares.some((share) => !Number.isSafeInteger(share.sortOrder))) {
    throw new RangeError('sortOrder must be a safe integer');
  }
  if (new Set(shares.map((share) => share.sortOrder)).size !== shares.length) {
    throw new RangeError('sortOrder must be unique among shares');
  }

  const weightSum = shares.reduce((acc, share) => acc + share.weight, 0n);
  if (weightSum === 0n) {
    throw new RangeError('At least one weight must be greater than zero');
  }

  const charges = shares.map((share) => (total * share.weight) / weightSum);
  const allocated = charges.reduce((acc, charge) => acc + charge, 0n);

  const byRemainder = shares
    .map((share, index) => ({
      index,
      remainder: (total * share.weight) % weightSum,
      sortOrder: share.sortOrder,
    }))
    .sort((a, b) => {
      if (a.remainder !== b.remainder) {
        return a.remainder > b.remainder ? -1 : 1;
      }
      return a.sortOrder < b.sortOrder ? -1 : 1;
    });

  // Missing pesos, counted in bigint: always fewer than the number of shares with weight > 0.
  let missing = total - allocated;
  const getsExtraPeso = new Set<number>();
  for (const { index } of byRemainder) {
    if (missing === 0n) {
      break;
    }
    getsExtraPeso.add(index);
    missing -= 1n;
  }

  return charges.map((charge, index) => clp(getsExtraPeso.has(index) ? charge + 1n : charge));
}
