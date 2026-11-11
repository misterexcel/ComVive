import type { DynamicModule, ForwardReference, Provider, Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { createApp } from '../../configure-app.js';
import { AccessModule } from '../access.module.js';
import { ACCESS_POLICY_TABLES, type AccessPolicyTables } from '../policy-tables/index.js';
import {
  ACCESS_EVENT_LOG,
  CLOCK,
  COMMUNITY_DIRECTORY,
  GATEWAY_VERIFIERS,
  INTERNAL_CALLER_VERIFIER,
  MEMBERSHIP_READER,
  PATH_RESOURCE_VISIBILITIES,
  PLATFORM_AUDIT_WRITER,
  PLATFORM_GRANT_READER,
  SESSION_VERIFIER,
  type GatewayVerifier,
  type InternalCallerVerifier,
  type PathResourceVisibility,
  type SessionVerifier,
} from '../ports.js';
import {
  FakeAdminMembershipVisibility,
  FakeClock,
  FakeCommunityDirectory,
  FakeMembershipReader,
  FakePlatformGrantReader,
  FakeSessionVerifier,
  FakeUnitVisibility,
  FakeWebpayAttemptVisibility,
  RecordingAccessEventLog,
  RecordingPlatformAuditWriter,
} from './doubles.js';
import { TEST_POLICY_TABLES } from './fixtures.js';

export interface AccessDoubles {
  sessions: FakeSessionVerifier;
  memberships: FakeMembershipReader;
  grants: FakePlatformGrantReader;
  communities: FakeCommunityDirectory;
  units: FakeUnitVisibility;
  adminMemberships: FakeAdminMembershipVisibility;
  webpayAttempts: FakeWebpayAttemptVisibility;
  audit: RecordingPlatformAuditWriter;
  events: RecordingAccessEventLog;
  clock: FakeClock;
}

export interface AccessTestAppOptions {
  /** Root module instead of AccessModule plus `controllers` (e.g. the real AppModule). */
  rootModule?: Type<unknown>;
  controllers?: Type<unknown>[];
  imports?: (Type<unknown> | DynamicModule | ForwardReference)[];
  providers?: Provider[];
  /** Real session verifier (`DenyAllSessionVerifier`) instead of the double. */
  sessionVerifier?: SessionVerifier | 'default';
  /** Path resource implementations; by default unit, admin-membership and webpay-attempt. */
  pathResources?: (doubles: AccessDoubles) => PathResourceVisibility[];
  gateways?: GatewayVerifier[];
  internalCaller?: InternalCallerVerifier;
  tables?: AccessPolicyTables;
  env?: NodeJS.ProcessEnv;
  /** Runs after createApp and before init (e.g. to tamper with the layers in test 6). */
  beforeInit?: (app: NestExpressApplication) => void;
}

/**
 * Builds a test application with `createApp`, the same factory as `main.ts` (ADR 0009, menor 2),
 * replacing the ports with doubles through `overrideProvider` (menor 10).
 */
export async function createAccessTestApp(
  options: AccessTestAppOptions = {},
): Promise<{ app: NestExpressApplication; doubles: AccessDoubles }> {
  const doubles: AccessDoubles = {
    sessions: new FakeSessionVerifier(),
    memberships: new FakeMembershipReader(),
    grants: new FakePlatformGrantReader(),
    communities: new FakeCommunityDirectory(),
    units: new FakeUnitVisibility(),
    adminMemberships: new FakeAdminMembershipVisibility(),
    webpayAttempts: new FakeWebpayAttemptVisibility(),
    audit: new RecordingPlatformAuditWriter(),
    events: new RecordingAccessEventLog(),
    clock: new FakeClock(),
  };
  const pathResources = options.pathResources
    ? options.pathResources(doubles)
    : [doubles.units, doubles.adminMemberships, doubles.webpayAttempts];

  let builder = Test.createTestingModule({
    imports: options.rootModule ? [options.rootModule] : [AccessModule, ...(options.imports ?? [])],
    controllers: options.controllers ?? [],
    providers: options.providers ?? [],
  })
    .overrideProvider(ACCESS_POLICY_TABLES)
    .useValue(options.tables ?? TEST_POLICY_TABLES)
    .overrideProvider(MEMBERSHIP_READER)
    .useValue(doubles.memberships)
    .overrideProvider(PLATFORM_GRANT_READER)
    .useValue(doubles.grants)
    .overrideProvider(COMMUNITY_DIRECTORY)
    .useValue(doubles.communities)
    .overrideProvider(PATH_RESOURCE_VISIBILITIES)
    .useValue(pathResources)
    .overrideProvider(PLATFORM_AUDIT_WRITER)
    .useValue(doubles.audit)
    .overrideProvider(ACCESS_EVENT_LOG)
    .useValue(doubles.events)
    .overrideProvider(CLOCK)
    .useValue(doubles.clock)
    .overrideProvider(GATEWAY_VERIFIERS)
    .useValue(options.gateways ?? []);

  if (options.sessionVerifier !== 'default') {
    builder = builder
      .overrideProvider(SESSION_VERIFIER)
      .useValue(options.sessionVerifier ?? doubles.sessions);
  }
  if (options.internalCaller !== undefined) {
    builder = builder.overrideProvider(INTERNAL_CALLER_VERIFIER).useValue(options.internalCaller);
  }

  const moduleRef = await builder.compile();
  const app = await createApp(moduleRef, options.env ?? { TRUST_PROXY_HOPS: '0' });
  options.beforeInit?.(app);
  await app.init();
  return { app, doubles };
}
