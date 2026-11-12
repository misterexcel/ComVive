import {
  COMMUNITY_PERMISSION_GRANTS,
  COMMUNITY_RESOURCES,
  COMMUNITY_VISIBILITY,
  type CommunityPermissionEntry,
  type CommunityVisibilityEntry,
} from './community.js';
import {
  PLATFORM_PATH_RESOURCES,
  PLATFORM_PERMISSION_GRANTS,
  type PlatformPermissionEntry,
} from './platform.js';

export type { CommunityPermission, CommunityResource } from './community.js';
export type { PlatformPathResource, PlatformPermission } from './platform.js';
export type { CommunityRole, PlatformRole } from './roles.js';

/** Visibility table and permission matrices the guard applies (ADR 0009, decision 4, M-6). */
export interface AccessPolicyTables {
  readonly communityResources: readonly string[];
  readonly platformPathResources: readonly string[];
  readonly communityVisibility: readonly CommunityVisibilityEntry[];
  readonly communityPermissions: readonly CommunityPermissionEntry[];
  readonly platformPermissions: readonly PlatformPermissionEntry[];
}

export const ACCESS_POLICY_TABLES = Symbol('AccessPolicyTables');

export const PRODUCTION_ACCESS_POLICY_TABLES: AccessPolicyTables = {
  communityResources: COMMUNITY_RESOURCES,
  platformPathResources: PLATFORM_PATH_RESOURCES,
  communityVisibility: COMMUNITY_VISIBILITY,
  communityPermissions: COMMUNITY_PERMISSION_GRANTS,
  platformPermissions: PLATFORM_PERMISSION_GRANTS,
};
