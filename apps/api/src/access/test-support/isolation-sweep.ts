import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { AccessPolicy } from '../access-policy.js';
import { collectRouteInventory, type RouteInventoryEntry } from '../route-inventory.js';
import { routeParamNames } from '../route-template.js';

export interface SweepFixtures {
  /** Community of the test: every route is called with it. */
  readonly communityId: string;
  /** Valid session without membership in the community. */
  readonly withoutMembership: string;
  /** Valid session with membership only in another community. */
  readonly memberOfAnotherCommunity: string;
  /** Session with a membership in the community whose roles see the resource of the route. */
  readonly memberOfCommunity: (route: RouteInventoryEntry) => string;
  /** Id of a resource of that type visible in the community (fills the other parameters). */
  readonly visibleId: (resource: string) => string | undefined;
  /** Id of a resource of that type from another community. */
  readonly foreignId: (resource: string) => string | undefined;
}

export interface SweepMismatch {
  readonly route: string;
  readonly case: string;
  readonly status: number;
  readonly body: unknown;
  readonly expected: { status: number; body: unknown };
}

export interface SweepResult {
  readonly routesSwept: number;
  readonly casesRun: number;
  readonly mismatches: SweepMismatch[];
}

const UNAUTHORIZED = { status: 401, body: { code: 'UNAUTHORIZED' } };
const NOT_FOUND = { status: 404, body: { code: 'NOT_FOUND' } };

type CommunityPolicy = Extract<AccessPolicy, { kind: 'community' }>;

/**
 * Isolation sweep of ADR 0009, test 10: for every `community` route of the inventory, with body
 * `{}` and the community of the test, compares status and exact body for: no session (401), a
 * session without membership (404), a member of another community (404) and, as a member of the
 * community, each path resource filled one at a time with a resource of another community (404).
 * It does not replace the isolation test of each endpoint (ADR 0002, decision 5).
 */
export async function runIsolationSweep(
  app: INestApplication,
  fixtures: SweepFixtures,
): Promise<SweepResult> {
  const server = app.getHttpServer();
  const mismatches: SweepMismatch[] = [];
  let casesRun = 0;
  let routesSwept = 0;

  for (const route of collectRouteInventory(app)) {
    const [policy, ...others] = route.policies;
    if (policy?.kind !== 'community' || others.length > 0) {
      continue;
    }
    routesSwept += 1;
    const declared: Readonly<Record<string, string>> =
      (policy as CommunityPolicy).pathResources ?? {};
    const params = routeParamNames(route.expressPath).filter((name) => name !== 'communityId');

    const pathWith = (overrides: Record<string, string>): string | undefined => {
      let path = route.expressPath.replace(':communityId', fixtures.communityId);
      for (const name of params) {
        const resource = declared[name];
        const id =
          overrides[name] ?? (resource === undefined ? undefined : fixtures.visibleId(resource));
        if (id === undefined) {
          return undefined;
        }
        path = path.replace(`:${name}`, encodeURIComponent(id));
      }
      return path;
    };

    const call = async (
      label: string,
      path: string | undefined,
      token: string | undefined,
      expected: { status: number; body: unknown },
    ) => {
      const routeLabel = `${route.method} ${route.pathTemplate}`;
      if (path === undefined) {
        mismatches.push({
          route: routeLabel,
          case: `${label}: no fixture id for a path parameter`,
          status: 0,
          body: null,
          expected,
        });
        return;
      }
      casesRun += 1;
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
      let pending = request(server)[method](path);
      if (token !== undefined) {
        pending = pending.set('Authorization', `Bearer ${token}`);
      }
      if (method !== 'get' && method !== 'delete') {
        pending = pending.send({});
      }
      const response = await pending;
      if (
        response.status !== expected.status ||
        JSON.stringify(response.body) !== JSON.stringify(expected.body)
      ) {
        mismatches.push({
          route: routeLabel,
          case: label,
          status: response.status,
          body: response.body as unknown,
          expected,
        });
      }
    };

    const basePath = pathWith({});
    await call('no session', basePath, undefined, UNAUTHORIZED);
    await call('session without membership', basePath, fixtures.withoutMembership, NOT_FOUND);
    await call(
      'member of another community',
      basePath,
      fixtures.memberOfAnotherCommunity,
      NOT_FOUND,
    );
    for (const name of params) {
      const resource = declared[name];
      const foreign = resource === undefined ? undefined : fixtures.foreignId(resource);
      await call(
        `foreign ${resource ?? 'undeclared'} in ${name}`,
        foreign === undefined ? undefined : pathWith({ [name]: foreign }),
        fixtures.memberOfCommunity(route),
        NOT_FOUND,
      );
    }
  }

  return { routesSwept, casesRun, mismatches };
}
