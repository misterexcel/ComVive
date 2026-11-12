import type { CommunityRole } from './roles.js';

/**
 * Closed list of community resource types (ADR 0002, decision 4; ADR 0009, decision 2).
 *
 * Empty on purpose: no business module exists yet. Each vertical slice adds, in the same change,
 * its resource types transcribed from the matrix "Qué recursos ve cada rol" of its approved spec
 * (citing the section), their `PathResourceVisibility` implementations and their isolation tests
 * (ADR 0009, decision 4, M-6). A value outside this list does not compile.
 */
export const COMMUNITY_RESOURCES = [] as const;
export type CommunityResource = (typeof COMMUNITY_RESOURCES)[number];

/** Closed list of community permissions (ADR 0003, decision 3). Empty until the first slice. */
export const COMMUNITY_PERMISSIONS = [] as const;
export type CommunityPermission = (typeof COMMUNITY_PERMISSIONS)[number];

export interface CommunityVisibilityEntry {
  readonly resource: string;
  /** Roles that see the resource type; any other role gets 404 (step 3a). */
  readonly roles: readonly CommunityRole[];
  /** Section of the spec it was transcribed from. */
  readonly source: string;
}

export interface CommunityPermissionEntry {
  readonly permission: string;
  /** Resource type the permission acts on: every role with the permission must see it. */
  readonly resource: string;
  readonly roles: readonly CommunityRole[];
  readonly source: string;
}

export const COMMUNITY_VISIBILITY: readonly CommunityVisibilityEntry[] = [];

export const COMMUNITY_PERMISSION_GRANTS: readonly CommunityPermissionEntry[] = [];
