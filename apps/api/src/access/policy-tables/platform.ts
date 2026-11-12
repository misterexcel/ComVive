import type { PlatformRole } from './roles.js';

/** Platform permissions (ADR 0006; `docs/arquitectura.md` §3, "Control de acceso por rol"). */
export const PLATFORM_PERMISSIONS = [
  'platform.webpay_review.read',
  'platform.webpay_review.resolve',
  'platform.admin_role.grant',
] as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

/**
 * Resources a platform route may name in its path (ADR 0009, decision 2;
 * `docs/arquitectura.md` §3, H-41 and R2-m-4).
 */
export const PLATFORM_PATH_RESOURCES = ['webpay-attempt', 'admin-membership'] as const;
export type PlatformPathResource = (typeof PLATFORM_PATH_RESOURCES)[number];

export interface PlatformPermissionEntry {
  readonly permission: string;
  readonly roles: readonly PlatformRole[];
  readonly source: string;
}

/**
 * Each platform role gets 404 on the endpoints of the other (ADR 0006, decision 1). Transcribed
 * from `docs/arquitectura.md` §3, "Usuarios de plataforma", and the spec "Usuarios y permisos".
 */
export const PLATFORM_PERMISSION_GRANTS: readonly PlatformPermissionEntry[] = [
  {
    permission: 'platform.webpay_review.read',
    roles: ['platform_support'],
    source:
      'docs/arquitectura.md §3, Usuarios de plataforma; spec gasto común, Usuarios y permisos',
  },
  {
    permission: 'platform.webpay_review.resolve',
    roles: ['platform_support'],
    source: 'docs/arquitectura.md §3, Usuarios de plataforma; spec gasto común F-16',
  },
  {
    permission: 'platform.admin_role.grant',
    roles: ['platform_operations'],
    source: 'docs/arquitectura.md §3, Quién otorga cada rol; ADR 0003, decisión 4',
  },
];
