import { AsyncLocalStorage } from 'node:async_hooks';

import type { CommunityRole, PlatformRole } from './policy-tables/roles.js';

/** Actor of the code that runs with a community taken from a record (`runInCommunity`). */
export type SystemActor = { readonly type: 'system' };
export type PlatformActor = {
  readonly type: 'platform';
  readonly personId: string;
  readonly platformRole: PlatformRole;
};
export type MemberActor = {
  readonly type: 'member';
  readonly personId: string;
  readonly roles: readonly CommunityRole[];
};
export type TenantActor = MemberActor | SystemActor | PlatformActor;

/** Community, person and current roles of the request (ADR 0002, barrier 1). */
export interface TenantContext {
  readonly communityId: string;
  readonly actor: TenantActor;
}

/** Person of an `identity` route: session without a community ("Mis comunidades"). */
export interface IdentityContext {
  readonly personId: string;
}

/** Platform person identified by the guard on a `platform` route (audit, ADR 0006). */
export interface PlatformPrincipal {
  readonly personId: string;
  readonly platformRoles: readonly PlatformRole[];
  /** Role that holds the permission of the route, once the guard checked it (step 3a). */
  readonly platformRole?: PlatformRole;
}

/**
 * Per-request container (ADR 0009, decision 3, M-2). A new one is opened for every request by
 * {@link requestContextMiddleware}; the guard only fills it, once.
 */
export interface RequestContainer {
  tenant: TenantContext | undefined;
  identity: IdentityContext | undefined;
  platform: PlatformPrincipal | undefined;
  /** Set by whoever wrote the platform access row, so no one writes a second one (R3-m-2). */
  platformAccessAudited: boolean;
}

const storage = new AsyncLocalStorage<RequestContainer>();

function emptyContainer(): RequestContainer {
  return {
    tenant: undefined,
    identity: undefined,
    platform: undefined,
    platformAccessAudited: false,
  };
}

/** Runs `fn` inside a new empty container. Used by the middleware and by tests. */
export function openRequestContainer<T>(fn: () => T): T {
  return storage.run(emptyContainer(), fn);
}

/**
 * Express middleware registered by `createApp` right before the NestJS routes, after the body
 * parsers (R2-m-2): `body-parser` may call `next()` from stream events outside the context.
 */
export function requestContextMiddleware(_req: unknown, _res: unknown, next: () => void): void {
  storage.run(emptyContainer(), next);
}

export function currentRequestContainer(): RequestContainer | undefined {
  return storage.getStore();
}

function requireContainer(): RequestContainer {
  const container = storage.getStore();
  if (container === undefined) {
    throw new Error('Access context used outside a request container');
  }
  return container;
}

function requireEmpty(container: RequestContainer): void {
  if (
    container.tenant !== undefined ||
    container.identity !== undefined ||
    container.platform !== undefined
  ) {
    throw new Error('The request container is already filled');
  }
}

export function fillTenantContext(tenant: TenantContext): void {
  const container = requireContainer();
  requireEmpty(container);
  container.tenant = tenant;
}

export function fillIdentityContext(identity: IdentityContext): void {
  const container = requireContainer();
  requireEmpty(container);
  container.identity = identity;
}

/** Platform routes: the platform person and, under `/platform/communities/:communityId`, the community. */
export function fillPlatformContext(principal: PlatformPrincipal, tenant?: TenantContext): void {
  const container = requireContainer();
  requireEmpty(container);
  container.platform = principal;
  container.tenant = tenant;
}

/**
 * The tenant context of the current request. The per-community Prisma client (ADR 0002) reads
 * it and fails outside a container or with an empty one.
 */
export function requireTenantContext(): TenantContext {
  const container = requireContainer();
  if (container.tenant === undefined) {
    throw new Error('The request container has no tenant context');
  }
  return container.tenant;
}

/**
 * The only way to run code with a community taken from a record or just created, not from the
 * route (ADR 0009, decision 3; R2-M-2): Support resolving a Webpay attempt, community creation
 * and worker jobs. Never with a `member` actor. Opens a nested container; it does not check that
 * the community exists, so it reveals nothing the caller did not know from its record.
 */
export function runInCommunity<T>(
  communityId: string,
  actor: SystemActor | PlatformActor,
  fn: () => T,
): T {
  const container = emptyContainer();
  container.tenant = { communityId, actor };
  return storage.run(container, fn);
}
