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
} from './access-errors.js';
import { PlatformAccessAudit } from './platform-access-audit.js';
import { isPlatformPath } from './route-template.js';

type Answer =
  | {
      readonly kind: 'json';
      readonly status: number;
      readonly body: unknown;
      readonly code: string | null;
    }
  | { readonly kind: 'redirect'; readonly location: string };

const INTERNAL_ERROR_BODY = { statusCode: 500, message: 'Internal server error' };

/**
 * Global filter registered by `createApp` (ADR 0009, decision 3, "Cuerpos únicos"; menor 5).
 * Normalizes every 401, 403 and 404, whoever throws it (the guard, a service with
 * `new NotFoundException('Unidad 123')` or NestJS for a missing route): only the code, never a
 * message. Under `/platform/` it writes the access row of any rejection that has none yet.
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

    let answer = this.answerFor(exception);
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
        answer = this.answerFor(auditError);
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

  private answerFor(exception: unknown): Answer {
    if (exception instanceof GatewayRejectedException) {
      return { kind: 'redirect', location: exception.redirectTo };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 401 || status === 403 || status === 404) {
        const body = NEUTRAL_BODIES[status];
        return { kind: 'json', status, body, code: body.code };
      }
      const raw = exception.getResponse();
      const body = typeof raw === 'string' ? { statusCode: status, message: raw } : raw;
      const code =
        typeof (body as { code?: unknown }).code === 'string'
          ? (body as { code: string }).code
          : null;
      return { kind: 'json', status, body, code };
    }
    if (!(exception instanceof PlatformAuditFailedException)) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.name) : 'Unknown error thrown',
      );
    }
    return { kind: 'json', status: 500, body: INTERNAL_ERROR_BODY, code: null };
  }
}
