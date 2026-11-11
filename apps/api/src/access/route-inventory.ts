import { RequestMethod, type INestApplication } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, VERSION_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

import { wasCreatedByCreateApp } from '../configure-app.js';
import { AccessGuard } from './access.guard.js';
import { readAccessPolicies, type AccessPolicy } from './access-policy.js';
import { PATH_RESOURCE_VISIBILITIES, type PathResourceVisibility } from './ports.js';
import { ROUTE_EXCEPTIONS, type AppKind, type RouteException } from './route-exceptions.js';
import {
  hasRouteCommunity,
  pathSegments,
  routeParamNames,
  toPathTemplate,
} from './route-template.js';

export interface RouteInventoryEntry {
  /** HTTP method in uppercase (`GET`, `POST`, ... or `ALL` for `@All()`). */
  readonly method: string;
  /** Path as registered in Express, `/communities/:communityId/...`. */
  readonly expressPath: string;
  /** Normalized template, `/communities/{communityId}/...` (menor 3). */
  readonly pathTemplate: string;
  readonly policies: readonly AccessPolicy[];
  readonly versioned: boolean;
}

/** Internal NestJS application settings read by the inventory (ADR 0009, "Riesgos"). */
interface ApplicationConfigView {
  getGlobalPrefix(): string;
  getVersioning(): unknown;
  getGlobalGuards(): object[];
}

function configOf(app: INestApplication): ApplicationConfigView {
  return (app as unknown as { config: ApplicationConfigView }).config;
}

function asPaths(value: unknown): string[] {
  if (value === undefined) {
    return ['/'];
  }
  return (Array.isArray(value) ? value : [value]).map(String);
}

function joinPath(...parts: string[]): string {
  const segments = parts.flatMap(pathSegments);
  return `/${segments.join('/')}`;
}

/**
 * Every route of the registered controllers with its policies (ADR 0009, decision 4), read with
 * `DiscoveryService` and the route metadata of NestJS, including a global prefix if one is set.
 * Sorted by template and method.
 */
export function collectRouteInventory(app: INestApplication): RouteInventoryEntry[] {
  const discovery = app.get(DiscoveryService);
  const scanner = new MetadataScanner();
  const prefix = configOf(app).getGlobalPrefix();
  const entries: RouteInventoryEntry[] = [];

  for (const wrapper of discovery.getControllers()) {
    const controller = wrapper.metatype;
    if (typeof controller !== 'function') {
      continue;
    }
    const prototype = controller.prototype as Record<string, unknown>;
    const controllerVersion: unknown = Reflect.getMetadata(VERSION_METADATA, controller);
    for (const name of scanner.getAllMethodNames(prototype)) {
      const handler = prototype[name];
      if (typeof handler !== 'function') {
        continue;
      }
      const methodPath: unknown = Reflect.getMetadata(PATH_METADATA, handler);
      if (methodPath === undefined) {
        continue;
      }
      const requestMethod = (Reflect.getMetadata(METHOD_METADATA, handler) ??
        RequestMethod.GET) as RequestMethod;
      const handlerVersion: unknown = Reflect.getMetadata(VERSION_METADATA, handler);
      for (const controllerPath of asPaths(Reflect.getMetadata(PATH_METADATA, controller))) {
        for (const routePath of asPaths(methodPath)) {
          const expressPath = joinPath(prefix, controllerPath, routePath);
          entries.push({
            method: RequestMethod[requestMethod],
            expressPath,
            pathTemplate: toPathTemplate(expressPath),
            policies: readAccessPolicies(handler),
            versioned: (handlerVersion ?? controllerVersion) !== undefined,
          });
        }
      }
    }
  }

  return entries.sort(
    (a, b) =>
      a.pathTemplate.localeCompare(b.pathTemplate) ||
      a.method.localeCompare(b.method) ||
      a.expressPath.localeCompare(b.expressPath),
  );
}

// ---------------------------------------------------------------------------------------------
// Express stack (test 6)

interface ExpressLayer {
  name?: string;
  handle?: { length: number };
  route?: { path: string; methods: Record<string, boolean> };
}

/**
 * Layers of the Express router of the application, described (test 6): named middleware by name,
 * routes as `route METHOD path`, and the three anonymous NestJS layers by their position and
 * arity (the adapter hook first, the missing-route handler and the error handler last).
 */
export function describeExpressStack(app: INestApplication): string[] {
  const adapter = app.getHttpAdapter() as unknown as {
    getInstance(): { router?: { stack?: ExpressLayer[] } };
    onRequestHook?: unknown;
    onResponseHook?: unknown;
  };
  const stack = adapter.getInstance().router?.stack ?? [];
  const last = stack.length - 1;
  const hooksIdle = adapter.onRequestHook === undefined && adapter.onResponseHook === undefined;

  return stack.map((layer, index) => {
    if (layer.route !== undefined) {
      const methods = Object.entries(layer.route.methods)
        .filter(([, enabled]) => enabled)
        .map(([method]) => (method === '_all' ? 'ALL' : method.toUpperCase()));
      return `route ${methods.join(',')} ${layer.route.path}`;
    }
    const anonymous = layer.name === undefined || layer.name === '' || layer.name === '<anonymous>';
    const arity = layer.handle?.length;
    if (anonymous && index === 0 && arity === 3) {
      return hooksIdle ? 'nestjs-adapter-hooks' : 'nestjs-adapter-hooks (active)';
    }
    if (anonymous && index === last - 1 && arity === 3) {
      return 'nestjs-not-found';
    }
    if (anonymous && index === last && arity === 4) {
      return 'nestjs-error-handler';
    }
    return anonymous ? 'middleware <anonymous>' : (layer.name ?? '');
  });
}

/** Closed list of layers outside NestJS that `createApp` registers, in order (decision 7). */
const LAYERS_BEFORE_ROUTES = [
  'nestjs-adapter-hooks',
  'wrappedBodyParsers',
  'requestContextMiddleware',
];
const LAYERS_AFTER_ROUTES = ['nestjs-not-found', 'nestjs-error-handler'];

function expressStackDifference(
  app: INestApplication,
  inventory: readonly RouteInventoryEntry[],
): string | undefined {
  const stack = describeExpressStack(app);
  const before = stack.slice(0, LAYERS_BEFORE_ROUTES.length);
  const after = stack.slice(stack.length - LAYERS_AFTER_ROUTES.length);
  const routes = stack.slice(
    LAYERS_BEFORE_ROUTES.length,
    stack.length - LAYERS_AFTER_ROUTES.length,
  );
  const expectedRoutes = inventory.map((route) => `route ${route.method} ${route.expressPath}`);

  const sameLayers =
    JSON.stringify(before) === JSON.stringify(LAYERS_BEFORE_ROUTES) &&
    JSON.stringify(after) === JSON.stringify(LAYERS_AFTER_ROUTES);
  const sameRoutes =
    JSON.stringify([...routes].sort()) === JSON.stringify([...expectedRoutes].sort());
  if (sameLayers && sameRoutes) {
    return undefined;
  }
  return `expected ${JSON.stringify([...LAYERS_BEFORE_ROUTES, '<inventory routes>', ...LAYERS_AFTER_ROUTES])}, got ${JSON.stringify(stack)}`;
}

// ---------------------------------------------------------------------------------------------
// assertRouteInventory (startup and CI)

export class RouteInventoryError extends Error {
  constructor(readonly differences: readonly string[]) {
    super(`Route inventory does not match ADR 0009:\n- ${differences.join('\n- ')}`);
    this.name = 'RouteInventoryError';
  }
}

const NO_PARAMETER_KINDS = new Set(['identity', 'auth-entry', 'public-technical', 'internal-job']);

/** Required start of the path of each policy, read by segments (decision 2; ADR-0009-S5). */
const REQUIRED_PREFIX: Partial<Record<AccessPolicy['kind'], string[]>> = {
  identity: ['me'],
  'auth-entry': ['auth'],
  gateway: ['gateway'],
  platform: ['platform'],
  'internal-job': ['internal', 'jobs'],
};

function shapeDifferences(
  route: RouteInventoryEntry,
  policy: AccessPolicy,
  label: string,
): string[] {
  const differences: string[] = [];
  const segments = pathSegments(route.expressPath);

  if (policy.kind === 'community') {
    if (segments[0] !== 'communities' || segments[1] !== ':communityId') {
      differences.push(`${label} must start with /communities/:communityId (community policy)`);
    }
  } else if (segments[0] === 'communities') {
    differences.push(`${label} starts with communities and must use the community policy`);
  }

  const prefix = REQUIRED_PREFIX[policy.kind];
  if (
    prefix !== undefined &&
    (segments.length <= prefix.length ||
      prefix.some((segment, index) => segments[index] !== segment))
  ) {
    differences.push(`${label} (${policy.kind}) must start with /${prefix.join('/')}/`);
  }

  if (policy.kind === 'platform') {
    segments.forEach((segment, index) => {
      if (segment === ':communityId' && !(index === 2 && segments[1] === 'communities')) {
        differences.push(
          `${label} may only have :communityId as the third segment, after communities (R2-m-4)`,
        );
      }
    });
  }
  return differences;
}

function pathResourceDifferences(
  route: RouteInventoryEntry,
  policy: AccessPolicy,
  label: string,
  implemented: ReadonlySet<string>,
): string[] {
  const differences: string[] = [];
  const params = routeParamNames(route.expressPath);

  if (NO_PARAMETER_KINDS.has(policy.kind)) {
    if (params.length > 0) {
      differences.push(`${label} (${policy.kind}) must not have path parameters (D39)`);
    }
    return differences;
  }
  if (policy.kind !== 'community' && policy.kind !== 'platform') {
    return differences;
  }

  const routeCommunityIsChecked = hasRouteCommunity(route.expressPath, policy.kind);
  const declared: Readonly<Record<string, string>> = policy.pathResources ?? {};

  for (const param of params) {
    if (param === 'communityId' && routeCommunityIsChecked) {
      continue;
    }
    if (!(param in declared)) {
      differences.push(
        `${label} does not declare the path parameter ${param} in pathResources (D39)`,
      );
    }
  }
  for (const [param, resource] of Object.entries(declared)) {
    if (!params.includes(param)) {
      differences.push(`${label} declares pathResources.${param}, which is not a path parameter`);
    }
    if (!implemented.has(resource)) {
      differences.push(
        `resource type ${resource} of ${label} has no PathResourceVisibility implementation (D39)`,
      );
    }
  }
  return differences;
}

/** Every difference between the application and ADR 0009, decision 4 (checks 1 to 8). */
export function routeInventoryDifferences(
  app: INestApplication,
  appKind: AppKind,
  exceptions: readonly RouteException[] = ROUTE_EXCEPTIONS,
): string[] {
  const differences: string[] = [];
  const inventory = collectRouteInventory(app);
  const config = configOf(app);
  const implemented = new Set(
    app
      .get<symbol, readonly PathResourceVisibility[]>(PATH_RESOURCE_VISIBILITIES)
      .map((port) => port.resource),
  );

  // Check 8: the global guard and the single factory (menor 2).
  if (!wasCreatedByCreateApp(app)) {
    differences.push('the application was not created with createApp (ADR 0009, decision 7)');
  }
  if (!config.getGlobalGuards().some((guard) => guard instanceof AccessGuard)) {
    differences.push('AccessGuard is not registered as a global guard (APP_GUARD in AccessModule)');
  }
  // Check 5: versioning is not contemplated (M-3).
  if (config.getVersioning() !== undefined) {
    differences.push(
      'versioning is enabled (enableVersioning), which ADR 0009 does not contemplate',
    );
  }

  for (const route of inventory) {
    const label = `${route.method} ${route.pathTemplate}`;
    // Check 1.
    const [policy, ...others] = route.policies;
    if (policy === undefined) {
      differences.push(`${label} has no access policy`);
      continue;
    }
    if (others.length > 0) {
      differences.push(
        `${label} has ${route.policies.length} access policies; it must have exactly one`,
      );
      continue;
    }
    // Check 5.
    if (route.method === 'ALL') {
      differences.push(`${label} uses @All(), which ADR 0009 does not allow`);
    }
    if (/[*?+(){}]/.test(route.expressPath)) {
      differences.push(`${route.method} ${route.expressPath} has a wildcard or optional segment`);
    }
    if (route.versioned) {
      differences.push(`${label} declares a version, which ADR 0009 does not contemplate`);
    }
    // Check 4 (ADR 0008, decision 2).
    if (appKind === 'api' && policy.kind === 'internal-job') {
      differences.push(
        `${label}: the api must not register internal-job routes (ADR 0008, decision 2)`,
      );
    }
    if (appKind === 'worker' && policy.kind !== 'internal-job') {
      differences.push(
        `${label}: the worker only registers internal-job routes (ADR 0008, decision 2)`,
      );
    }
    // Check 3.
    differences.push(...shapeDifferences(route, policy, label));
    // Check 6 (M-1).
    if (
      policy.kind === 'community' &&
      route.method !== 'GET' &&
      route.method !== 'HEAD' &&
      policy.permission === undefined
    ) {
      differences.push(`${label} is an action and must declare a permission (M-1)`);
    }
    // Check 7 (D39).
    differences.push(...pathResourceDifferences(route, policy, label, implemented));
  }

  // Check 2: the routes with a policy other than community are exactly ROUTE_EXCEPTIONS.
  const key = (method: string, pathTemplate: string, policy: string) =>
    `${method} ${pathTemplate} (${policy})`;
  const registered = inventory.flatMap((route) =>
    route.policies.length === 1 && route.policies[0]?.kind !== 'community'
      ? [key(route.method, route.pathTemplate, route.policies[0]?.kind ?? '')]
      : [],
  );
  const listed = exceptions
    .filter((entry) => entry.app === appKind)
    .map((entry) => key(entry.method, entry.pathTemplate, entry.policy));
  for (const route of registered.filter((entry) => !listed.includes(entry))) {
    differences.push(`${route} is not in ROUTE_EXCEPTIONS for the ${appKind}`);
  }
  for (const entry of listed.filter((candidate) => !registered.includes(candidate))) {
    differences.push(`ROUTE_EXCEPTIONS lists ${entry} but the ${appKind} does not register it`);
  }

  // Check 8 and test 6: no layer outside the closed list of createApp (M-3; ADR-0009-S7).
  const stackDifference = expressStackDifference(app, inventory);
  if (stackDifference !== undefined) {
    differences.push(`Express stack differs from createApp: ${stackDifference}`);
  }
  return differences;
}

/**
 * Runs at startup (`main.ts` and `main.worker.ts`, after `app.init()` and before `listen`; if it
 * throws, the process exits and Cloud Run keeps the previous revision, D38) and in CI. Reads no
 * files (M-4).
 */
export function assertRouteInventory(
  app: INestApplication,
  appKind: AppKind,
  exceptions: readonly RouteException[] = ROUTE_EXCEPTIONS,
): void {
  const differences = routeInventoryDifferences(app, appKind, exceptions);
  if (differences.length > 0) {
    throw new RouteInventoryError(differences);
  }
}

// ---------------------------------------------------------------------------------------------
// assertExceptionsAuthorized (CI only: the image does not include docs/)

const ACCEPTED_STATUSES = new Set(['Aprobado', 'Aceptado']);

/**
 * Status of an ADR (R2-m-8): the first line that, without the `**`, starts with `- Estado:`, and
 * its first word after `Estado:`. Undefined without that line.
 */
export function adrStatus(markdown: string): string | undefined {
  for (const line of markdown.split(/\r?\n/)) {
    const plain = line.replaceAll('**', '').trim();
    if (plain.startsWith('- Estado:')) {
      const firstWord = plain.slice('- Estado:'.length).trim().split(/\s+/)[0] ?? '';
      return firstWord.replace(/[^\p{L}]/gu, '');
    }
  }
  return undefined;
}

/**
 * Fails if an entry of ROUTE_EXCEPTIONS does not cite an existing ADR of `adrDirectory` in status
 * Aprobado or Aceptado (ADR 0009, decision 4). Runs only in CI; file access is loaded lazily so
 * the startup check never touches the file system.
 */
export async function assertExceptionsAuthorized(
  adrDirectory: string,
  exceptions: readonly RouteException[] = ROUTE_EXCEPTIONS,
): Promise<void> {
  const { readFile, readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const files = await readdir(adrDirectory);
  const differences: string[] = [];

  for (const entry of exceptions) {
    const label = `${entry.app} ${entry.method} ${entry.pathTemplate}`;
    const number = /^ADR (\d{4})\b/.exec(entry.authorizedBy)?.[1];
    if (number === undefined) {
      differences.push(`${label}: authorizedBy "${entry.authorizedBy}" does not name an ADR`);
      continue;
    }
    const file = files.find((name) => name.startsWith(`${number}-`) && name.endsWith('.md'));
    if (file === undefined) {
      differences.push(`${label}: ADR ${number} does not exist in ${adrDirectory}`);
      continue;
    }
    const status = adrStatus(await readFile(join(adrDirectory, file), 'utf8'));
    if (status === undefined) {
      differences.push(`${label}: ADR ${number} has no status line`);
    } else if (!ACCEPTED_STATUSES.has(status)) {
      differences.push(`${label}: ADR ${number} is ${status}, not Aprobado or Aceptado`);
    }
  }

  if (differences.length > 0) {
    throw new Error(`ROUTE_EXCEPTIONS cites unauthorized ADRs:\n- ${differences.join('\n- ')}`);
  }
}
