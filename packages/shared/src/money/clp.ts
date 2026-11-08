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
 * Converts a JSON number into a CLP amount for any amount field of the API contract. Only safe
 * integers in `0..Number.MAX_SAFE_INTEGER` are accepted (ADR 0003, decision 2), so a decimal, an
 * imprecise value or a negative amount can never become money. `-0` is read as `0`.
 *
 * Fields that may be negative use {@link signedClpFromJson} instead.
 */
export function clpFromJson(value: number): Clp {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `CLP amount must be a safe integer between 0 and ${String(Number.MAX_SAFE_INTEGER)}, got ${String(value)}`,
    );
  }
  return clp(BigInt(value));
}

/**
 * Converts a JSON number into a CLP amount that may be negative. Only for the closed list of signed
 * fields of ADR 0003, decision 2 (`cashBalanceClp`, `reserveFundBalanceClp`, `differenceClp`,
 * `balanceClp`); adding a field to that list requires updating the ADR, `docs/arquitectura.md` §1
 * and the contract test. Accepts safe integers in
 * `-Number.MAX_SAFE_INTEGER..Number.MAX_SAFE_INTEGER`; `-0` is read as `0`.
 */
export function signedClpFromJson(value: number): Clp {
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
