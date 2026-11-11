import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createAccessTestApp, type AccessDoubles } from './test-support/access-test-app.js';
import { FakeWebpayReturnVerifier, NEUTRAL_RETURN_URL } from './test-support/doubles.js';
import { COMMUNITY_A, TOKENS, UNIT_A1, UNIT_A2 } from './test-support/fixtures.js';
import {
  AuthEntryTestController,
  GatewayTestController,
  UnitPaymentsTestController,
  executed,
} from './test-support/test-controllers.js';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const payments = (unitId: string) => `/communities/${COMMUNITY_A}/units/${unitId}/payments`;
const gatewayReturn = `/gateway/webpay/communities/${COMMUNITY_A}/webpay-attempts/${UNIT_A1}/return`;
const MALFORMED_JSON = '{"amount": 10';
const OVER_LIMIT = JSON.stringify({ filler: 'x'.repeat(101 * 1024) });

/**
 * Stand-in for a global ValidationPipe with transform (class-validator is not a dependency yet):
 * it would turn "123" into 123. It follows the rule of decision 2 and leaves route params alone.
 */
@Injectable()
class TransformingGlobalPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'param') {
      return value;
    }
    return typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : value;
  }
}

describe('body is validated after the guards (decision 6; test 8)', () => {
  let app: NestExpressApplication;
  let doubles: AccessDoubles;
  let gateway: FakeWebpayReturnVerifier;

  beforeAll(async () => {
    gateway = new FakeWebpayReturnVerifier();
    ({ app, doubles } = await createAccessTestApp({
      controllers: [UnitPaymentsTestController, GatewayTestController, AuthEntryTestController],
      gateways: [gateway],
      providers: [{ provide: APP_PIPE, useClass: TransformingGlobalPipe }],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    executed.length = 0;
    gateway.seen.length = 0;
  });

  const post = (path: string, headers: Record<string, string>, body: string | Buffer) =>
    request(app.getHttpServer())
      .post(path)
      .set({ 'Content-Type': 'application/json', ...headers })
      .send(body);

  it.each([
    ['no session', {}, UNIT_A1, 401, { code: 'UNAUTHORIZED' }],
    ['no membership', bearer(TOKENS.noMembership), UNIT_A1, 404, { code: 'NOT_FOUND' }],
    [
      'a resident on a foreign unit',
      bearer(TOKENS.residentA1),
      UNIT_A2,
      404,
      { code: 'NOT_FOUND' },
    ],
    ['a unitId that is not a uuid', bearer(TOKENS.adminA), '123', 404, { code: 'NOT_FOUND' }],
    [
      'an uppercase uuid unitId',
      bearer(TOKENS.adminA),
      UNIT_A1.toUpperCase(),
      404,
      { code: 'NOT_FOUND' },
    ],
    [
      'a role that sees without permission',
      bearer(TOKENS.committeeA),
      UNIT_A1,
      403,
      { code: 'FORBIDDEN' },
    ],
    ['the permission', bearer(TOKENS.adminA), UNIT_A1, 400, { code: 'BAD_REQUEST' }],
  ])('malformed JSON with %s responds %#', async (_label, headers, unitId, status, body) => {
    const response = await post(payments(unitId), headers, MALFORMED_JSON);
    expect(response.status).toBe(status);
    expect(response.body).toEqual(body);
    expect(executed).toEqual([]);
  });

  it('a unitId that is not a uuid is 404 also with a well-formed body (never 400)', async () => {
    const response = await post(payments('not-a-uuid'), bearer(TOKENS.adminA), '{}');
    expect(response.status).toBe(404);
  });

  it('an unsupported charset with the permission is 400 BAD_REQUEST', async () => {
    const response = await request(app.getHttpServer())
      .post(payments(UNIT_A1))
      .set(bearer(TOKENS.adminA))
      .set('Content-Type', 'application/json; charset=klingon')
      .send('{}');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 'BAD_REQUEST' });
  });

  it('an unsupported Content-Encoding with the permission is 400 BAD_REQUEST', async () => {
    const response = await request(app.getHttpServer())
      .post(payments(UNIT_A1))
      .set(bearer(TOKENS.adminA))
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'br-unknown')
      .send('{}');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 'BAD_REQUEST' });
  });

  it('a non-JSON Content-Type is not parsed and reaches the handler with an empty body', async () => {
    const response = await request(app.getHttpServer())
      .post(payments(UNIT_A1))
      .set(bearer(TOKENS.adminA))
      .set('Content-Type', 'text/plain')
      .send('amount=1');
    expect(response.status).toBe(201);
    expect(response.body.body).toBeUndefined();
  });

  it.each([
    ['no session', {}],
    ['no membership', bearer(TOKENS.noMembership)],
    ['the permission', bearer(TOKENS.adminA)],
  ])('a body over the limit is 413 PAYLOAD_TOO_LARGE with %s', async (_label, headers) => {
    const response = await post(payments(UNIT_A1), headers, OVER_LIMIT);
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ code: 'PAYLOAD_TOO_LARGE' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(executed).toEqual([]);
  });

  it('a form body outside /gateway/ is not parsed', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .type('form')
      .send('refreshToken=abc');
    expect(response.status).toBe(201);
    expect(response.body.body).toBeUndefined();
  });

  it('with a global pipe, a valid unitId reaches the handler as unchanged text', async () => {
    const response = await post(payments(UNIT_A1), bearer(TOKENS.adminA), '{"amount":1}');
    expect(response.status).toBe(201);
    expect(response.body.unitId).toBe(UNIT_A1);
    expect(response.body.unitIdType).toBe('string');
  });

  it('with a global pipe, a unitId that is not a uuid is still 404', async () => {
    const response = await post(payments('123'), bearer(TOKENS.adminA), '{"amount":1}');
    expect(response.status).toBe(404);
  });

  describe('gateway routes answer the neutral 302 (ADR 0007, decision 4)', () => {
    it('malformed JSON is the neutral 302, never 400', async () => {
      const response = await post(gatewayReturn, {}, MALFORMED_JSON);
      expect(response.status).toBe(302);
      expect(response.headers['location']).toBe(NEUTRAL_RETURN_URL);
      expect(gateway.seen).toEqual([{ bodyUnreadable: true, body: undefined }]);
      expect(executed).toEqual([]);
    });

    it('a malformed form is the neutral 302', async () => {
      const response = await request(app.getHttpServer())
        .post(gatewayReturn)
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=klingon')
        .send('token_ws=ok');
      expect(response.status).toBe(302);
      expect(response.headers['location']).toBe(NEUTRAL_RETURN_URL);
    });

    it('a body over the limit is the neutral 302 with a webpay_return.rejected event, never 413', async () => {
      doubles.events.securityEvents.length = 0;
      const response = await request(app.getHttpServer())
        .post(gatewayReturn)
        .type('form')
        .send(`token_ws=${'x'.repeat(101 * 1024)}`);
      expect(response.status).toBe(302);
      expect(response.headers['location']).toBe(NEUTRAL_RETURN_URL);
      expect(doubles.events.securityEvents).toEqual([
        { name: 'webpay_return.rejected', reason: 'missing_params', httpMethod: 'POST' },
      ]);
      expect(executed).toEqual([]);
    });

    it('a valid form return reaches the handler with the TenantContext of the route (system actor)', async () => {
      const response = await request(app.getHttpServer())
        .post(gatewayReturn)
        .type('form')
        .send('token_ws=ok');
      expect(response.status).toBe(201);
      expect(response.body.body).toEqual({ token_ws: 'ok' });
      expect(response.body.tenant).toEqual({ communityId: COMMUNITY_A, actor: { type: 'system' } });
    });
  });

  // Test 9 (R2-m-2): the container survives the body parsers.
  it('a JSON POST sent in several chunks finds the container filled in the handler', async () => {
    const server = app.getHttpServer();
    if (!server.listening) {
      await new Promise<void>((resolve) => server.listen(0, resolve));
    }
    const { port } = server.address() as { port: number };
    const body = JSON.stringify({ amount: 1, note: 'y'.repeat(5000) });
    const { request: httpRequest } = await import('node:http');
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = httpRequest(
        {
          port,
          method: 'POST',
          path: payments(UNIT_A1),
          headers: {
            Authorization: `Bearer ${TOKENS.adminA}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let text = '';
          res.on('data', (chunk: Buffer) => (text += chunk.toString()));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: text }));
        },
      );
      req.on('error', reject);
      const third = Math.floor(body.length / 3);
      req.write(body.slice(0, third));
      setTimeout(() => {
        req.write(body.slice(third, 2 * third));
        setTimeout(() => req.end(body.slice(2 * third)), 10);
      }, 10);
    });
    expect(result.status).toBe(201);
    const parsed = JSON.parse(result.body) as { tenant: { communityId: string } };
    expect(parsed.tenant.communityId).toBe(COMMUNITY_A);
  });
});
