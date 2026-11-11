import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';

import type { GatewayName } from './access-policy.js';
import type { CommunityRole, PlatformRole } from './policy-tables/roles.js';
import type { PlatformPrincipal, TenantContext } from './request-context.js';

/*
 * Ports of the guard (ADR 0009, decision 3, menor 7): the guard knows no database, token or
 * system clock. Each module implements its port; until it exists, AccessModule registers a
 * default that denies (or, for the audit writer, fails), never one that allows.
 */

// ---------------------------------------------------------------------------------------------
// Session (ADR 0005)

export type VerifiedSession =
  | { readonly personId: string; readonly audience: 'community' }
  | {
      readonly personId: string;
      readonly audience: 'platform';
      /** A platform session issued without the second factor is 404 (ADR 0005, decision 2). */
      readonly secondFactorVerified: boolean;
    };

export interface SessionVerifier {
  /**
   * Verifies an access token from `Authorization: Bearer`. Returns null for anything that is not
   * a current session: missing, invalid or expired token, revoked or expired `SESSION`, and also a
   * refresh token or a second factor challenge, which are not sessions (D42).
   */
  verify(accessToken: string): Promise<VerifiedSession | null>;
}
export const SESSION_VERIFIER = Symbol('SessionVerifier');

/** Default until the session module exists: every token is rejected with 401 (test 12). */
@Injectable()
export class DenyAllSessionVerifier implements SessionVerifier {
  async verify(): Promise<VerifiedSession | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Memberships (ADR 0002)

export interface MembershipReader {
  /**
   * Roles of the current memberships of the person in the community at `now` (Chile time):
   * not revoked, `valid_from` reached, `valid_to` not reached. One query per (person,
   * community) that does not read `COMMUNITY` first, so a missing community and a foreign one
   * take the same time. Empty: 404.
   */
  readCurrentRoles(
    personId: string,
    communityId: string,
    now: Date,
  ): Promise<readonly CommunityRole[]>;

  /**
   * Sets `first_access_at` once, after the request passed the whole guard (ADR-0008-S9), with
   * its `membership.first_access` audit only if it updated the row.
   */
  recordFirstAccess(personId: string, communityId: string, now: Date): Promise<void>;
}
export const MEMBERSHIP_READER = Symbol('MembershipReader');

@Injectable()
export class NoMembershipReader implements MembershipReader {
  async readCurrentRoles(): Promise<readonly CommunityRole[]> {
    return [];
  }
  async recordFirstAccess(): Promise<void> {
    // No memberships exist yet, so there is nothing to record.
  }
}

// ---------------------------------------------------------------------------------------------
// Path resources (D39)

export interface PathResourceCheck {
  /** Tenant context already filled by the guard (community routes and platform community routes). */
  readonly tenant: TenantContext | undefined;
  /** Platform person, on platform routes. */
  readonly platform?: PlatformPrincipal;
  readonly id: string;
  /** Ids of the earlier path parameters, already verified, by parameter name. */
  readonly previous: Readonly<Record<string, string>>;
}

export interface PathResourceVisibility {
  /** Resource type (`CommunityResource` or `PlatformPathResource`). */
  readonly resource: string;
  /** Shape of the id: canonical uuid unless the spec of the resource says otherwise. */
  isWellFormed(id: string): boolean;
  /** One query with the per-community client (RLS), inside the community of the route. */
  isVisible(check: PathResourceCheck): Promise<boolean>;
}
export const PATH_RESOURCE_VISIBILITIES = Symbol('PathResourceVisibilities');

// ---------------------------------------------------------------------------------------------
// Platform (ADR 0006)

export interface PlatformGrantReader {
  /** Roles of the current `PLATFORM_ROLE_GRANT` rows of the person. Empty: 404. */
  readCurrentRoles(personId: string, now: Date): Promise<readonly PlatformRole[]>;
}
export const PLATFORM_GRANT_READER = Symbol('PlatformGrantReader');

@Injectable()
export class NoPlatformGrantReader implements PlatformGrantReader {
  async readCurrentRoles(): Promise<readonly PlatformRole[]> {
    return [];
  }
}

export interface CommunityDirectory {
  /** Whether the community exists (platform routes under `/platform/communities/:communityId`). */
  exists(communityId: string): Promise<boolean>;
}
export const COMMUNITY_DIRECTORY = Symbol('CommunityDirectory');

@Injectable()
export class EmptyCommunityDirectory implements CommunityDirectory {
  async exists(): Promise<boolean> {
    return false;
  }
}

/** One platform access row (ADR 0009, decision 3, "Auditoría de plataforma"; D41, D44). */
export type PlatformAccessAuditRow =
  | {
      readonly action: 'platform.request';
      readonly actorType: 'platform';
      readonly personId: string;
      readonly platformRole: PlatformRole | null;
      /** Only if it exists; null across communities or for a missing one (D44, D46). */
      readonly communityId: string | null;
      readonly routeTemplate: string | null;
      readonly httpMethod: string;
      readonly occurredAt: Date;
      readonly status: number;
      readonly code: string | null;
      readonly origin: string | null;
    }
  | {
      readonly action: 'platform.request';
      readonly actorType: 'anonymous';
      readonly routeTemplate: string | null;
      readonly httpMethod: string;
      readonly occurredAt: Date;
      readonly status: number;
      readonly code: string | null;
      /** /24 or /48 (ADR-0009-S8); no headers, token, body or parameters. */
      readonly truncatedIp: string | null;
    };

export interface PlatformAuditWriter {
  /**
   * Inserts one row in its own transaction with its own small pool (D43; ADR-0009-S9), with
   * `SET LOCAL app.community_id` of the row. Throws {@link PlatformAuditPoolExhaustedError} when
   * the pool is exhausted (503) and any other error when the insert fails (500).
   */
  write(row: PlatformAccessAuditRow): Promise<void>;
}
export const PLATFORM_AUDIT_WRITER = Symbol('PlatformAuditWriter');

export class PlatformAuditPoolExhaustedError extends Error {
  constructor() {
    super('Platform audit pool exhausted');
    this.name = 'PlatformAuditPoolExhaustedError';
  }
}

/**
 * Default until the data layer exists: a platform request cannot be audited, so it fails with 500
 * and a `platform_audit.failed` event instead of going unaudited (ADR 0006, decision 8).
 */
@Injectable()
export class UnavailablePlatformAuditWriter implements PlatformAuditWriter {
  async write(): Promise<void> {
    throw new Error('Platform audit writer not configured');
  }
}

// ---------------------------------------------------------------------------------------------
// Worker and gateways

export interface InternalCallerVerifier {
  /** OIDC token of Cloud Scheduler (Google issuer, audience, `sa-scheduler`; ADR 0008). */
  verify(authorization: string | undefined): Promise<boolean>;
}
export const INTERNAL_CALLER_VERIFIER = Symbol('InternalCallerVerifier');

/** Default: no internal caller is valid (404). The worker registers the OIDC verifier. */
@Injectable()
export class DenyAllInternalCallerVerifier implements InternalCallerVerifier {
  async verify(): Promise<boolean> {
    return false;
  }
}

export type GatewayVerification =
  { readonly accepted: true } | { readonly accepted: false; readonly redirectTo: string };

export interface GatewayVerifier {
  readonly name: GatewayName;
  /**
   * Verifies a third-party call. On success it fills the container through `fillTenant` with the
   * community of the route and a `system` actor (R2-m-3). An unreadable body (deferred body
   * parser error) counts as missing parameters.
   */
  verify(input: {
    request: Request;
    bodyUnreadable: boolean;
    fillTenant: (communityId: string) => void;
  }): Promise<GatewayVerification>;
  /** Neutral redirect of an invalid return, also used for a body over the limit. */
  neutralRedirect(): string;
}
export const GATEWAY_VERIFIERS = Symbol('GatewayVerifiers');

// ---------------------------------------------------------------------------------------------
// Clock and events

export interface Clock {
  now(): Date;
}
export const CLOCK = Symbol('Clock');

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Security event without personal data (registro de eventos de seguridad, arquitectura §5). */
export type SecurityEvent =
  | {
      readonly name: 'platform_audit.failed' | 'platform_audit.unavailable';
      readonly routeTemplate: string | null;
      readonly httpMethod: string;
      readonly status: number;
    }
  | {
      readonly name: 'webpay_return.rejected';
      readonly reason: 'missing_params';
      readonly httpMethod: string;
    };

export interface AccessEventLog {
  securityEvent(event: SecurityEvent): void;
  /** A route without exactly one policy reached the guard: a programming error (Sentry). */
  programmingError(message: string): void;
}
export const ACCESS_EVENT_LOG = Symbol('AccessEventLog');

/** Structured log in Cloud Logging until Sentry is wired (no personal data in either). */
@Injectable()
export class LoggerAccessEventLog implements AccessEventLog {
  private readonly logger = new Logger('Access');

  securityEvent(event: SecurityEvent): void {
    this.logger.warn(JSON.stringify({ securityEvent: event }));
  }

  programmingError(message: string): void {
    this.logger.error(message);
  }
}
