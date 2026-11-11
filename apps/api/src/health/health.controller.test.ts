import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { createApp } from '../configure-app.js';

// The test app is created with createApp, the same factory as main.ts (ADR 0009, menor 2).
describe('GET /health', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await createApp(moduleRef, { TRUST_PROXY_HOPS: '0' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 200 with status ok and no business data', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('does not reveal the framework in X-Powered-By', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  // ADR 0009, test 4: accessible without a session; the guard does not read Authorization.
  it.each([
    ['no token', undefined],
    ['an invalid token', 'Bearer not-a-token'],
    ['an expired token', 'Bearer expired-session-token'],
    ['a malformed Authorization header', 'Basic xyz'],
  ])('responds exactly { status: ok } with %s', async (_label, authorization) => {
    const call = request(app.getHttpServer()).get('/health');
    const response = await (authorization === undefined
      ? call
      : call.set('Authorization', authorization));

    expect(response.status).toBe(200);
    expect(response.text).toBe('{"status":"ok"}');
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  it('answers 404 NOT_FOUND to /health/ (strict routing) and to /HEALTH (case sensitive)', async () => {
    for (const path of ['/health/', '/HEALTH']) {
      const response = await request(app.getHttpServer()).get(path);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ code: 'NOT_FOUND' });
    }
  });

  // D62: no caching of any answer and no MIME sniffing, neutral 404s included.
  it.each(['/health', '/no-such-route', '/communities/x/units'])(
    'answers %s with Cache-Control: no-store and X-Content-Type-Options: nosniff',
    async (path) => {
      const response = await request(app.getHttpServer()).get(path);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    },
  );

  // ADR 0009, test 12 with the real ports: until the audit pool exists, every /platform/ request
  // fails closed with 500, also for a missing route (D64).
  it('answers 500 INTERNAL_ERROR to any /platform/ request while the audit writer is unavailable', async () => {
    for (const path of ['/platform/anything', '/platform/webpay-attempts']) {
      const response = await request(app.getHttpServer()).get(path);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: 'INTERNAL_ERROR' });
    }
  });

  // ADR 0009, test 12: the api does not load the worker routes.
  it('answers 404 NOT_FOUND to POST /internal/jobs/tick in the api', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/jobs/tick')
      .set('Authorization', 'Bearer any-oidc-token');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: 'NOT_FOUND' });
  });
});
