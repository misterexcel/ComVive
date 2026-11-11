import type { IncomingMessage, ServerResponse } from 'node:http';
import { connect } from 'node:net';

import { ConflictException, Controller, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { createApp } from '../configure-app.js';
import { PlatformRoute } from './access-policy.js';
import type { PlatformAccessAuditRow } from './ports.js';
import { createAccessTestApp, type AccessDoubles } from './test-support/access-test-app.js';
import {
  ADMIN_MEMBERSHIP_A,
  ADMIN_MEMBERSHIP_B,
  ATTEMPT_AUTHORIZED_A,
  ATTEMPT_IN_REVIEW_A,
  COMMUNITY_A,
  COMMUNITY_MISSING,
  TOKENS,
  testPlatformResource,
} from './test-support/fixtures.js';
import {
  BillingConfigTestController,
  PlatformTestController,
  executed,
} from './test-support/test-controllers.js';

@Controller('platform')
class PlatformConflictTestController {
  @Post('webpay-attempts/:attemptId/resolution-preview')
  @PlatformRoute({
    permission: 'platform.webpay_review.resolve',
    pathResources: { attemptId: testPlatformResource('webpay-attempt') },
  })
  preview(): never {
    throw new ConflictException({ code: 'PREVIEW_OUTDATED' });
  }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const revoke = (communityId: string, membershipId: string) =>
  `/platform/communities/${communityId}/admin-memberships/${membershipId}/revoke`;
const ANONYMOUS_KEYS = [
  'action',
  'actorType',
  'code',
  'httpMethod',
  'occurredAt',
  'routeTemplate',
  'status',
  'truncatedIp',
];

describe('platform access audit (ADR 0009, decision 3; test 11)', () => {
  let app: NestExpressApplication;
  let doubles: AccessDoubles;

  beforeAll(async () => {
    ({ app, doubles } = await createAccessTestApp({
      controllers: [
        PlatformTestController,
        PlatformConflictTestController,
        BillingConfigTestController,
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    executed.length = 0;
    doubles.audit.rows.length = 0;
    doubles.audit.writes = 0;
    doubles.audit.mode = 'ok';
    doubles.audit.delayMs = 0;
    doubles.events.securityEvents.length = 0;
  });

  const http = () => request(app.getHttpServer());
  const onlyRow = (): PlatformAccessAuditRow => {
    expect(doubles.audit.rows).toHaveLength(1);
    const [row] = doubles.audit.rows;
    if (row === undefined) throw new Error('no audit row');
    return row;
  };

  describe('with an identified platform person', () => {
    it('a read of the cross-community list leaves one platform row with community_id null (D46)', async () => {
      const response = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
      expect(response.status).toBe(200);
      expect(onlyRow()).toEqual({
        action: 'platform.request',
        actorType: 'platform',
        personId: 'support-1',
        platformRole: 'platform_support',
        communityId: null,
        routeTemplate: '/platform/webpay-attempts',
        httpMethod: 'GET',
        occurredAt: doubles.clock.current,
        status: 200,
        code: null,
        origin: expect.any(String),
      });
    });

    it('a missing communityId leaves the row with community_id null and its route template', async () => {
      const response = await http()
        .post(revoke(COMMUNITY_MISSING, ADMIN_MEMBERSHIP_A))
        .set(bearer(TOKENS.operations));
      expect(response.status).toBe(404);
      expect(onlyRow()).toMatchObject({
        actorType: 'platform',
        personId: 'ops-1',
        platformRole: 'platform_operations',
        communityId: null,
        routeTemplate:
          '/platform/communities/{communityId}/admin-memberships/{membershipId}/revoke',
        status: 404,
        code: 'NOT_FOUND',
      });
    });

    it('a membership of another community leaves the row with the community of the route (H-41)', async () => {
      const response = await http()
        .post(revoke(COMMUNITY_A, ADMIN_MEMBERSHIP_B))
        .set(bearer(TOKENS.operations));
      expect(response.status).toBe(404);
      expect(onlyRow()).toMatchObject({ communityId: COMMUNITY_A, code: 'NOT_FOUND' });
    });

    it('a rejection in step 3a (the other platform role) records the current roles of the person (D67)', async () => {
      await http().get('/platform/webpay-attempts').set(bearer(TOKENS.operations));
      expect(onlyRow()).toMatchObject({
        actorType: 'platform',
        personId: 'ops-1',
        platformRole: 'platform_operations',
        code: 'NOT_FOUND',
      });
    });

    it('a rejection of a person with several platform roles records them all, sorted and comma-separated (D67)', async () => {
      doubles.grants.grants.set('ops-1', ['platform_support', 'platform_operations']);
      try {
        await http()
          .post(revoke(COMMUNITY_MISSING, ADMIN_MEMBERSHIP_A))
          .set(bearer(TOKENS.operations));
        expect(onlyRow()).toMatchObject({
          platformRole: 'platform_operations,platform_support',
          code: 'NOT_FOUND',
        });
      } finally {
        doubles.grants.grants.set('ops-1', ['platform_operations']);
      }
    });

    it('a step 2 rejection (no current grant) records the person without a role', async () => {
      await http().get('/platform/webpay-attempts').set(bearer(TOKENS.platformWithoutGrant));
      expect(onlyRow()).toMatchObject({
        actorType: 'platform',
        personId: 'ops-gone',
        platformRole: null,
      });
    });

    it('an error of a port after identifying the person is audited as that platform person (m-2, security m-3)', async () => {
      const original = doubles.adminMemberships.isVisible.bind(doubles.adminMemberships);
      doubles.adminMemberships.isVisible = async () => {
        throw new Error('database unavailable');
      };
      try {
        const response = await http()
          .post(revoke(COMMUNITY_A, ADMIN_MEMBERSHIP_A))
          .set(bearer(TOKENS.operations));
        expect(response.status).toBe(500);
        expect(onlyRow()).toMatchObject({
          actorType: 'platform',
          personId: 'ops-1',
          platformRole: 'platform_operations',
          communityId: COMMUNITY_A,
          status: 500,
        });
      } finally {
        doubles.adminMemberships.isVisible = original;
      }
    });

    it('malformed JSON on a resolution is 400 with one row BAD_REQUEST written by the interceptor (TC-GC-CB-33 (e))', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution`)
        .set(bearer(TOKENS.support))
        .set('Content-Type', 'application/json')
        .send('{"decision":');
      expect(response.status).toBe(400);
      expect(onlyRow()).toMatchObject({ actorType: 'platform', status: 400, code: 'BAD_REQUEST' });
      expect(executed).toEqual([]);
    });

    it('a 409 PREVIEW_OUTDATED leaves one row with that code', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution-preview`)
        .set(bearer(TOKENS.support));
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ code: 'PREVIEW_OUTDATED' });
      expect(onlyRow()).toMatchObject({
        status: 409,
        code: 'PREVIEW_OUTDATED',
        communityId: COMMUNITY_A,
      });
    });

    it('a request on a visible attempt keeps the community of the attempt only in the audit row (D46, D65)', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution`)
        .set(bearer(TOKENS.support))
        .send({ decision: 'resolve_without_charge' });
      expect(response.status).toBe(201);
      expect(response.body.tenant).toBeNull();
      expect(onlyRow()).toMatchObject({ status: 201, communityId: COMMUNITY_A });
    });

    it('an existing attempt outside the view is audited with community_id null (D65)', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_AUTHORIZED_A}/resolution`)
        .set(bearer(TOKENS.support));
      expect(response.status).toBe(404);
      expect(onlyRow()).toMatchObject({ code: 'NOT_FOUND', communityId: null });
    });
  });

  describe('without an identified platform person: minimal anonymous row (D44)', () => {
    it.each([
      ['no token', {}, 401, 'UNAUTHORIZED'],
      ['an invalid token', bearer('not-a-session'), 401, 'UNAUTHORIZED'],
      ['a community session', bearer(TOKENS.adminA), 404, 'NOT_FOUND'],
      [
        'a platform session without second factor',
        bearer(TOKENS.platformWithoutSecondFactor),
        404,
        'NOT_FOUND',
      ],
    ])('%s', async (_label, headers, status, code) => {
      const response = await http().get('/platform/webpay-attempts').set(headers);
      expect(response.status).toBe(status);
      const row = onlyRow();
      expect(Object.keys(row).sort()).toEqual(ANONYMOUS_KEYS);
      expect(row).toMatchObject({
        action: 'platform.request',
        actorType: 'anonymous',
        routeTemplate: '/platform/webpay-attempts',
        httpMethod: 'GET',
        status,
        code,
      });
    });

    it('a missing route under /platform/ leaves one row with a null route template', async () => {
      const response = await http().get('/platform/nothing-here').set(bearer(TOKENS.support));
      expect(response.status).toBe(404);
      expect(onlyRow()).toMatchObject({
        actorType: 'anonymous',
        routeTemplate: null,
        code: 'NOT_FOUND',
      });
    });

    it('a body over the limit is 413 with one anonymous row and a null route template', async () => {
      const response = await http()
        .post(`/platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution`)
        .set(bearer(TOKENS.support))
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ filler: 'x'.repeat(101 * 1024) }));
      expect(response.status).toBe(413);
      expect(response.body).toEqual({ code: 'PAYLOAD_TOO_LARGE' });
      expect(onlyRow()).toMatchObject({
        actorType: 'anonymous',
        routeTemplate: null,
        httpMethod: 'POST',
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
      });
    });
  });

  it('a community request leaves no platform row', async () => {
    await http().get(`/communities/${COMMUNITY_A}/billing-config`).set(bearer(TOKENS.adminA));
    expect(doubles.audit.writes).toBe(0);
  });

  it('a request the client aborted leaves no row (accepted exception)', async () => {
    const server = app.getHttpServer();
    if (!server.listening) {
      await new Promise<void>((resolve) => server.listen(0, resolve));
    }
    const { port } = server.address() as { port: number };
    await new Promise<void>((resolve) => {
      const socket = connect(port, '127.0.0.1', () => {
        socket.write(
          `POST /platform/webpay-attempts/${ATTEMPT_IN_REVIEW_A}/resolution HTTP/1.1\r\n` +
            'Host: localhost\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{"a":',
        );
        setTimeout(() => {
          socket.destroy();
          resolve();
        }, 20);
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(doubles.audit.writes).toBe(0);
  });

  describe('failures of the audit itself (D43; R3-m-7)', () => {
    it('a failed write answers 500 instead of the rejection, with platform_audit.failed', async () => {
      doubles.audit.mode = 'fail';
      const response = await http().get('/platform/webpay-attempts');
      expect(response.status).toBe(500);
      expect(doubles.events.securityEvents).toEqual([
        {
          name: 'platform_audit.failed',
          routeTemplate: '/platform/webpay-attempts',
          httpMethod: 'GET',
          status: 500,
        },
      ]);
    });

    it('a failed write on a successful read answers 500, never the data', async () => {
      doubles.audit.mode = 'fail';
      const response = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
      expect(response.status).toBe(500);
      expect(response.body).not.toHaveProperty('handler');
    });

    it('an exhausted pool answers 503 SERVICE_UNAVAILABLE with platform_audit.unavailable', async () => {
      doubles.audit.mode = 'exhausted';
      const response = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ code: 'SERVICE_UNAVAILABLE' });
      expect(doubles.events.securityEvents).toMatchObject([
        { name: 'platform_audit.unavailable', status: 503 },
      ]);
    });

    it('a community request does not wait for a slow, exhausted audit pool', async () => {
      doubles.audit.mode = 'exhausted';
      doubles.audit.delayMs = 300;
      const order: string[] = [];
      await Promise.all([
        http()
          .get('/platform/webpay-attempts')
          .set(bearer(TOKENS.support))
          .then((response) => order.push(`platform ${response.status}`)),
        http()
          .get(`/communities/${COMMUNITY_A}/billing-config`)
          .set(bearer(TOKENS.adminA))
          .then((response) => order.push(`community ${response.status}`)),
      ]);
      expect(order).toEqual(['community 200', 'platform 503']);
    });
  });

  it('the response is not emitted before the audit write finishes (R3-m-1)', async () => {
    doubles.audit.delayMs = 50;
    const events: string[] = [];
    const originalWrite = doubles.audit.write.bind(doubles.audit);
    doubles.audit.write = async (row) => {
      await originalWrite(row);
      events.push('audit written');
    };
    const server = app.getHttpServer();
    const spy = (_req: IncomingMessage, res: ServerResponse) => {
      const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => ServerResponse;
      (res as { writeHead: unknown }).writeHead = (...args: unknown[]) => {
        events.push('response head');
        return writeHead(...args);
      };
    };
    server.on('request', spy);
    try {
      const response = await http().get('/platform/webpay-attempts').set(bearer(TOKENS.support));
      expect(response.status).toBe(200);
      expect(events).toEqual(['audit written', 'response head']);
    } finally {
      server.off('request', spy);
      doubles.audit.write = originalWrite;
    }
  });
});

// Test 16: client IP with TRUST_PROXY_HOPS (R2-M-3; ADR-0009-S8).
describe('client IP of the anonymous row (test 16)', () => {
  const apps: NestExpressApplication[] = [];
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it.each([
    ['1', '9.9.9.9, 1.2.3.4'],
    ['2', '9.9.9.9, 1.2.3.4, 35.1.1.1'],
  ])(
    'with TRUST_PROXY_HOPS=%s and X-Forwarded-For "%s" stores 1.2.3.0/24',
    async (hops, forwarded) => {
      const { app, doubles } = await createAccessTestApp({
        controllers: [PlatformTestController],
        env: { TRUST_PROXY_HOPS: hops },
      });
      apps.push(app);
      await request(app.getHttpServer())
        .get('/platform/webpay-attempts')
        .set('X-Forwarded-For', forwarded);
      expect(doubles.audit.rows).toMatchObject([
        { actorType: 'anonymous', truncatedIp: '1.2.3.0/24' },
      ]);
    },
  );

  it.each([
    ['missing', {}],
    ['0 on Cloud Run', { TRUST_PROXY_HOPS: '0', K_SERVICE: 'comvive-api' }],
    ['true', { TRUST_PROXY_HOPS: 'true' }],
    ['not numeric', { TRUST_PROXY_HOPS: 'two' }],
  ])('TRUST_PROXY_HOPS %s makes createApp fail', async (_label, env) => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await expect(createApp(moduleRef, env)).rejects.toThrow(/TRUST_PROXY_HOPS/);
  });
});
