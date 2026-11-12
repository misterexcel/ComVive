import { Logger, type NestApplicationOptions, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import express, { type Response } from 'express';

import { AccessExceptionFilter } from './access/access-exception.filter.js';
import { BodyParseErrorInterceptor } from './access/body-parse-error.interceptor.js';
import { createBodyParsers } from './access/body-parsers.js';
import {
  PlatformAccessAudit,
  PlatformAccessAuditInterceptor,
} from './access/platform-access-audit.js';
import {
  ACCESS_EVENT_LOG,
  GATEWAY_VERIFIERS,
  type AccessEventLog,
  type GatewayVerifier,
} from './access/ports.js';
import { requestContextMiddleware } from './access/request-context.js';
import { parseTrustProxyHops } from './config/trust-proxy-hops.js';

/** Options of every application: the body is parsed by the wrapped parsers (decision 6). */
export const APP_OPTIONS = { bodyParser: false } as const satisfies NestApplicationOptions;

/** A compiled `TestingModule` of `@nestjs/testing` (not a production dependency). */
interface CompiledTestingModule {
  createNestApplication<T>(httpAdapter: ExpressAdapter, options?: NestApplicationOptions): T;
}

// Applications created by createApp and the TRUST_PROXY_HOPS each one was created with.
const createdByFactory = new WeakMap<object, { trustProxyHops: number }>();

/** Whether the application was created by {@link createApp} (inventory check 8, menor 2). */
export function wasCreatedByCreateApp(app: object): boolean {
  return createdByFactory.has(app);
}

/** `TRUST_PROXY_HOPS` the application was created with (security m-4), if createApp made it. */
export function trustProxyHopsOf(app: object): number | undefined {
  return createdByFactory.get(app)?.trustProxyHops;
}

/**
 * First layer: no answer is cached (personal data from the first slice on) and no browser sniffs
 * a MIME type, neutral errors and the 413 of the body parser wrapper included (D62).
 */
function securityHeaders(_request: unknown, response: Response, next: () => void): void {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

const accessLogger = new Logger('Access');

/**
 * The single factory of the HTTP application (ADR 0009, decision 7, menor 2), used by `main.ts`,
 * `main.worker.ts` and every test that exercises access. No other code creates an application.
 *
 * Express settings go on the instance before NestJS builds its router, which ignores later
 * changes: no `X-Powered-By`, case sensitive and strict routing (one form per route) and
 * `trust proxy` as a number of hops from `TRUST_PROXY_HOPS` (never `true`; ADR-0009-S8).
 *
 * Layers before NestJS, in this order and only these: the wrapped body parsers, the request
 * context container and, at the end of the stack, the NestJS missing-route handler. CORS goes
 * first when the web exists. Then the global filter and the interceptors, platform audit first
 * so it wraps the body parser error interceptor.
 */
export async function createApp(
  target: Type<unknown> | CompiledTestingModule,
  env: NodeJS.ProcessEnv = process.env,
): Promise<NestExpressApplication> {
  const hops = parseTrustProxyHops(env['TRUST_PROXY_HOPS'], env['K_SERVICE']);

  const instance = express();
  instance.disable('x-powered-by');
  instance.set('case sensitive routing', true);
  instance.set('strict routing', true);
  instance.set('trust proxy', hops);
  const adapter = new ExpressAdapter(instance);

  const app =
    'createNestApplication' in target
      ? target.createNestApplication<NestExpressApplication>(adapter, APP_OPTIONS)
      : await NestFactory.create<NestExpressApplication>(target, adapter, APP_OPTIONS);

  const audit = app.get(PlatformAccessAudit);
  const events = app.get<symbol, AccessEventLog>(ACCESS_EVENT_LOG);
  const gateways = app.get<symbol, readonly GatewayVerifier[]>(GATEWAY_VERIFIERS);

  app.use(securityHeaders);
  app.use(
    createBodyParsers({
      gatewayNeutralRedirect: () =>
        gateways.find((gateway) => gateway.name === 'webpay-return')?.neutralRedirect(),
      gatewayBodyRejected: (httpMethod) =>
        events.securityEvent({
          name: 'webpay_return.rejected',
          reason: 'missing_params',
          httpMethod,
        }),
      platformPayloadTooLarge: (request) =>
        audit.recordBeforeRouting(request, { status: 413, code: 'PAYLOAD_TOO_LARGE' }),
      // Stays in the API log (ADR 0009, decision 6): method and first path segment, no body.
      requestAborted: (httpMethod, firstSegment) =>
        accessLogger.log(JSON.stringify({ requestAborted: { httpMethod, firstSegment } })),
    }),
  );
  app.use(requestContextMiddleware);

  app.useGlobalFilters(app.get(AccessExceptionFilter));
  app.useGlobalInterceptors(
    app.get(PlatformAccessAuditInterceptor),
    app.get(BodyParseErrorInterceptor),
  );

  createdByFactory.set(app, { trustProxyHops: hops });
  return app;
}
