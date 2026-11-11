import { Module } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';

import { AccessExceptionFilter } from './access-exception.filter.js';
import { AccessGuard } from './access.guard.js';
import { BodyParseErrorInterceptor } from './body-parse-error.interceptor.js';
import { ACCESS_POLICY_TABLES, PRODUCTION_ACCESS_POLICY_TABLES } from './policy-tables/index.js';
import { PlatformAccessAudit, PlatformAccessAuditInterceptor } from './platform-access-audit.js';
import {
  ACCESS_EVENT_LOG,
  CLOCK,
  COMMUNITY_DIRECTORY,
  DenyAllInternalCallerVerifier,
  DenyAllSessionVerifier,
  EmptyCommunityDirectory,
  GATEWAY_VERIFIERS,
  INTERNAL_CALLER_VERIFIER,
  LoggerAccessEventLog,
  MEMBERSHIP_READER,
  NoMembershipReader,
  NoPlatformGrantReader,
  PATH_RESOURCE_VISIBILITIES,
  PLATFORM_AUDIT_WRITER,
  PLATFORM_GRANT_READER,
  SESSION_VERIFIER,
  SystemClock,
  UnavailablePlatformAuditWriter,
} from './ports.js';

/**
 * Deny-by-default access (ADR 0009). Registers the single global guard and, for each port, a
 * default that denies until the module that owns it exists (menor 7; test 12). The filter and
 * the interceptors are registered globally by `createApp`, in the order of decision 7.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [
    { provide: APP_GUARD, useClass: AccessGuard },
    PlatformAccessAudit,
    PlatformAccessAuditInterceptor,
    BodyParseErrorInterceptor,
    AccessExceptionFilter,
    { provide: ACCESS_POLICY_TABLES, useValue: PRODUCTION_ACCESS_POLICY_TABLES },
    { provide: SESSION_VERIFIER, useClass: DenyAllSessionVerifier },
    { provide: MEMBERSHIP_READER, useClass: NoMembershipReader },
    { provide: PATH_RESOURCE_VISIBILITIES, useValue: [] },
    { provide: PLATFORM_GRANT_READER, useClass: NoPlatformGrantReader },
    { provide: COMMUNITY_DIRECTORY, useClass: EmptyCommunityDirectory },
    { provide: INTERNAL_CALLER_VERIFIER, useClass: DenyAllInternalCallerVerifier },
    { provide: GATEWAY_VERIFIERS, useValue: [] },
    { provide: CLOCK, useClass: SystemClock },
    { provide: PLATFORM_AUDIT_WRITER, useClass: UnavailablePlatformAuditWriter },
    { provide: ACCESS_EVENT_LOG, useClass: LoggerAccessEventLog },
  ],
})
export class AccessModule {}
