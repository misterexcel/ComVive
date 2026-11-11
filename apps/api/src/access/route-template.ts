const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Canonical uuid: 36 characters, lowercase, with hyphens (ADR 0009, decision 3, step 2). */
export function isCanonicalUuid(value: string): boolean {
  return CANONICAL_UUID.test(value);
}

/** Path segments without empty ones: `/a/:b` is `['a', ':b']`. */
export function pathSegments(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '');
}

/** Route parameter names in the order of the path (`:unitId` is `unitId`). */
export function routeParamNames(path: string): string[] {
  return pathSegments(path)
    .filter((segment) => segment.startsWith(':'))
    .map((segment) => segment.slice(1));
}

/**
 * Route template in the notation of OpenAPI and the documentation, `/communities/{communityId}`
 * (ADR 0009, decision 4, menor 3). It is what gets stored as "the endpoint" (audit, idempotency),
 * never the concrete path.
 */
export function toPathTemplate(path: string): string {
  const segments = pathSegments(path).map((segment) =>
    segment.startsWith(':') ? `{${segment.slice(1)}}` : segment,
  );
  return `/${segments.join('/')}`;
}

/** `/platform` and everything under `/platform/`, read by segments. */
export function isPlatformPath(path: string): boolean {
  return pathSegments(path)[0] === 'platform';
}

/** `/gateway/...`, read by segments. */
export function isGatewayPath(path: string): boolean {
  return pathSegments(path)[0] === 'gateway';
}
