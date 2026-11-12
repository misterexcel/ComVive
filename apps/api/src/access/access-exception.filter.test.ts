import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommunityRoute } from './access-policy.js';
import { createAccessTestApp, type AccessDoubles } from './test-support/access-test-app.js';
import {
  COMMUNITY_A,
  COMMUNITY_B,
  TOKENS,
  UNIT_A1,
  testResource,
} from './test-support/fixtures.js';
import {
  BillingConfigTestController,
  PlatformTestController,
  UnitPaymentsTestController,
} from './test-support/test-controllers.js';

const SECRET = 'El RUT 12.345.678-9 ya existe en la unidad 1203';

@Controller('communities/:communityId/errors')
class ThrowingServiceTestController {
  @Get('not-found')
  @CommunityRoute({ resource: testResource('billing-config') })
  notFound(): never {
    throw new NotFoundException('Unidad 123');
  }

  @Get('forbidden')
  @CommunityRoute({ resource: testResource('billing-config') })
  forbidden(): never {
    throw new ForbiddenException('No puedes ver la unidad 123');
  }

  @Get('bad-request-text')
  @CommunityRoute({ resource: testResource('billing-config') })
  badRequestText(): never {
    throw new BadRequestException(SECRET);
  }

  @Get('bad-request-object')
  @CommunityRoute({ resource: testResource('billing-config') })
  badRequestObject(): never {
    throw new BadRequestException({ field: 'rut', value: '12.345.678-9' });
  }

  @Get('unprocessable-text')
  @CommunityRoute({ resource: testResource('billing-config') })
  unprocessableText(): never {
    throw new HttpException(SECRET, 422);
  }

  @Get('contract-conflict')
  @CommunityRoute({ resource: testResource('billing-config') })
  contractConflict(): never {
    throw new ConflictException({ code: 'PREVIEW_OUTDATED' });
  }

  @Get('unexpected')
  @CommunityRoute({ resource: testResource('billing-config') })
  unexpected(): never {
    throw new Error(SECRET);
  }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const VARIABLE_HEADERS = new Set(['date', 'etag', 'connection', 'keep-alive']);
const stable = (headers: Record<string, string>) =>
  Object.fromEntries(Object.entries(headers).filter(([name]) => !VARIABLE_HEADERS.has(name)));

describe('AccessExceptionFilter bodies (D60; security m-1, m-7; cross M-2, M-3)', () => {
  let app: NestExpressApplication;
  let doubles: AccessDoubles;

  beforeAll(async () => {
    ({ app, doubles } = await createAccessTestApp({
      controllers: [
        ThrowingServiceTestController,
        BillingConfigTestController,
        UnitPaymentsTestController,
        PlatformTestController,
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    doubles.audit.rows.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const http = () => request(app.getHttpServer());
  const asAdmin = (path: string) => http().get(path).set(bearer(TOKENS.adminA));
  const errors = (name: string) => `/communities/${COMMUNITY_A}/errors/${name}`;

  // Test 7: a service exception answers exactly like the guard.
  it.each([
    ['not-found', 404, { code: 'NOT_FOUND' }],
    ['forbidden', 403, { code: 'FORBIDDEN' }],
  ])('a service that throws on %s answers exactly the neutral body', async (name, status, body) => {
    const response = await asAdmin(errors(name));
    expect(response.status).toBe(status);
    expect(response.body).toEqual(body);
  });

  it('a service NotFoundException has the same status, body and headers as a guard 404 (test 7)', async () => {
    const fromService = await asAdmin(errors('not-found'));
    const fromGuard = await asAdmin(`/communities/${COMMUNITY_B}/billing-config`);
    expect(fromService.status).toBe(fromGuard.status);
    expect(fromService.text).toBe(fromGuard.text);
    expect(stable(fromService.headers)).toEqual(stable(fromGuard.headers));
  });

  it.each([
    ['bad-request-text', 400, { code: 'BAD_REQUEST' }],
    ['bad-request-object', 400, { code: 'BAD_REQUEST' }],
    ['unprocessable-text', 422, { code: 'UNPROCESSABLE_ENTITY' }],
    ['unexpected', 500, { code: 'INTERNAL_ERROR' }],
  ])(
    '%s never leaks its text: answers %s with the neutral code of its status',
    async (name, status, body) => {
      const response = await asAdmin(errors(name));
      expect(response.status).toBe(status);
      expect(response.body).toEqual(body);
      expect(response.text).not.toContain('12.345.678-9');
    },
  );

  it('a body with the ADR 0003 contract shape ({ code, ... }) passes through', async () => {
    const response = await asAdmin(errors('contract-conflict'));
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ code: 'PREVIEW_OUTDATED' });
  });

  it('an unexpected error is logged with its class and route template only, never its message or stack', async () => {
    const logged: unknown[] = [];
    vi.spyOn(Logger.prototype, 'error').mockImplementation((message: unknown) => {
      logged.push(message);
    });
    await asAdmin(errors('unexpected'));
    expect(logged).toHaveLength(1);
    const text = JSON.stringify(logged);
    expect(text).toContain('Error');
    expect(text).toContain('/communities/{communityId}/errors/unexpected');
    expect(text).not.toContain('12.345.678-9');
    expect(text).not.toContain('at ');
  });

  // D61: a path parameter that cannot be decoded answers like a missing route.
  describe('malformed percent-encoding in a path parameter (D61)', () => {
    it.each([
      ['communityId, anonymous', '/communities/%E0%A4%A/billing-config', {}],
      ['communityId, valid session', '/communities/%E0%A4%A/billing-config', bearer(TOKENS.adminA)],
      ['unitId, anonymous', `/communities/${COMMUNITY_A}/units/%E0/payments`, {}],
      [
        'unitId, valid session',
        `/communities/${COMMUNITY_A}/units/%E0/payments`,
        bearer(TOKENS.adminA),
      ],
    ])('%s answers 404 NOT_FOUND like a missing route', async (_label, path, headers) => {
      const response = await http().get(path).set(headers);
      const missing = await http().get(`/communities/${COMMUNITY_A}/no-such-route`).set(headers);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ code: 'NOT_FOUND' });
      expect(stable(response.headers)).toEqual(stable(missing.headers));
      expect(response.text).not.toContain('%E0');
    });

    it('under /platform/ answers 404 with one anonymous row without route template', async () => {
      const response = await http()
        .post(`/platform/communities/%E0/admin-memberships/${UNIT_A1}/revoke`)
        .set(bearer(TOKENS.operations));
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ code: 'NOT_FOUND' });
      expect(doubles.audit.rows).toMatchObject([
        { actorType: 'anonymous', routeTemplate: null, status: 404, code: 'NOT_FOUND' },
      ]);
    });
  });
});
