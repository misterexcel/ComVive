import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';

import { NEUTRAL_BODIES, PlatformAuditUnavailableException } from './access-errors.js';
import { isGatewayPath, isPlatformPath } from './route-template.js';

/** Body limit: the Express default (ADR-0009-S3). */
export const BODY_LIMIT = '100kb';

const DEFERRED_BODY_ERROR = Symbol('comvive:deferred-body-error');

type RequestWithDeferredError = Request & { [DEFERRED_BODY_ERROR]?: unknown };

/** Whether the body parsers left an error for after the guard (decision 6). */
export function hasDeferredBodyError(request: Request): boolean {
  return (request as RequestWithDeferredError)[DEFERRED_BODY_ERROR] !== undefined;
}

export interface BodyParserHooks {
  /** Neutral redirect of the Webpay return, if its verifier is registered. */
  gatewayNeutralRedirect(): string | undefined;
  /** Security event `webpay_return.rejected` with reason `missing_params`. */
  gatewayBodyRejected(httpMethod: string): void;
  /** Minimal anonymous audit row of a 413 under `/platform/` (D41, R2-m-1). */
  platformPayloadTooLarge(request: Request): Promise<void>;
  /** A request the client aborted: no useful answer, it stays in the API log. */
  requestAborted(httpMethod: string): void;
}

function bodyParserErrorType(error: unknown): string | undefined {
  const type = (error as { type?: unknown } | null)?.type;
  return typeof type === 'string' ? type : undefined;
}

/**
 * JSON parser for every path and form parser only under `/gateway/` (Transbank return), wrapped
 * so that only a body over the limit is answered before the guard (ADR 0009, decision 6, menor 1):
 *
 * - `entity.too.large`: 413 `PAYLOAD_TOO_LARGE` (under `/platform/`, after its anonymous audit
 *   row); under `/gateway/`, the neutral 302 of ADR 0007 with its security event.
 * - `request.aborted`: dropped, no answer.
 * - any other error: kept in the request; the body parser error interceptor answers 400 after the
 *   guard, or the gateway verifier treats it as missing parameters.
 */
export function createBodyParsers(hooks: BodyParserHooks): RequestHandler {
  const json = express.json({ limit: BODY_LIMIT });
  const form = express.urlencoded({ limit: BODY_LIMIT, extended: false });

  const answerAuditFailure = (response: Response, error: unknown): void => {
    if (error instanceof PlatformAuditUnavailableException) {
      response.status(503).json(NEUTRAL_BODIES[503]);
      return;
    }
    // PlatformAuditFailedException or anything unexpected: the 413 cannot go out unaudited.
    response.status(500).json(NEUTRAL_BODIES[500]);
  };

  const onError = (error: unknown, request: Request, response: Response, next: NextFunction) => {
    const type = bodyParserErrorType(error);
    const gateway = isGatewayPath(request.path);

    if (type === 'request.aborted') {
      hooks.requestAborted(request.method);
      return;
    }
    if (type === 'entity.too.large') {
      if (gateway) {
        const redirectTo = hooks.gatewayNeutralRedirect();
        if (redirectTo === undefined) {
          response.status(404).json(NEUTRAL_BODIES[404]);
          return;
        }
        hooks.gatewayBodyRejected(request.method);
        response.redirect(302, redirectTo);
        return;
      }
      if (isPlatformPath(request.path)) {
        hooks.platformPayloadTooLarge(request).then(
          () => response.status(413).json(NEUTRAL_BODIES[413]),
          (auditError: unknown) => answerAuditFailure(response, auditError),
        );
        return;
      }
      response.status(413).json(NEUTRAL_BODIES[413]);
      return;
    }

    (request as RequestWithDeferredError)[DEFERRED_BODY_ERROR] = error;
    request.body = undefined;
    next();
  };

  return function wrappedBodyParsers(request: Request, response: Response, next: NextFunction) {
    const parsers = isGatewayPath(request.path) ? [json, form] : [json];
    const runFrom = (index: number): void => {
      const parser = parsers[index];
      if (parser === undefined) {
        next();
        return;
      }
      void parser(request, response, (error?: unknown) => {
        if (error !== undefined && error !== null) {
          onError(error, request, response, next);
          return;
        }
        runFrom(index + 1);
      });
    };
    runFrom(0);
  };
}
