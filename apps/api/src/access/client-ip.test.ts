import { describe, expect, it } from 'vitest';

import { truncateClientIp } from './client-ip.js';

// ADR 0009, test 16 (ADR-0009-S8): /24 in IPv4 and /48 in IPv6, mapped IPv4 normalized first.
describe('truncateClientIp', () => {
  it.each([
    ['1.2.3.4', '1.2.3.0/24'],
    ['10.0.0.255', '10.0.0.0/24'],
    ['::ffff:1.2.3.4', '1.2.3.0/24'],
    ['::FFFF:1.2.3.4', '1.2.3.0/24'],
    ['2001:db8:1234:5678::1', '2001:db8:1234::/48'],
    ['2001:0db8:0001:ffff:0:0:0:1', '2001:db8:1::/48'],
    ['::1', '::/48'],
    ['fe80::1%eth0', 'fe80::/48'],
  ])('truncates %s to %s', (ip, expected) => {
    expect(truncateClientIp(ip)).toBe(expected);
  });

  it.each([undefined, '', 'not-an-ip', '1.2.3'])('returns null for %j', (ip) => {
    expect(truncateClientIp(ip)).toBeNull();
  });
});
