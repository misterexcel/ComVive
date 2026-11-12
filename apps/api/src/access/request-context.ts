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
  /** Platform access audit of the request, shared with nested `runInCommunity` containers. */
  readonly audit: PlatformAuditState;
}

/** One per request, shared by the containers nested in it (security m-6). */
export interface PlatformAuditState {
  /** Set by whoever wrote the platform access row, so no one writes a second one (R3-m-2). */
  audited: boolean;
  /**
   * Community a visible platform path resource reported for the audit row only (D46, D65);
   * never part of the TenantContext.
   */
  communityId: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContainer>();

function emptyContainer(): RequestContainer {
  return {
    tenant: undefined,
    identity: undefined,
    platform: undefined,
    audit: { audited: false, communityId: undefined },
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
  // Tied to the request container, if any: same platform person and same audit state, so a
  // row written inside (recordPlatformAction, D45) marks the request (security m-6).
  const parent = storage.getStore();
  const container: RequestContainer = {
    tenant: { communityId, actor },
    identity: undefined,
    platform: parent?.platform,
    audit: parent?.audit ?? { audited: false, communityId: undefined },
  };
  return storage.run(container, fn);
}

/** Whether the platform access row of the current request was already written. */
export function isPlatformAccessAudited(): boolean {
  return storage.getStore()?.audit.audited === true;
}

/** Marks the platform access row of the current request as written (R3-m-2; D45). */
export function markPlatformAccessAudited(): void {
  const container = storage.getStore();
  if (container !== undefined) {
    container.audit.audited = true;
  }
}

/** Community of a visible platform path resource, for the audit row only (D46, D65). */
export function setPlatformAuditCommunity(communityId: string): void {
  requireContainer().audit.communityId = communityId;
}
