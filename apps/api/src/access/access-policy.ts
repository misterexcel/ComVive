import type { CommunityPermission, CommunityResource } from './policy-tables/community.js';
import type { PlatformPathResource, PlatformPermission } from './policy-tables/platform.js';

export type { CommunityPermission, CommunityResource, PlatformPathResource, PlatformPermission };

/** Gateways a `@GatewayRoute` may name (ADR 0007, decision 4). */
export type GatewayName = 'webpay-return';

/** One and only one access policy per route (ADR 0009, decisions 1 and 2). */
export type AccessPolicy =
  | {
      readonly kind: 'community';
      readonly resource: CommunityResource;
      readonly permission?: CommunityPermission;
      readonly pathResources?: Readonly<Record<string, CommunityResource>>;
    }
  | { readonly kind: 'identity' }
  | { readonly kind: 'auth-entry' }
  | { readonly kind: 'public-technical' }
  | { readonly kind: 'gateway'; readonly gateway: GatewayName }
  | {
      readonly kind: 'platform';
      readonly permission: PlatformPermission;
      readonly pathResources?: Readonly<Record<string, PlatformPathResource>>;
    }
  | { readonly kind: 'internal-job' };

export type AccessPolicyKind = AccessPolicy['kind'];

// Not exported: only the decorators of this file write it (ADR 0009, decision 4).
const POLICY_METADATA = Symbol('comvive:access-policies');

/**
 * Method decorator that appends its policy to the list of the method instead of replacing it,
 * so two decorators on one method are detected (with `SetMetadata` the second would erase the
 * first). On a class it throws while the module loads: a class policy would let a new method
 * inherit an exception without anyone seeing it.
 */
function policyDecorator(name: string, policy: AccessPolicy): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (propertyKey === undefined || descriptor === undefined) {
      const className = typeof target === 'function' ? target.name : String(target);
      throw new TypeError(`@${name}() applies to methods only, not to the class ${className}`);
    }
    const handler: unknown = descriptor.value;
    if (typeof handler !== 'function') {
      throw new TypeError(`@${name}() applies to methods only (${String(propertyKey)})`);
    }
    const current = readAccessPolicies(handler);
    Reflect.defineMetadata(POLICY_METADATA, [...current, policy], handler);
  };
}

/** Policies declared on a route handler, in declaration order. */
export function readAccessPolicies(handler: unknown): readonly AccessPolicy[] {
  if (typeof handler !== 'function') {
    return [];
  }
  const policies: unknown = Reflect.getOwnMetadata(POLICY_METADATA, handler);
  return Array.isArray(policies) ? (policies as AccessPolicy[]) : [];
}

/**
 * The normal policy: session, current membership in the community of the route, visibility of the
 * resource type and of each path resource, and the permission if it is an action (M-1, D39).
 * `permission` is mandatory for every method other than GET and HEAD (checked by the inventory).
 */
export function CommunityRoute(options: {
  resource: CommunityResource;
  permission?: CommunityPermission;
  pathResources?: Record<string, CommunityResource>;
}): MethodDecorator {
  return policyDecorator('CommunityRoute', { kind: 'community', ...options });
}

/** Community session without membership ("Mis comunidades"); only under `/me/` (ADR-0009-S5). */
export function IdentityRoute(): MethodDecorator {
  return policyDecorator('IdentityRoute', { kind: 'identity' });
}

/** Login, refresh and logout, without session; only under `/auth/` (D42; ADR-0009-S5). */
export function AuthEntryRoute(): MethodDecorator {
  return policyDecorator('AuthEntryRoute', { kind: 'auth-entry' });
}

/** Closed list of decision 5 of ADR 0009: only `GET /health`. */
export function PublicTechnicalRoute(): MethodDecorator {
  return policyDecorator('PublicTechnicalRoute', { kind: 'public-technical' });
}

/** Third-party call without a ComVive session (Webpay return, ADR 0007); only under `/gateway/`. */
export function GatewayRoute(gateway: GatewayName): MethodDecorator {
  return policyDecorator('GatewayRoute', { kind: 'gateway', gateway });
}

/** ComVive team routes (ADR 0006); only under `/platform/`. */
export function PlatformRoute(options: {
  permission: PlatformPermission;
  pathResources?: Record<string, PlatformPathResource>;
}): MethodDecorator {
  return policyDecorator('PlatformRoute', { kind: 'platform', ...options });
}

/** Cloud Scheduler calls to the worker (ADR 0008, decision 2); only under `/internal/jobs/`. */
export function InternalJobRoute(): MethodDecorator {
  return policyDecorator('InternalJobRoute', { kind: 'internal-job' });
}
