import type { Request } from 'express';

import type { CommunityRole, PlatformRole } from '../policy-tables/roles.js';
import {
  PlatformAuditPoolExhaustedError,
  type AccessEventLog,
  type Clock,
  type CommunityDirectory,
  type GatewayVerification,
  type GatewayVerifier,
  type InternalCallerVerifier,
  type MembershipReader,
  type PathResourceCheck,
  type PathResourceVisibility,
  type PathResourceVisibilityResult,
  type PlatformAccessAuditRow,
  type PlatformAuditWriter,
  type PlatformGrantReader,
  type SecurityEvent,
  type SessionVerifier,
  type VerifiedSession,
} from '../ports.js';
import { requireTenantContext } from '../request-context.js';
import { isCanonicalUuid } from '../route-template.js';
import {
  ADMIN_MEMBERSHIP_A,
  ADMIN_MEMBERSHIP_B,
  ATTEMPT_AUTHORIZED_A,
  ATTEMPT_IN_REVIEW_A,
  COMMITTEE_MEMBERSHIP_A,
  COMMUNITY_A,
  COMMUNITY_B,
  REVOKED_ADMIN_MEMBERSHIP_A,
  TOKENS,
  UNIT_A1,
  UNIT_A2,
  UNIT_B1,
} from './fixtures.js';

export class FakeClock implements Clock {
  constructor(public current: Date = new Date('2026-11-11T15:00:00.000Z')) {}
  now(): Date {
    return this.current;
  }
}

export class FakeSessionVerifier implements SessionVerifier {
  readonly sessions = new Map<string, VerifiedSession>([
    [TOKENS.adminA, { personId: 'admin-a', audience: 'community' }],
    [TOKENS.committeeA, { personId: 'committee-a', audience: 'community' }],
    [TOKENS.residentA1, { personId: 'resident-a1', audience: 'community' }],
    [TOKENS.conciergeA, { personId: 'concierge-a', audience: 'community' }],
    [TOKENS.memberB, { personId: 'member-b', audience: 'community' }],
    [TOKENS.noMembership, { personId: 'nobody', audience: 'community' }],
    [TOKENS.support, { personId: 'support-1', audience: 'platform', secondFactorVerified: true }],
    [TOKENS.operations, { personId: 'ops-1', audience: 'platform', secondFactorVerified: true }],
    [
      TOKENS.platformWithoutSecondFactor,
      { personId: 'ops-1', audience: 'platform', secondFactorVerified: false },
    ],
    [
      TOKENS.platformWithoutGrant,
      { personId: 'ops-gone', audience: 'platform', secondFactorVerified: true },
    ],
  ]);
  readonly calls: string[] = [];

  async verify(accessToken: string): Promise<VerifiedSession | null> {
    this.calls.push(accessToken);
    return this.sessions.get(accessToken) ?? null;
  }
}

export interface FakeMembership {
  personId: string;
  communityId: string;
  role: CommunityRole;
  /** Chile calendar date (YYYY-MM-DD) from which the membership is current. */
  validFrom?: string;
  revoked?: boolean;
}

/** Calendar date in Chile of an instant (memberships start at the Chilean day). */
export function chileDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export class FakeMembershipReader implements MembershipReader {
  readonly memberships: FakeMembership[] = [
    { personId: 'admin-a', communityId: COMMUNITY_A, role: 'admin' },
    { personId: 'committee-a', communityId: COMMUNITY_A, role: 'committee' },
    { personId: 'resident-a1', communityId: COMMUNITY_A, role: 'resident' },
    { personId: 'concierge-a', communityId: COMMUNITY_A, role: 'concierge' },
    { personId: 'member-b', communityId: COMMUNITY_B, role: 'admin' },
  ];
  readonly reads: { personId: string; communityId: string }[] = [];
  readonly firstAccesses: { personId: string; communityId: string; at: Date }[] = [];

  async readCurrentRoles(
    personId: string,
    communityId: string,
    now: Date,
  ): Promise<readonly CommunityRole[]> {
    this.reads.push({ personId, communityId });
    const today = chileDate(now);
    return this.memberships
      .filter(
        (membership) =>
          membership.personId === personId &&
          membership.communityId === communityId &&
          membership.revoked !== true &&
          (membership.validFrom === undefined || membership.validFrom <= today),
      )
      .map((membership) => membership.role);
  }

  async recordFirstAccess(personId: string, communityId: string, now: Date): Promise<void> {
    this.firstAccesses.push({ personId, communityId, at: now });
  }
}

export class FakePlatformGrantReader implements PlatformGrantReader {
  readonly grants = new Map<string, PlatformRole[]>([
    ['support-1', ['platform_support']],
    ['ops-1', ['platform_operations']],
  ]);

  async readCurrentRoles(personId: string): Promise<readonly PlatformRole[]> {
    return this.grants.get(personId) ?? [];
  }
}

export class FakeCommunityDirectory implements CommunityDirectory {
  readonly communities = new Set([COMMUNITY_A, COMMUNITY_B]);

  async exists(communityId: string): Promise<boolean> {
    return this.communities.has(communityId);
  }
}

/** Units of the test communities; residents see only their own unit (spec F-9). */
export class FakeUnitVisibility implements PathResourceVisibility {
  readonly resource = 'unit';
  readonly units = new Map([
    [UNIT_A1, COMMUNITY_A],
    [UNIT_A2, COMMUNITY_A],
    [UNIT_B1, COMMUNITY_B],
  ]);
  readonly residentUnits = new Map([['resident-a1', new Set([UNIT_A1])]]);
  readonly checks: PathResourceCheck[] = [];

  isWellFormed(id: string): boolean {
    return isCanonicalUuid(id);
  }

  // Like the per-community Prisma client, it reads the tenant from the request container.
  async isVisible(check: PathResourceCheck): Promise<PathResourceVisibilityResult> {
    this.checks.push(check);
    const tenant = requireTenantContext();
    if (this.units.get(check.id) !== tenant.communityId) {
      return { visible: false };
    }
    if (tenant.actor.type !== 'member') {
      return { visible: true };
    }
    const { roles, personId } = tenant.actor;
    if (roles.includes('admin') || roles.includes('committee')) {
      return { visible: true };
    }
    return { visible: this.residentUnits.get(personId)?.has(check.id) ?? false };
  }
}

/** Admin memberships that Operations sees in the community of the route (H-41). */
export class FakeAdminMembershipVisibility implements PathResourceVisibility {
  readonly resource = 'admin-membership';
  readonly memberships = new Map([
    [ADMIN_MEMBERSHIP_A, { communityId: COMMUNITY_A, role: 'admin' }],
    [REVOKED_ADMIN_MEMBERSHIP_A, { communityId: COMMUNITY_A, role: 'admin' }],
    [COMMITTEE_MEMBERSHIP_A, { communityId: COMMUNITY_A, role: 'committee' }],
    [ADMIN_MEMBERSHIP_B, { communityId: COMMUNITY_B, role: 'admin' }],
  ]);

  isWellFormed(id: string): boolean {
    return isCanonicalUuid(id);
  }

  // Per-community client of the community of the route: reads the container (M-1).
  async isVisible(check: PathResourceCheck): Promise<PathResourceVisibilityResult> {
    const tenant = requireTenantContext();
    const membership = this.memberships.get(check.id);
    return {
      visible:
        membership !== undefined &&
        membership.role === 'admin' &&
        membership.communityId === tenant.communityId,
    };
  }
}

/** Webpay attempts in Support's view (`platform_webpay_review`, R2-m-4). */
export class FakeWebpayAttemptVisibility implements PathResourceVisibility {
  readonly resource = 'webpay-attempt';
  readonly attempts = new Map([
    [ATTEMPT_IN_REVIEW_A, { communityId: COMMUNITY_A, status: 'in_review' }],
    [ATTEMPT_AUTHORIZED_A, { communityId: COMMUNITY_A, status: 'authorized' }],
  ]);

  isWellFormed(id: string): boolean {
    return isCanonicalUuid(id);
  }

  // Only the view: a visible attempt reports its community for the audit row (D46, D65).
  async isVisible(check: PathResourceCheck): Promise<PathResourceVisibilityResult> {
    const attempt = this.attempts.get(check.id);
    const visible = attempt?.status === 'in_review' || attempt?.status === 'reversal_pending';
    return visible && attempt !== undefined
      ? { visible, auditCommunityId: attempt.communityId }
      : { visible: false };
  }
}

export const NEUTRAL_RETURN_URL = 'https://app.comvive.test/pago/resultado';

/** Webpay return verifier double: accepts the attempt only with `token_ws=ok`. */
export class FakeWebpayReturnVerifier implements GatewayVerifier {
  readonly name = 'webpay-return' as const;
  readonly seen: { bodyUnreadable: boolean; body: unknown }[] = [];

  async verify(input: {
    request: Request;
    bodyUnreadable: boolean;
    fillTenant: (communityId: string) => void;
  }): Promise<GatewayVerification> {
    this.seen.push({ bodyUnreadable: input.bodyUnreadable, body: input.request.body });
    if (input.bodyUnreadable) {
      return { accepted: false, redirectTo: NEUTRAL_RETURN_URL };
    }
    const body = input.request.body as Record<string, unknown> | undefined;
    const token = body?.['token_ws'] ?? input.request.query['token_ws'];
    if (token !== 'ok') {
      return { accepted: false, redirectTo: NEUTRAL_RETURN_URL };
    }
    input.fillTenant(String(input.request.params['communityId']));
    return { accepted: true };
  }

  neutralRedirect(): string {
    return NEUTRAL_RETURN_URL;
  }
}

export class StaticInternalCallerVerifier implements InternalCallerVerifier {
  constructor(private readonly validToken: string) {}
  async verify(authorization: string | undefined): Promise<boolean> {
    return authorization === `Bearer ${this.validToken}`;
  }
}

export class RecordingPlatformAuditWriter implements PlatformAuditWriter {
  readonly rows: PlatformAccessAuditRow[] = [];
  mode: 'ok' | 'fail' | 'exhausted' = 'ok';
  delayMs = 0;
  writes = 0;

  async write(row: PlatformAccessAuditRow): Promise<void> {
    this.writes += 1;
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.mode === 'fail') {
      throw new Error('audit insert failed');
    }
    if (this.mode === 'exhausted') {
      throw new PlatformAuditPoolExhaustedError();
    }
    this.rows.push(row);
  }
}

export class RecordingAccessEventLog implements AccessEventLog {
  readonly securityEvents: SecurityEvent[] = [];
  readonly programmingErrors: string[] = [];

  securityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
  }

  programmingError(message: string): void {
    this.programmingErrors.push(message);
  }
}
