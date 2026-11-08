import { describe, expect, it } from 'vitest';

import { DEFAULT_PORT, parsePort } from './port.js';

describe('parsePort', () => {
  it('falls back to the default port when PORT is not set', () => {
    expect(parsePort(undefined)).toBe(DEFAULT_PORT);
  });

  it.each([
    ['1', 1],
    ['3000', 3000],
    ['8080', 8080],
    ['65535', 65_535],
    ['03000', 3000],
  ])('accepts %s', (raw, expected) => {
    expect(parsePort(raw)).toBe(expected);
  });

  it.each(['', ' ', '0', '65536', '-1', '3000.5', '1e3', '0x1F', ' 3000', '3000 ', 'abc', 'NaN'])(
    'rejects %j',
    (raw) => {
      expect(() => parsePort(raw)).toThrow(RangeError);
    },
  );
});
