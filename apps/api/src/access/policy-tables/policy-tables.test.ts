import { describe, expect, it } from 'vitest';

import { TEST_POLICY_TABLES } from '../test-support/fixtures.js';
import { PRODUCTION_ACCESS_POLICY_TABLES, type AccessPolicyTables } from './index.js';
import { policyTableProblems } from './consistency.js';

// ADR 0009, decision 4 (M-6) and test 14.
describe('policyTableProblems', () => {
  const allImplemented = [
    ...TEST_POLICY_TABLES.communityResources,
    ...TEST_POLICY_TABLES.platformPathResources,
  ];

  it('finds nothing wrong in coherent tables', () => {
    expect(policyTableProblems(TEST_POLICY_TABLES, allImplemented)).toEqual([]);
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
    expect(policyTableProblems(tables, allImplemented)).toContain(
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
    expect(policyTableProblems(tables, allImplemented)).toContain(
      'role resident has billing.configure but does not see billing-config',
    );
  });

  it('flags a resource without a PathResourceVisibility implementation', () => {
    expect(policyTableProblems(TEST_POLICY_TABLES, ['unit', 'charge', 'webpay-attempt'])).toEqual([
      'community resource billing-config has no PathResourceVisibility implementation',
      'platform path resource admin-membership has no PathResourceVisibility implementation',
    ]);
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
    const problems = policyTableProblems(tables, allImplemented);
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
    expect(policyTableProblems(tables, [...allImplemented, 'ghost'])).toContain(
      'visibility entry ghost is not a community resource',
    );
  });
});

describe('production access tables (test 14)', () => {
  it('community tables are coherent and every community resource has an implementation', () => {
    // No community resource exists yet (empty tables until the first slice): nothing to implement.
    const problems = policyTableProblems(PRODUCTION_ACCESS_POLICY_TABLES, [
      ...PRODUCTION_ACCESS_POLICY_TABLES.platformPathResources,
    ]);
    expect(problems).toEqual([]);
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
    'every PlatformPathResource (webpay-attempt, admin-membership) has a PathResourceVisibility ' +
      'registered in AppModule: pending the platform and webpay modules (and their data layer)',
  );
});
