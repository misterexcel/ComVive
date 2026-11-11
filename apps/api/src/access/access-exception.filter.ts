import {
  Catch,
  HttpException,
  Injectable,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  GatewayRejectedException,
  NEUTRAL_BODIES,
  PlatformAuditFailedException,
  PlatformAuditUnavailableException,
  isContractErrorBody,
  neutralBodyFor,
} from './access-errors.js';
import { PlatformAccessAudit, routeTemplateOf } from './platform-access-audit.js';
import { isPlatformPath } from './route-template.js';

type Answer =
  | {
      readonly kind: 'json';
      readonly status: number;
      readonly body: unknown;
      readonly code: string | null;
    }
  | { readonly kind: 'redirect'; readonly location: string };

const json = (status: number, body: { code: string }): Answer => ({
  kind: 'json',
  status,
  body,
  code: body.code,
});

/**
 * Global filter registered by `createApp` (ADR 0009, decision 3, "Cuerpos únicos"; menor 5).
 * Normalizes every 401, 403 and 404, whoever throws it (the guard, a service with
 * `new NotFoundException('Unidad 123')` or NestJS for a missing route): only the code. Any other
 * error answers its ADR 0003 contract body (`{ code, ... }`) or the neutral code of its status,
 * never a message (D60). Under `/platform/` it writes the access row of any rejection that has
 * none yet.
 */
@Catch()
@Injectable()
export class AccessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AccessExceptionFilter.name);

  constructor(private readonly audit: PlatformAccessAudit) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    let answer = this.answerFor(exception, request);
    const auditFailure =
      exception instanceof PlatformAuditFailedException ||
      exception instanceof PlatformAuditUnavailableException;
    if (isPlatformPath(request.path) && !auditFailure) {
      try {
        await this.audit.recordRequest(
          request,
          answer.kind === 'json'
            ? { status: answer.status, code: answer.code }
            : { status: 302, code: null },
        );
      } catch (auditError) {
        answer = this.answerFor(auditError, request);
      }
    }

    if (response.headersSent) {
      return;
    }
    if (answer.kind === 'redirect') {
      response.redirect(302, answer.location);
      return;
    }
    response.status(answer.status).json(answer.body);
  }

  private answerFor(exception: unknown, request: Request): Answer {
    if (exception instanceof GatewayRejectedException) {
      return { kind: 'redirect', location: exception.redirectTo };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // A 400 without a matched route comes from Express before the guard: a path parameter
      // that cannot be decoded. It answers like a missing route (D61).
      if (status === 400 && routeTemplateOf(request) === null) {
        return json(404, NEUTRAL_BODIES[404]);
      }
      if (status === 401 || status === 403 || status === 404) {
        return json(status, NEUTRAL_BODIES[status]);
      }
      const body = exception.getResponse();
      return isContractErrorBody(body)
        ? { kind: 'json', status, body, code: body.code }
        : json(status, neutralBodyFor(status));
    }
    if (!(exception instanceof PlatformAuditFailedException)) {
      this.logUnexpected(exception, request);
    }
    return json(500, NEUTRAL_BODIES[500]);
  }

  /**
   * Only the class, its code (`P2002` and similar) and the route template: the message and the
   * stack may carry personal data such as a RUT (security m-7; CLAUDE.md, rule 7).
   */
  private logUnexpected(exception: unknown, request: Request): void {
    const code = (exception as { code?: unknown } | null)?.code;
    this.logger.error(
      JSON.stringify({
        unexpectedError: exception instanceof Error ? exception.constructor.name : typeof exception,
        code: typeof code === 'string' || typeof code === 'number' ? code : undefined,
        httpMethod: request.method,
        routeTemplate: routeTemplateOf(request),
      }),
    );
  }
}
