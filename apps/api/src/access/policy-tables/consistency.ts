import type { AccessPolicyTables } from './index.js';

const isPlatformPermission = (permission: string): boolean => permission.startsWith('platform.');

/**
 * Internal coherence of the access tables (ADR 0009, decision 4, M-6; test 14): every community
 * permission is granted to some role, every role with a permission sees the resource of that
 * permission (no impossible 403), every resource type used in some `pathResources` has a
 * `PathResourceVisibility` implementation (D66), community and platform resource types and
 * permissions do not mix (m-10). That each table matches its spec is verified by the isolation
 * test of each endpoint, not here.
 */
export function policyTableProblems(
  tables: AccessPolicyTables,
  resources: { implemented: readonly string[]; used: readonly string[] },
): string[] {
  const problems: string[] = [];
  const communityResources = new Set(tables.communityResources);
  const implemented = new Set(resources.implemented);

  for (const resource of tables.platformPathResources) {
    if (communityResources.has(resource)) {
      problems.push(
        `resource type ${resource} is both a community resource and a platform path resource`,
      );
    }
  }

  for (const entry of tables.communityVisibility) {
    if (!communityResources.has(entry.resource)) {
      problems.push(`visibility entry ${entry.resource} is not a community resource`);
    }
  }

  for (const entry of tables.communityPermissions) {
    if (isPlatformPermission(entry.permission)) {
      problems.push(`community permission ${entry.permission} is a platform permission`);
    }
    if (!communityResources.has(entry.resource)) {
      problems.push(
        `community permission ${entry.permission} acts on ${entry.resource}, which is not a community resource`,
      );
    }
    if (entry.roles.length === 0) {
      problems.push(`community permission ${entry.permission} is not granted to any role`);
    }
    const seers = tables.communityVisibility.find((row) => row.resource === entry.resource)?.roles;
    for (const role of entry.roles) {
      if (seers === undefined || !seers.includes(role)) {
        problems.push(`role ${role} has ${entry.permission} but does not see ${entry.resource}`);
      }
    }
  }

  for (const entry of tables.platformPermissions) {
    if (!isPlatformPermission(entry.permission)) {
      problems.push(`platform permission ${entry.permission} is not a platform permission`);
    }
    if (entry.roles.length === 0) {
      problems.push(`platform permission ${entry.permission} is not granted to any role`);
    }
  }

  for (const resource of new Set(resources.used)) {
    if (!implemented.has(resource)) {
      problems.push(
        `resource type ${resource} is used in pathResources but has no PathResourceVisibility implementation`,
      );
    }
  }
  return problems;
}
