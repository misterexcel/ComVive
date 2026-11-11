import type { AccessPolicyKind } from './access-policy.js';

export type AppKind = 'api' | 'worker';

/** A route with a policy other than `community`, and the ADR that authorizes it. */
export interface RouteException {
  readonly app: AppKind;
  readonly method: string;
  /** Normalized template, `/communities/{communityId}/...` (decision 4, menor 3). */
  readonly pathTemplate: string;
  readonly policy: Exclude<AccessPolicyKind, 'community'>;
  /** ADR and decision that authorize it, e.g. `'ADR 0007, decisión 4'`. */
  readonly authorizedBy: string;
}

/**
 * Closed, versioned list of every route with a policy other than `community`, per application
 * (ADR 0009, decision 4). Compared with the route inventory at startup and in CI; each entry must
 * cite an approved or accepted ADR (checked in CI). Under code owner review (D36, D40): nobody adds
 * an exception without an ADR, and a new `public-technical` route requires changing ADR 0009.
 */
export const ROUTE_EXCEPTIONS: readonly RouteException[] = [
  {
    app: 'api',
    method: 'GET',
    pathTemplate: '/health',
    policy: 'public-technical',
    authorizedBy: 'ADR 0009, decisión 5',
  },
];
