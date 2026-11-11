import { isIPv4, isIPv6 } from 'node:net';

const MAPPED_IPV4 = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;

/**
 * Truncates the client IP for the anonymous platform audit row (ADR 0009, decision 3; D41;
 * ADR-0009-S8): /24 in IPv4 and /48 in IPv6, enough to see a probe by network without
 * identifying a device (Ley 21.719). A mapped IPv4 (`::ffff:a.b.c.d`) is normalized first.
 * Returns null when there is no usable IP.
 */
export function truncateClientIp(ip: string | undefined): string | null {
  if (ip === undefined) {
    return null;
  }
  const withoutZone = ip.split('%')[0] ?? '';
  const mapped = MAPPED_IPV4.exec(withoutZone);
  const candidate = mapped?.[1] ?? withoutZone;

  if (isIPv4(candidate)) {
    const [a, b, c] = candidate.split('.');
    return `${a}.${b}.${c}.0/24`;
  }
  if (isIPv6(candidate)) {
    const groups = expandIPv6(candidate).slice(0, 3);
    return `${compressIPv6([...groups, 0, 0, 0, 0, 0])}/48`;
  }
  return null;
}

/** Eight 16-bit groups of a valid IPv6 address (without an embedded IPv4 tail). */
function expandIPv6(ip: string): number[] {
  const [head = '', tail] = ip.split('::');
  const parse = (part: string): number[] =>
    part === '' ? [] : part.split(':').map((group) => Number.parseInt(group, 16));
  const left = parse(head);
  const right = tail === undefined ? [] : parse(tail);
  const zeros = new Array<number>(8 - left.length - right.length).fill(0);
  return [...left, ...zeros, ...right];
}

/** RFC 5952 text form: lowercase, no leading zeros, longest run of zero groups as `::`. */
function compressIPv6(groups: number[]): string {
  let bestStart = -1;
  let bestLength = 0;
  for (let start = 0; start < groups.length;) {
    if (groups[start] !== 0) {
      start += 1;
      continue;
    }
    let end = start;
    while (end < groups.length && groups[end] === 0) {
      end += 1;
    }
    if (end - start > bestLength && end - start > 1) {
      bestStart = start;
      bestLength = end - start;
    }
    start = end;
  }
  const hex = groups.map((group) => group.toString(16));
  if (bestStart === -1) {
    return hex.join(':');
  }
  const left = hex.slice(0, bestStart).join(':');
  const right = hex.slice(bestStart + bestLength).join(':');
  return `${left}::${right}`;
}
