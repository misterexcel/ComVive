/**
 * Membership roles of a community (`docs/arquitectura.md` §3, "Control de acceso por rol").
 * Owner and tenant are both `resident`: what each sees inside the community is decided by the
 * unit and scope of the route (path resources, ADR 0009 step 3b) and by `visibleScopes`.
 */
export const COMMUNITY_ROLES = ['admin', 'committee', 'resident', 'concierge'] as const;
export type CommunityRole = (typeof COMMUNITY_ROLES)[number];

/** Roles of the ComVive team (ADR 0006; `docs/arquitectura.md` §3, "Usuarios de plataforma"). */
export const PLATFORM_ROLES = ['platform_support', 'platform_operations'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
