/**
 * Reads `TRUST_PROXY_HOPS`, the number of Google proxies in front of the API, counted from the
 * right of `X-Forwarded-For` (ADR 0009, decision 7; ADR-0009-S8). Express uses it as
 * `trust proxy`, so it decides `req.ip` for the whole API: the anonymous platform audit row and
 * the per-IP login limit.
 *
 * Mandatory and validated at startup, like `PORT`. Never `true`, which would let the client pick
 * its IP with an invented `X-Forwarded-For` entry. `0` (no proxy) is only valid without
 * `K_SERVICE`, which Cloud Run always sets: locally and in CI.
 */
export function parseTrustProxyHops(raw: string | undefined, kService: string | undefined): number {
  if (raw === undefined || !/^[0-9]+$/.test(raw)) {
    throw new RangeError(
      `TRUST_PROXY_HOPS must be a non-negative integer number of proxy hops, got ${raw === undefined ? 'nothing' : `"${raw}"`}`,
    );
  }
  const hops = Number(raw);
  if (hops === 0 && kService !== undefined) {
    throw new RangeError('TRUST_PROXY_HOPS must be greater than 0 on Cloud Run (K_SERVICE is set)');
  }
  return hops;
}
