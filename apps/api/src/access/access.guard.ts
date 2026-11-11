import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import {
  AccessDeniedException,
  GatewayRejectedException,
  PlatformAuditFailedException,
  PlatformAuditUnavailableException,
  type NeutralStatus,
} from './access-errors.js';
import { readAccessPolicies, type AccessPolicy } from './access-policy.js';
import { hasDeferredBodyError } from './body-parsers.js';
import { ACCESS_POLICY_TABLES, type AccessPolicyTables } from './policy-tables/index.js';
import type { CommunityRole, PlatformRole } from './policy-tables/roles.js';
import { PlatformAccessAudit, outcomeOf } from './platform-access-audit.js';
import {
  ACCESS_EVENT_LOG,
  CLOCK,
  COMMUNITY_DIRECTORY,
  GATEWAY_VERIFIERS,
  INTERNAL_CALLER_VERIFIER,
  MEMBERSHIP_READER,
  PATH_RESOURCE_VISIBILITIES,
  PLATFORM_GRANT_READER,
  SESSION_VERIFIER,
  type AccessEventLog,
  type Clock,
  type CommunityDirectory,
  type GatewayVerifier,
  type InternalCallerVerifier,
  type MembershipReader,
  type PathResourceCheck,
  type PathResourceVisibility,
  type PlatformGrantReader,
  type SessionVerifier,
  type VerifiedSession,
} from './ports.js';
import {
  fillIdentityContext,
  fillPlatformContext,
  fillTenantContext,
  setPlatformAuditCommunity,
  type PlatformPrincipal,
  type TenantContext,
} from './request-context.js';
import {
  hasRouteCommunity,
  isCanonicalUuid,
  routeParamNames,
  toPathTemplate,
} from './route-template.js';

type CommunityPolicy = Extract<AccessPolicy, { kind: 'community' }>;
type GatewayPolicy = Extract<AccessPolicy, { kind: 'gateway' }>;
type PlatformPolicy = Extract<AccessPolicy, { kind: 'platform' }>;

const deny = (status: NeutralStatus): AccessDeniedException => new AccessDeniedException(status);

/** Raw Express path of the matched route (`/communities/:communityId/...`). */
function matchedRoutePath(request: Request): string | undefined {
  const route = (request as { route?: { path?: unknown } }).route;
  return typeof route?.path === 'string' ? route.path : undefined;
}

/**
 * The single global guard (ADR 0009, decisions 1 and 3), registered with `APP_GUARD` in
 * AccessModule. Every route declares one and only one policy; without it, or with more than one,
 * it answers 404 without running the method. Steps in a fixed order, first rejection wins:
 * session (401) → context (404) → resource visibility, path resources (404) and permission (403).
 */
@Injectable()
export class AccessGuard implements CanActivate {
  private readonly visibilityByResource: ReadonlyMap<string, PathResourceVisibility>;

  constructor(
    @Inject(SESSION_VERIFIER) private readonly sessions: SessionVerifier,
    @Inject(MEMBERSHIP_READER) private readonly memberships: MembershipReader,
    @Inject(PATH_RESOURCE_VISIBILITIES) pathResources: readonly PathResourceVisibility[],
    @Inject(PLATFORM_GRANT_READER) private readonly grants: PlatformGrantReader,
    @Inject(COMMUNITY_DIRECTORY) private readonly communities: CommunityDirectory,
    @Inject(INTERNAL_CALLER_VERIFIER) private readonly internalCaller: InternalCallerVerifier,
    @Inject(GATEWAY_VERIFIERS) private readonly gateways: readonly GatewayVerifier[],
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACCESS_EVENT_LOG) private readonly events: AccessEventLog,
    @Inject(ACCESS_POLICY_TABLES) private readonly tables: AccessPolicyTables,
    private readonly audit: PlatformAccessAudit,
  ) {
    this.visibilityByResource = new Map(pathResources.map((port) => [port.resource, port]));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      throw deny(404);
    }
    const request = context.switchToHttp().getRequest<Request>();
    const routePath = matchedRoutePath(request);
    const policies = readAccessPolicies(context.getHandler());
    const policy = policies[0];

    if (policies.length !== 1 || policy === undefined || routePath === undefined) {
      this.events.programmingError(
        `Route ${request.method} ${routePath === undefined ? '(unknown)' : toPathTemplate(routePath)} ` +
          `(${context.getClass().name}.${context.getHandler().name}) has ${policies.length} access ` +
          'policies instead of one; denied with 404 (ADR 0009, decision 1)',
      );
      throw deny(404);
    }

    switch (policy.kind) {
      case 'community':
        await this.checkCommunity(request, routePath, policy);
        return true;
      case 'identity':
        await this.checkIdentity(request);
        return true;
      case 'auth-entry':
      case 'public-technical':
        // No session required and Authorization is not read (D42).
        return true;
      case 'gateway':
        await this.checkGateway(request, policy);
        return true;
      case 'platform':
        await this.checkPlatform(request, routePath, policy);
        return true;
      case 'internal-job':
        if (!(await this.internalCaller.verify(request.headers.authorization))) {
          throw deny(404);
        }
        return true;
    }
  }

  /** Step 1: only `Authorization: Bearer`, never cookies or the query string. */
  private async requireSession(request: Request): Promise<VerifiedSession> {
    const header = request.headers.authorization;
    const token = header === undefined ? undefined : /^Bearer ([^\s]+)$/i.exec(header)?.[1];
    const session = token === undefined ? null : await this.sessions.verify(token);
    if (session === null) {
      throw deny(401);
    }
    return session;
  }

  private async checkCommunity(
    request: Request,
    routePath: string,
    policy: CommunityPolicy,
  ): Promise<void> {
    const session = await this.requireSession(request);
    if (session.audience !== 'community') {
      throw deny(404);
    }

    // Step 2: one query per (person, community), without reading COMMUNITY first.
    const communityId = request.params['communityId'];
    if (typeof communityId !== 'string' || !isCanonicalUuid(communityId)) {
      throw deny(404);
    }
    const now = this.clock.now();
    const roles = await this.memberships.readCurrentRoles(session.personId, communityId, now);
    if (roles.length === 0) {
      throw deny(404);
    }
    const tenant: TenantContext = {
      communityId,
      actor: { type: 'member', personId: session.personId, roles },
    };
    fillTenantContext(tenant);

    // Step 3a: the union of the roles must see the resource type (ADR-0009-S4).
    if (!this.communityRolesSee(roles, policy.resource)) {
      throw deny(404);
    }
    // Step 3b: each path resource, in route order, before the shape of the body (D39).
    await this.checkPathResources(request, routePath, 'community', policy.pathResources ?? {}, {
      tenant,
    });
    // Step 3c: permission of the action.
    if (policy.permission !== undefined && !this.communityRolesMay(roles, policy.permission)) {
      throw deny(403);
    }

    await this.memberships.recordFirstAccess(session.personId, communityId, now);
  }

  private async checkIdentity(request: Request): Promise<void> {
    const session = await this.requireSession(request);
    if (session.audience !== 'community') {
      throw deny(404);
    }
    fillIdentityContext({ personId: session.personId });
  }

  private async checkGateway(request: Request, policy: GatewayPolicy): Promise<void> {
    const verifier = this.gateways.find((candidate) => candidate.name === policy.gateway);
    if (verifier === undefined) {
      throw deny(404);
    }
    const verification = await verifier.verify({
      request,
      bodyUnreadable: hasDeferredBodyError(request),
      fillTenant: (communityId) => fillTenantContext({ communityId, actor: { type: 'system' } }),
    });
    if (!verification.accepted) {
      throw new GatewayRejectedException(verification.redirectTo);
    }
  }

  /**
   * Platform routes write their own rejections, and any other error once the person is known,
   * to the audit log before throwing (D41; m-2).
   */
  private async checkPlatform(
    request: Request,
    routePath: string,
    policy: PlatformPolicy,
  ): Promise<void> {
    const identified: { principal?: PlatformPrincipal; communityId: string | null } = {
      communityId: null,
    };
    try {
      await this.runPlatformSteps(request, routePath, policy, identified);
    } catch (error) {
      const auditFailure =
        error instanceof PlatformAuditFailedException ||
        error instanceof PlatformAuditUnavailableException;
      if (!auditFailure) {
        await this.audit.recordRequest(request, outcomeOf(error), identified);
      }
      throw error;
    }
  }

  private async runPlatformSteps(
    request: Request,
    routePath: string,
    policy: PlatformPolicy,
    identified: { principal?: PlatformPrincipal; communityId: string | null },
  ): Promise<void> {
    // Step 1: a community session or one without second factor is not a platform person.
    const session = await this.requireSession(request);
    if (session.audience !== 'platform' || !session.secondFactorVerified) {
      throw deny(404);
    }

    // Step 2: current PLATFORM_ROLE_GRANT. A rejection records every current role (D67).
    const roles = await this.grants.readCurrentRoles(session.personId, this.clock.now());
    identified.principal = { personId: session.personId, platformRoles: roles };
    if (roles.length === 0) {
      throw deny(404);
    }

    // Step 3a: each platform role gets 404 on the endpoints of the other (ADR 0006).
    const platformRole = this.platformRoleWith(roles, policy.permission);
    if (platformRole === undefined) {
      throw deny(404);
    }
    const principal: PlatformPrincipal = {
      personId: session.personId,
      platformRoles: roles,
      platformRole,
    };

    // Step 3b: the community of the route, only as the third segment (menor 9, R2-m-4). The
    // container is filled before the path resources, which query with the per-community client
    // of that community (M-1).
    let tenant: TenantContext | undefined;
    if (hasRouteCommunity(routePath, 'platform')) {
      const communityId = request.params['communityId'];
      if (typeof communityId !== 'string' || !isCanonicalUuid(communityId)) {
        throw deny(404);
      }
      if (!(await this.communities.exists(communityId))) {
        throw deny(404);
      }
      identified.communityId = communityId;
      tenant = {
        communityId,
        actor: { type: 'platform', personId: session.personId, platformRole },
      };
    }
    fillPlatformContext(principal, tenant);

    await this.checkPathResources(request, routePath, 'platform', policy.pathResources ?? {}, {
      tenant,
      platform: principal,
      onAuditCommunity: (communityId) => {
        identified.communityId ??= communityId;
        setPlatformAuditCommunity(communityId);
      },
    });
  }

  private async checkPathResources(
    request: Request,
    routePath: string,
    kind: 'community' | 'platform',
    declared: Readonly<Record<string, string>>,
    context: {
      tenant: TenantContext | undefined;
      platform?: PlatformPrincipal;
      onAuditCommunity?: (communityId: string) => void;
    },
  ): Promise<void> {
    const previous: Record<string, string> = {};
    const skipCommunity = hasRouteCommunity(routePath, kind);
    for (const name of routeParamNames(routePath)) {
      // The community of the route was already checked in step 2 (community) or 3b (platform).
      if (name === 'communityId' && skipCommunity) {
        continue;
      }
      const resource = declared[name];
      const id = request.params[name];
      const port = resource === undefined ? undefined : this.visibilityByResource.get(resource);
      if (port === undefined || typeof id !== 'string' || !port.isWellFormed(id)) {
        throw deny(404);
      }
      const check: PathResourceCheck =
        context.platform === undefined
          ? { tenant: context.tenant, id, previous: { ...previous } }
          : { tenant: context.tenant, platform: context.platform, id, previous: { ...previous } };
      const result = await port.isVisible(check);
      if (!result.visible) {
        throw deny(404);
      }
      if (result.auditCommunityId !== undefined && context.tenant === undefined) {
        context.onAuditCommunity?.(result.auditCommunityId);
      }
      previous[name] = id;
    }
  }

  private communityRolesSee(roles: readonly CommunityRole[], resource: string): boolean {
    const entry = this.tables.communityVisibility.find((row) => row.resource === resource);
    return entry !== undefined && roles.some((role) => entry.roles.includes(role));
  }

  private communityRolesMay(roles: readonly CommunityRole[], permission: string): boolean {
    const entry = this.tables.communityPermissions.find((row) => row.permission === permission);
    return entry !== undefined && roles.some((role) => entry.roles.includes(role));
  }

  private platformRoleWith(
    roles: readonly PlatformRole[],
    permission: string,
  ): PlatformRole | undefined {
    const entry = this.tables.platformPermissions.find((row) => row.permission === permission);
    return entry === undefined ? undefined : roles.find((role) => entry.roles.includes(role));
  }
}
