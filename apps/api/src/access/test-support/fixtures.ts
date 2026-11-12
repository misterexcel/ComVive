import type {
  CommunityPermission,
  CommunityResource,
  PlatformPathResource,
} from '../access-policy.js';
import type { AccessPolicyTables } from '../policy-tables/index.js';

export const COMMUNITY_A = '0b7c9d2e-0000-4000-8000-00000000000a';
export const COMMUNITY_B = '0b7c9d2e-0000-4000-8000-00000000000b';
export const COMMUNITY_MISSING = '0b7c9d2e-0000-4000-8000-0000000000ff';

export const UNIT_A1 = '1c000000-0000-4000-8000-0000000000a1';
export const UNIT_A2 = '1c000000-0000-4000-8000-0000000000a2';
export const UNIT_B1 = '1c000000-0000-4000-8000-0000000000b1';

export const ADMIN_MEMBERSHIP_A = '2d000000-0000-4000-8000-0000000000a1';
export const REVOKED_ADMIN_MEMBERSHIP_A = '2d000000-0000-4000-8000-0000000000a2';
export const COMMITTEE_MEMBERSHIP_A = '2d000000-0000-4000-8000-0000000000a3';
export const ADMIN_MEMBERSHIP_B = '2d000000-0000-4000-8000-0000000000b1';

export const ATTEMPT_IN_REVIEW_A = '3e000000-0000-4000-8000-0000000000a1';
export const ATTEMPT_AUTHORIZED_A = '3e000000-0000-4000-8000-0000000000a2';

/** Access tokens of the session double. */
export const TOKENS = {
  adminA: 'token-admin-a',
  committeeA: 'token-committee-a',
  residentA1: 'token-resident-a1',
  conciergeA: 'token-concierge-a',
  memberB: 'token-member-b',
  noMembership: 'token-no-membership',
  support: 'token-platform-support',
  operations: 'token-platform-operations',
  platformWithoutSecondFactor: 'token-platform-no-2fa',
  platformWithoutGrant: 'token-platform-no-grant',
  expired: 'token-expired',
  refresh: 'refresh-token-in-authorization',
  secondFactorChallenge: 'second-factor-challenge',
} as const;

/** Test-only resource and permission names, outside the production tables (decision 2). */
export const testResource = (name: string): CommunityResource => name as CommunityResource;
export const testPermission = (name: string): CommunityPermission => name as CommunityPermission;
export const testPlatformResource = (name: string): PlatformPathResource =>
  name as PlatformPathResource;

/**
 * Tables used by the guard tests. Roles and shapes follow the spec matrix ("Qué recursos ve cada
 * rol"): the concierge does not see charges, the committee sees them without permission.
 */
export const TEST_POLICY_TABLES: AccessPolicyTables = {
  communityResources: ['unit', 'charge', 'billing-config'],
  platformPathResources: ['webpay-attempt', 'admin-membership'],
  communityVisibility: [
    { resource: 'unit', roles: ['admin', 'committee', 'resident'], source: 'test' },
    { resource: 'charge', roles: ['admin', 'committee', 'resident'], source: 'test' },
    { resource: 'billing-config', roles: ['admin', 'committee'], source: 'test' },
  ],
  communityPermissions: [
    { permission: 'payment.register', resource: 'charge', roles: ['admin'], source: 'test' },
    { permission: 'payment.pay_online', resource: 'charge', roles: ['resident'], source: 'test' },
    {
      permission: 'billing.configure',
      resource: 'billing-config',
      roles: ['admin'],
      source: 'test',
    },
  ],
  platformPermissions: [
    {
      permission: 'platform.webpay_review.read',
      roles: ['platform_support'],
      source: 'test',
    },
    {
      permission: 'platform.webpay_review.resolve',
      roles: ['platform_support'],
      source: 'test',
    },
    {
      permission: 'platform.admin_role.grant',
      roles: ['platform_operations'],
      source: 'test',
    },
  ],
};
