/**
 * Amount in Chilean pesos, always an integer (CLAUDE.md, rule 1).
 *
 * Money is computed with `bigint` end to end (ADR 0004, docs/arquitectura.md) and converted to a
 * JSON `number` only at the API boundary (ADR 0003, decision 2). The brand keeps arbitrary
 * bigints (weights, scaled rates) from being mixed up with money by accident.
 */
export type Clp = bigint & { readonly __brand: 'Clp' };

/** Marks an integer number of pesos as a CLP amount. Sign is allowed (balances can be negative). */
export function clp(value: bigint): Clp {
  return value as Clp;
}

/**
 * Converts a JSON number into a CLP amount. Only safe integers are accepted, so a decimal or an
 * imprecise value can never become money.
 */
export function clpFromJson(value: number): Clp {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`CLP amount must be a safe integer, got ${String(value)}`);
  }
  return clp(BigInt(value));
}

/**
 * Converts a CLP amount into a JSON number. Fails instead of silently losing precision when the
 * value is outside the safe integer range (ADR 0003, decision 2).
 */
export function clpToJson(value: Clp): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`CLP amount ${value.toString()} is outside the safe integer range`);
  }
  return Number(value);
}
