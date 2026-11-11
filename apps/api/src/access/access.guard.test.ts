import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createAccessTestApp, type AccessDoubles } from './test-support/access-test-app.js';
import {
  ADMIN_MEMBERSHIP_A,
  ADMIN_MEMBERSHIP_B,
  ATTEMPT_AUTHORIZED_A,
  ATTEMPT_IN_REVIEW_A,
  COMMITTEE_MEMBERSHIP_A,
  COMMUNITY_A,
  COMMUNITY_B,
  COMMUNITY_MISSING,
  REVOKED_ADMIN_MEMBERSHIP_A,
  TOKENS,
  UNIT_A1,
  UNIT_A2,
  UNIT_B1,
} from './test-support/fixtures.js';
import {
  AuthEntryTestController,
  BillingConfigTestController,
  DoublePolicyTestController,
  GatewayTestController,
  IdentityTestController,
  InternalJobsTestController,
  PlatformTestController,
  UndecoratedTestController,
  UnitPaymentsTestController,
  executed,
} from './test-support/test-controllers.js';

const NOT_FOUND = { code: 'NOT_FOUND' };
const FORBIDDEN = { code: 'FORBIDDEN' };
const UNAUTHORIZED = { code: 'UNAUTHORIZED' };

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const payments = (communityId: string, unitId: string) =>
  `/communities/${communityId}/units/${unitId}/payments`;

const CONTROLLERS = [
  UnitPaymentsTestController,
  BillingConfigTestController,
  UndecoratedTestController,
  DoublePolicyTestController,
  IdentityTestController,
  AuthEntryTestController,
  GatewayTestController,
  PlatformTestController,
];

describe('AccessGuard', () => {
  let app: NestExpressApplication;
  let doubles: AccessDoubles;

  beforeAll(async () => {
    ({ app, doubles } = await createAccessTestApp({ controllers: CONTROLLERS }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    executed.length = 0;
    doubles.memberships.firstAccesses.length = 0;
  });

  const http = () => request(app.getHttpServer());

  // Test 1: a new route without a policy is denied.
  describe('route without a policy (test 1)', () => {
    it.each([
      ['no session', {}],
      ['a valid community session', bearer(TOKENS.adminA)],
      ['a valid platform session', bearer(TOKENS.operations)],
    ])('responds 404 NOT_FOUND with %s and never runs the method', async (_label, headers) => {
      const response = await http().get(`/communities/${COMMUNITY_A}/undecorated`).set(headers);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(NOT_FOUND);
      expect(executed).toEqual([]);
    });

    it('reports the programming error (Sentry event)', async () => {
      doubles.events.programmingErrors.length = 0;
      await http().get(`/communities/${COMMUNITY_A}/undecorated`);
      expect(doubles.events.programmingErrors).toHaveLength(1);
      expect(doubles.events.programmingErrors[0]).toMatch(/undecorated/);
    });
  });

  // Test 2 (runtime part): two policies on one method.
  it('denies a method with two policies with 404 and never runs it (test 2)', async () => {
    const response = await http()
      .get(`/communities/${COMMUNITY_A}/double-policy`)
      .set(bearer(TOKENS.adminA));

    expect(response.status).toBe(404);
    expect(response.body).toEqual(NOT_FOUND);
    expect(executed).toEqual([]);
  });

  // Test 3: order of the steps of a community route.
  describe('community route step order (test 3)', () => {
    const cases: [string, Record<string, string>, string, number, object][] = [
      ['no token', {}, UNIT_A1, 401, UNAUTHORIZED],
      [
        'a non-bearer authorization',
        { Authorization: `Basic ${TOKENS.adminA}` },
        UNIT_A1,
        401,
        UNAUTHORIZED,
      ],
      ['an expired or revoked session', bearer(TOKENS.expired), UNIT_A1, 401, UNAUTHORIZED],
      ['a platform session', bearer(TOKENS.operations), UNIT_A1, 404, NOT_FOUND],
      ['no membership', bearer(TOKENS.noMembership), UNIT_A1, 404, NOT_FOUND],
      ['a role that does not see the resource', bearer(TOKENS.conciergeA), UNIT_A1, 404, NOT_FOUND],
      ['a resident with another unit', bearer(TOKENS.residentA1), UNIT_A2, 404, NOT_FOUND],
      [
        'a resident with a unit of another community',
        bearer(TOKENS.residentA1),
        UNIT_B1,
        404,
        NOT_FOUND,
      ],
      ['a role that sees without permission', bearer(TOKENS.committeeA), UNIT_A1, 403, FORBIDDEN],
      [
        'a resident with own unit and no permission',
        bearer(TOKENS.residentA1),
        UNIT_A1,
        403,
        FORBIDDEN,
      ],
    ];

    it.each(cases)('with %s responds %#', async (_label, headers, unitId, status, body) => {
      const response = await http()
        .post(payments(COMMUNITY_A, unitId))
        .set(headers)
        .send({ amount: 1000 });

      expect(response.status).toBe(status);
      expect(response.body).toEqual(body);
      expect(executed).toEqual([]);
      expect(doubles.memberships.firstAccesses).toEqual([]);
    });

    it('checks the path resource (3b) before the permission (3c): foreign unit without permission is 404', async () => {
      const response = await http()
        .post(payments(COMMUNITY_A, UNIT_A2))
        .set(bearer(TOKENS.residentA1))
        .send({});
      expect(response.status).toBe(404);
    });

    it('lets a role with the permission through with the right TenantContext and sets first access', async () => {
      const response = await http()
        .post(payments(COMMUNITY_A, UNIT_A1))
        .set(bearer(TOKENS.adminA))
        .send({ amount: 1000 });

      expect(response.status).toBe(201);
      expect(response.body.tenant).toEqual({
        communityId: COMMUNITY_A,
        actor: { type: 'member', personId: 'admin-a', roles: ['admin'] },
      });
      expect(executed).toEqual(['register']);
      expect(doubles.memberships.firstAccesses).toEqual([
        { personId: 'admin-a', communityId: COMMUNITY_A, at: doubles.clock.current },
      ]);
    });

    it('passes the verified ids of earlier parameters and the context to the path resource port', async () => {
      doubles.units.checks.length = 0;
      await http().get(payments(COMMUNITY_A, UNIT_A1)).set(bearer(TOKENS.committeeA));
      expect(doubles.units.checks).toEqual([
        {
          tenant: {
            communityId: COMMUNITY_A,
            actor: { type: 'member', personId: 'committee-a', roles: ['committee'] },
          },
          id: UNIT_A1,
          previous: {},
        },
      ]);
    });

    it('joins the roles of several current memberships (ADR-0009-S4)', async () => {
      doubles.memberships.memberships.push({
        personId: 'resident-a1',
        communityId: COMMUNITY_A,
        role: 'committee',
      });
      try {
        const response = await http()
          .get(`/communities/${COMMUNITY_A}/billing-config`)
          .set(bearer(TOKENS.residentA1));
        expect(response.status).toBe(200);
        expect(response.body.tenant.actor.roles).toEqual(['resident', 'committee']);
      } finally {
        doubles.memberships.memberships.pop();
      }
    });
  });

  // Test 7: indistinguishable responses with a valid community session.
  describe('indistinguishable responses (test 7)', () => {
    const variableHeaders = new Set(['date', 'etag', 'connection', 'keep-alive']);
    const stable = (headers: Record<string, string>) =>
      Object.fromEntries(Object.entries(headers).filter(([name]) => !variableHeaders.has(name)));

    it('answers the same status, body and headers for every hidden case', async () => {
      const paths = [
        `/communities/${COMMUNITY_A}/does-not-exist`,
        `/communities/${COMMUNITY_MISSING}/billing-config`,
        `/communities/${COMMUNITY_B}/billing-config`,
        payments(COMMUNITY_A, UNIT_B1),
        `/communities/${COMMUNITY_A}/undecorated`,
      ];
      const responses = await Promise.all(
        paths.map((path) => http().get(path).set(bearer(TOKENS.adminA))),
      );
      const [first, ...rest] = responses;
      expect(first?.status).toBe(404);
      expect(first?.body).toEqual(NOT_FOUND);
      for (const response of rest) {
        expect(response.status).toBe(first?.status);
        expect(response.text).toBe(first?.text);
        expect(stable(response.headers)).toEqual(stable(first?.headers ?? {}));
      }
    });

    it('accepted risk (menor 4): without a session an existing community route is 401 and a missing one 404', async () => {
      const existing = await http().get(`/communities/${COMMUNITY_A}/billing-config`);
      const missing = await http().get(`/communities/${COMMUNITY_A}/does-not-exist`);
      expect(existing.status).toBe(401);
      expect(missing.status).toBe(404);
    });
  });

  // Test 9: isolation between communities and request context (with doubles).
  describe('isolation between communities and request context (test 9)', () => {
    it.each([
      ['community B', `/communities/${COMMUNITY_B}/billing-config`],
      ['a missing community', `/communities/${COMMUNITY_MISSING}/billing-config`],
      ['a communityId that is not a uuid', '/communities/not-a-uuid/billing-config'],
      ['community A in uppercase', `/communities/${COMMUNITY_A.toUpperCase()}/billing-config`],
      ['a trailing slash', `/communities/${COMMUNITY_A}/billing-config/`],
      ['an uppercase static segment', `/Communities/${COMMUNITY_A}/billing-config`],
    ])('a member of A gets 404 for %s', async (_label, path) => {
      const response = await http().get(path).set(bearer(TOKENS.adminA));
      expect(response.status).toBe(404);
      expect(response.body).toEqual(NOT_FOUND);
    });

    it('a member of A gets 2xx in A', async () => {
      const response = await http()
        .get(`/communities/${COMMUNITY_A}/billing-config`)
        .set(bearer(TOKENS.adminA));
      expect(response.status).toBe(200);
    });

    it('does not read the membership for a malformed communityId', async () => {
      doubles.memberships.reads.length = 0;
      await http().get('/communities/not-a-uuid/billing-config').set(bearer(TOKENS.adminA));
      expect(doubles.memberships.reads).toEqual([]);
    });

    it('cuts access on the next request after revoking the membership, with the same session', async () => {
      const membership = doubles.memberships.memberships.find((m) => m.personId === 'admin-a');
      if (membership === undefined) throw new Error('fixture');
      membership.revoked = true;
      try {
        const response = await http()
          .get(`/communities/${COMMUNITY_A}/billing-config`)
          .set(bearer(TOKENS.adminA));
        expect(response.status).toBe(404);
      } finally {
        membership.revoked = false;
      }
    });

    it('a membership with valid_from tomorrow (Chile time) is 404 today and 2xx tomorrow', async () => {
      // 2026-11-11 23:30 in Chile (UTC-3 in summer time) is 2026-11-12 02:30 UTC.
      doubles.clock.current = new Date('2026-11-12T02:30:00.000Z');
      doubles.memberships.memberships.push({
        personId: 'nobody',
        communityId: COMMUNITY_A,
        role: 'admin',
        validFrom: '2026-11-12',
      });
      try {
        const today = await http()
          .get(`/communities/${COMMUNITY_A}/billing-config`)
          .set(bearer(TOKENS.noMembership));
        expect(today.status).toBe(404);

        doubles.clock.current = new Date('2026-11-12T03:00:00.000Z');
        const tomorrow = await http()
          .get(`/communities/${COMMUNITY_A}/billing-config`)
          .set(bearer(TOKENS.noMembership));
        expect(tomorrow.status).toBe(200);
      } finally {
        doubles.memberships.memberships.pop();
        doubles.clock.current = new Date('2026-11-11T15:00:00.000Z');
      }
    });

    it('concurrent requests of two people to A and B each see their own TenantContext', async () => {
      const rounds = 25;
      const requests = Array.from({ length: rounds }, (_, index) =>
        index % 2 === 0
          ? http()
              .get(`/communities/${COMMUNITY_A}/billing-config`)
              .set(bearer(TOKENS.adminA))
              .then((response) => ['admin-a', COMMUNITY_A, response.body] as const)
          : http()
              .get(`/communities/${COMMUNITY_B}/billing-config`)
              .set(bearer(TOKENS.memberB))
              .then((response) => ['member-b', COMMUNITY_B, response.body] as const),
      );
      for (const [personId, communityId, body] of await Promise.all(requests)) {
        expect(body.tenant.communityId).toBe(communityId);
        expect(body.tenant.actor.personId).toBe(personId);
      }
    });

    it('on the same keep-alive connection, the next request of another person sees an empty container', async () => {
      const server = app.getHttpServer();
      if (!server.listening) {
        await new Promise<void>((resolve) => server.listen(0, resolve));
      }
      const agent = request.agent(server);
      const first = await agent
        .get(`/communities/${COMMUNITY_A}/billing-config`)
        .set(bearer(TOKENS.adminA))
        .set('Connection', 'keep-alive');
      const second = await agent
        .get('/me/communities')
        .set(bearer(TOKENS.memberB))
        .set('Connection', 'keep-alive');

      expect(first.body.tenant.communityId).toBe(COMMUNITY_A);
      expect(second.body.tenant).toBeNull();
      expect(second.body.identity).toEqual({ personId: 'member-b' });
    });
  });

  // Test 11 (parts that do not need PostgreSQL).
  describe('audiences, sessions and platform (test 11)', () => {
    it.each([
      [
        'a platform session on a community route',
        `/communities/${COMMUNITY_A}/billing-config`,
        TOKENS.support,
      ],
      ['a platform session on an identity route', '/me/communities', TOKENS.support],
      ['a community session on a platform route', '/platform/webpay-attempts', TOKENS.adminA],
      [
        'a platform session without second factor',
        '/platform/webpay-attempts',
        TOKENS.platformWithoutSecondFactor,
      ],
      [
        'platform_operations on a platform_support endpoint',
        '/platform/webpay-attempts',
        TOKENS.operations,
      ],
      [
        'a platform person without a current grant',
        '/platform/webpay-attempts',
        TOKENS.platformWithoutGrant,
      ],
    ])('%s is 404', async (_label, path, token) => {
      const response = await http().get(path).set(bearer(token));
      expect(response.status).toBe(404);
      expect(response.body).toEqual(NOT_FOUND);
      expect(executed).toEqual([]);
    });

    it('platform_support on a platform_operations endpoint is 404', async () => {
      const response = await http()
        .post(`/platform/communities/${COMMUNITY_A}/admin-memberships/${ADMIN_MEMBERSHIP_A}/revoke`)
        .set(bearer(TOKENS.support));
      expect(response.status).toBe(404);
    });

    it('a revoked PLATFORM_ROLE_GRANT is 404 on the next request', async () => {
      const ok = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
      expect(ok.status).toBe(200);
      doubles.grants.grants.set('support-1', []);
      try {
        const revoked = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
        expect(revoked.status).toBe(404);
      } finally {
        doubles.grants.grants.set('support-1', ['platform_support']);
      }
    });

    it.each([
      [`/communities/${COMMUNITY_A}/billing-config`, 'get'],
      ['/me/communities', 'get'],
      ['/platform/webpay-attempts', 'get'],
    ] as const)(
      'a refresh token or second factor challenge in Authorization is 401 on %s',
      async (path, method) => {
        for (const token of [TOKENS.refresh, TOKENS.secondFactorChallenge]) {
          const response = await http()[method](path).set(bearer(token));
          expect(response.status).toBe(401);
          expect(response.body).toEqual(UNAUTHORIZED);
        }
      },
    );

    it('an auth-entry route does not read Authorization and the method gets no person', async () => {
      doubles.sessions.calls.length = 0;
      const response = await http()
        .post('/auth/logout')
        .set(bearer(TOKENS.adminA))
        .send({ refreshToken: 'refresh-1' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        handler: 'logout',
        tenant: null,
        identity: null,
        body: { refreshToken: 'refresh-1' },
      });
      expect(doubles.sessions.calls).toEqual([]);
    });

    it('an identity route fills only the person, without a community', async () => {
      const response = await http().get('/me/communities').set(bearer(TOKENS.noMembership));
      expect(response.status).toBe(200);
      expect(response.body.identity).toEqual({ personId: 'nobody' });
      expect(response.body.tenant).toBeNull();
    });

    describe('admin membership revoke (H-41)', () => {
      const revoke = (communityId: string, membershipId: string) =>
        `/platform/communities/${communityId}/admin-memberships/${membershipId}/revoke`;

      it.each([
        ['a missing community', COMMUNITY_MISSING, ADMIN_MEMBERSHIP_A],
        ['a malformed community', 'not-a-uuid', ADMIN_MEMBERSHIP_A],
        ['a membership of another community', COMMUNITY_A, ADMIN_MEMBERSHIP_B],
        ['a committee membership', COMMUNITY_A, COMMITTEE_MEMBERSHIP_A],
        ['a malformed membership id', COMMUNITY_A, 'x'],
      ])('%s with malformed JSON is the same 404', async (_label, communityId, membershipId) => {
        const response = await http()
          .post(revoke(communityId, membershipId))
          .set(bearer(TOKENS.operations))
          .set('Content-Type', 'application/json')
          .send('{"reason":');
        expect(response.status).toBe(404);
        expect(response.body).toEqual(NOT_FOUND);
        expect(executed).toEqual([]);
      });

      it('a revoked admin membership of the community passes the guard (the service answers 409)', async () => {
        const response = await http()
          .post(revoke(COMMUNITY_A, REVOKED_ADMIN_MEMBERSHIP_A))
          .set(bearer(TOKENS.operations));
        expect(response.status).toBe(201);
      });

      it('with a valid one, the service sees the community of the route with a platform actor', async () => {
        const response = await http()
          .post(revoke(COMMUNITY_A, ADMIN_MEMBERSHIP_A))
          .set(bearer(TOKENS.operations));
        expect(response.status).toBe(201);
        expect(response.body.tenant).toEqual({
          communityId: COMMUNITY_A,
          actor: { type: 'platform', personId: 'ops-1', platformRole: 'platform_operations' },
        });
      });
    });

    it('an attempt outside in_review and reversal_pending with malformed JSON is 404 on resolution', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_AUTHORIZED_A}/resolution`)
        .set(bearer(TOKENS.support))
        .set('Content-Type', 'application/json')
        .send('{"decision":');
      expect(response.status).toBe(404);
      expect(response.body).toEqual(NOT_FOUND);
    });

    it('an attempt in review with malformed JSON passes the guard and gets 400', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution`)
        .set(bearer(TOKENS.support))
        .set('Content-Type', 'application/json')
        .send('{"decision":');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ code: 'BAD_REQUEST' });
    });

    it('runInCommunity inside a platform request sees B and the request keeps seeing A afterwards', async () => {
      const response = await http()
        .post(`/platform/communities/${COMMUNITY_A}/run-elsewhere`)
        .set(bearer(TOKENS.operations));
      expect(response.status).toBe(201);
      expect(response.body.inner).toEqual({ communityId: COMMUNITY_B, actor: { type: 'system' } });
      expect(response.body.tenant.communityId).toBe(COMMUNITY_A);
    });
  });

  // Test 12 (gateway part): a gateway route without a registered verifier is 404.
  it('a gateway route without a registered verifier responds 404 (test 12)', async () => {
    const response = await http().get(
      `/gateway/webpay/communities/${COMMUNITY_A}/webpay-attempts/${UNIT_A1}/return?token_ws=ok`,
    );
    expect(response.status).toBe(404);
    expect(response.body).toEqual(NOT_FOUND);
    expect(executed).toEqual([]);
  });
});

// Test 12: fail closed with the default ports.
describe('fail closed with the default session verifier (test 12)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    ({ app } = await createAccessTestApp({
      controllers: [...CONTROLLERS, InternalJobsTestController],
      sessionVerifier: 'default',
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    `/communities/${COMMUNITY_A}/billing-config`,
    '/me/communities',
    '/platform/webpay-attempts',
  ])('DenyAllSessionVerifier answers 401 on %s with any token', async (path) => {
    for (const token of Object.values(TOKENS)) {
      const response = await request(app.getHttpServer()).get(path).set(bearer(token));
      expect(response.status).toBe(401);
      expect(response.body).toEqual(UNAUTHORIZED);
    }
  });

  it('an internal-job route without an internal caller verifier is 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/jobs/tick')
      .set(bearer('any-oidc-token'));
    expect(response.status).toBe(404);
    expect(response.body).toEqual(NOT_FOUND);
  });
});
