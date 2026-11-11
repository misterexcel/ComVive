import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { createApp } from '../../configure-app.js';
import { PATH_RESOURCE_VISIBILITIES, type PathResourceVisibility } from '../ports.js';
import { collectRouteInventory } from '../route-inventory.js';
import { TEST_POLICY_TABLES } from '../test-support/fixtures.js';
import { PRODUCTION_ACCESS_POLICY_TABLES, type AccessPolicyTables } from './index.js';
import { policyTableProblems } from './consistency.js';

// ADR 0009, decision 4 (M-6) and test 14.
describe('policyTableProblems', () => {
  const allImplemented = [
    ...TEST_POLICY_TABLES.communityResources,
    ...TEST_POLICY_TABLES.platformPathResources,
  ];
  const everything = { implemented: allImplemented, used: allImplemented };

  it('finds nothing wrong in coherent tables', () => {
    expect(policyTableProblems(TEST_POLICY_TABLES, everything)).toEqual([]);
  });

  const broken = (change: Partial<AccessPolicyTables>): AccessPolicyTables => ({
    ...TEST_POLICY_TABLES,
    ...change,
  });

  it('flags a community permission that no role has', () => {
    const tables = broken({
      communityPermissions: [
        { permission: 'period.issue', resource: 'charge', roles: [], source: 't' },
      ],
    });
    expect(policyTableProblems(tables, everything)).toContain(
      'community permission period.issue is not granted to any role',
    );
  });

  it('flags a role with a permission that does not see its resource (impossible 403)', () => {
    const tables = broken({
      communityPermissions: [
        {
          permission: 'billing.configure',
          resource: 'billing-config',
          roles: ['resident'],
          source: 't',
        },
      ],
    });
    expect(policyTableProblems(tables, everything)).toContain(
      'role resident has billing.configure but does not see billing-config',
    );
  });

  it('flags a resource type used in some pathResources without an implementation (D66)', () => {
    expect(
      policyTableProblems(TEST_POLICY_TABLES, {
        implemented: ['unit', 'charge', 'webpay-attempt'],
        used: allImplemented,
      }),
    ).toEqual([
      'resource type billing-config is used in pathResources but has no PathResourceVisibility implementation',
      'resource type admin-membership is used in pathResources but has no PathResourceVisibility implementation',
    ]);
  });

  it('does not require an implementation for a type no pathResources uses (D66)', () => {
    expect(
      policyTableProblems(TEST_POLICY_TABLES, { implemented: ['unit'], used: ['unit'] }),
    ).toEqual([]);
  });

  it('flags a type that is both a community resource and a platform path resource (m-10)', () => {
    const tables = broken({ platformPathResources: ['webpay-attempt', 'unit'] });
    expect(policyTableProblems(tables, everything)).toContain(
      'resource type unit is both a community resource and a platform path resource',
    );
  });

  it('flags a platform permission in the community table and a community one in the platform table', () => {
    const tables = broken({
      communityPermissions: [
        {
          permission: 'platform.webpay_review.read',
          resource: 'charge',
          roles: ['admin'],
          source: 't',
        },
      ],
      platformPermissions: [
        { permission: 'payment.register', roles: ['platform_support'], source: 't' },
      ],
    });
    const problems = policyTableProblems(tables, everything);
    expect(problems).toContain(
      'community permission platform.webpay_review.read is a platform permission',
    );
    expect(problems).toContain('platform permission payment.register is not a platform permission');
  });

  it('flags a permission or visibility entry on an unknown resource type', () => {
    const tables = broken({
      communityVisibility: [
        ...TEST_POLICY_TABLES.communityVisibility,
        { resource: 'ghost', roles: ['admin'], source: 't' },
      ],
    });
    expect(
      policyTableProblems(tables, {
        implemented: [...allImplemented, 'ghost'],
        used: allImplemented,
      }),
    ).toContain('visibility entry ghost is not a community resource');
  });
});

describe('production access tables (test 14)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await createApp(moduleRef, { TRUST_PROXY_HOPS: '0' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // The implementations registered in the real AppModule and the types its routes use (M-5).
  const registered = () => ({
    implemented: app
      .get<symbol, readonly PathResourceVisibility[]>(PATH_RESOURCE_VISIBILITIES)
      .map((port) => port.resource),
    used: collectRouteInventory(app).flatMap((route) =>
      route.policies.flatMap((policy) =>
        policy.kind === 'community' || policy.kind === 'platform'
          ? Object.values(policy.pathResources ?? {})
          : [],
      ),
    ),
  });

  it('are coherent with the implementations and routes of the real AppModule', () => {
    expect(policyTableProblems(PRODUCTION_ACCESS_POLICY_TABLES, registered())).toEqual([]);
  });

  it('pins the platform path resources still without an implementation (see the todo below)', () => {
    const { implemented } = registered();
    expect(implemented).toEqual([]);
    expect(
      PRODUCTION_ACCESS_POLICY_TABLES.platformPathResources.filter(
        (resource) => !implemented.includes(resource),
      ),
    ).toEqual(['webpay-attempt', 'admin-membership']);
  });

  it('every platform permission is granted to exactly the roles of docs/arquitectura.md §3', () => {
    expect(
      PRODUCTION_ACCESS_POLICY_TABLES.platformPermissions.map(({ permission, roles }) => ({
        permission,
        roles,
      })),
    ).toEqual([
      { permission: 'platform.webpay_review.read', roles: ['platform_support'] },
      { permission: 'platform.webpay_review.resolve', roles: ['platform_support'] },
      { permission: 'platform.admin_role.grant', roles: ['platform_operations'] },
    ]);
  });

  it.todo(
    'webpay-attempt and admin-membership get their PathResourceVisibility in AppModule with the ' +
      'platform and webpay modules, when a platform route uses them (D66)',
  );
});
