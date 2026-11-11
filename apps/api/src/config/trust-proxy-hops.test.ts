import { describe, expect, it } from 'vitest';

import { parseTrustProxyHops } from './trust-proxy-hops.js';

// ADR 0009, decision 7 and test 16 (R2-M-3, R3-m-5; ADR-0009-S8).
describe('parseTrustProxyHops', () => {
  it.each([
    ['1', 1],
    ['2', 2],
  ])('accepts %s hops on Cloud Run', (raw, expected) => {
    expect(parseTrustProxyHops(raw, 'comvive-api')).toBe(expected);
  });

  it('accepts 0 only outside Cloud Run (local and CI, no proxy in front)', () => {
    expect(parseTrustProxyHops('0', undefined)).toBe(0);
  });

  it('rejects 0 on Cloud Run, which always sets K_SERVICE', () => {
    expect(() => parseTrustProxyHops('0', 'comvive-api')).toThrow(RangeError);
  });

  it('rejects a missing variable, both locally and on Cloud Run', () => {
    expect(() => parseTrustProxyHops(undefined, undefined)).toThrow(RangeError);
    expect(() => parseTrustProxyHops(undefined, 'comvive-api')).toThrow(RangeError);
  });

  it.each(['true', 'false', '', ' ', '1.5', '-1', '1e1', '0x1', ' 1', '1 ', 'abc'])(
    'rejects %j',
    (raw) => {
      expect(() => parseTrustProxyHops(raw, undefined)).toThrow(RangeError);
    },
  );
});
