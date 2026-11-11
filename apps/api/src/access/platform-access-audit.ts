import {
  HttpException,
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, concatMap, from, throwError, type Observable } from 'rxjs';

import {
  GatewayRejectedException,
  NEUTRAL_BODIES,
  PlatformAuditFailedException,
  PlatformAuditUnavailableException,
} from './access-errors.js';
import { truncateClientIp } from './client-ip.js';
import {
  ACCESS_EVENT_LOG,
  CLOCK,
  PLATFORM_AUDIT_WRITER,
  PlatformAuditPoolExhaustedError,
  type AccessEventLog,
  type Clock,
  type PlatformAccessAuditRow,
  type PlatformAuditWriter,
} from './ports.js';
import {
  currentRequestContainer,
  type PlatformPrincipal,
  type RequestContainer,
} from './request-context.js';
import { isPlatformPath, toPathTemplate } from './route-template.js';

/** Platform person and existing community the guard identified before a rejection. */
export interface IdentifiedPlatformRequest {
  readonly principal?: PlatformPrincipal;
  readonly communityId: string | null;
}

export interface RequestOutcome {
  readonly status: number;
  readonly code: string | null;
}

/** Status and error code a thrown value ends up answering (for the audit row). */
export function outcomeOf(exception: unknown): RequestOutcome {
  if (exception instanceof GatewayRejectedException) {
    return { status: 302, code: null };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const neutral = (NEUTRAL_BODIES as Record<number, { code: string } | undefined>)[status];
    if (neutral !== undefined) {
      return { status, code: neutral.code };
    }
    const body = exception.getResponse();
    const code =
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { code?: unknown }).code === 'string'
        ? (body as { code: string }).code
        : null;
    return { status, code };
  }
  return { status: 500, code: null };
}

/** Route template of the matched Express route, or null when no route matched. */
export function routeTemplateOf(request: Request): string | null {
  const route = (request as { route?: { path?: unknown } }).route;
  return typeof route?.path === 'string' ? toPathTemplate(route.path) : null;
}

/**
 * Writes the platform access row (ADR 0009, decision 3, "Auditoría de plataforma"; D41, D43,
 * D44, D46): exactly one per request to `/platform/...`. Whoever writes it first marks the
 * container (R3-m-2), and the write finishes before the response is emitted (R3-m-1).
 */
@Injectable()
export class PlatformAccessAudit {
  constructor(
    @Inject(PLATFORM_AUDIT_WRITER) private readonly writer: PlatformAuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACCESS_EVENT_LOG) private readonly events: AccessEventLog,
  ) {}

  /**
   * Row of a request that reached the request container (guard, interceptor and filter).
   * `identified` carries the platform person the guard identified before rejecting, since a
   * rejected request never fills the container.
   */
  async recordRequest(
    request: Request,
    outcome: RequestOutcome,
    identified?: IdentifiedPlatformRequest,
  ): Promise<void> {
    const container = currentRequestContainer();
    if (container?.platformAccessAudited === true) {
      return;
    }
    if (container !== undefined) {
      container.platformAccessAudited = true;
    }
    await this.write(
      this.rowFor(request, container, outcome, routeTemplateOf(request), identified),
    );
  }

  /** Row of a request answered before routing (413 of the body parser wrapper): anonymous. */
  async recordBeforeRouting(request: Request, outcome: RequestOutcome): Promise<void> {
    await this.write(this.rowFor(request, undefined, outcome, null));
  }

  private rowFor(
    request: Request,
    container: RequestContainer | undefined,
    outcome: RequestOutcome,
    routeTemplate: string | null,
    identified?: IdentifiedPlatformRequest,
  ): PlatformAccessAuditRow {
    const common = {
      action: 'platform.request' as const,
      routeTemplate,
      httpMethod: request.method,
      occurredAt: this.clock.now(),
      status: outcome.status,
      code: outcome.code,
    };
    const platform = container?.platform ?? identified?.principal;
    if (platform === undefined) {
      return { ...common, actorType: 'anonymous', truncatedIp: truncateClientIp(request.ip) };
    }
    return {
      ...common,
      actorType: 'platform',
      personId: platform.personId,
      platformRole: platform.platformRole ?? null,
      communityId: container?.tenant?.communityId ?? identified?.communityId ?? null,
      origin: request.ip ?? null,
    };
  }

  private async write(row: PlatformAccessAuditRow): Promise<void> {
    try {
      await this.writer.write(row);
    } catch (error) {
      const unavailable = error instanceof PlatformAuditPoolExhaustedError;
      this.events.securityEvent({
        name: unavailable ? 'platform_audit.unavailable' : 'platform_audit.failed',
        routeTemplate: row.routeTemplate,
        httpMethod: row.httpMethod,
        status: unavailable ? 503 : 500,
      });
      throw unavailable
        ? new PlatformAuditUnavailableException()
        : new PlatformAuditFailedException();
    }
  }
}

/**
 * Global interceptor, registered before the body parser error interceptor so it wraps it: writes
 * the row of every platform request that passed the guard and is not marked yet, success or
 * error, and only then lets the response out.
 */
@Injectable()
export class PlatformAccessAuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: PlatformAccessAudit) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!isPlatformPath(request.path)) {
      return next.handle();
    }
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      concatMap(async (value: unknown) => {
        await this.audit.recordRequest(request, { status: response.statusCode, code: null });
        return value;
      }),
      catchError((error: unknown) =>
        from(this.audit.recordRequest(request, outcomeOf(error))).pipe(
          concatMap(() => throwError(() => error)),
        ),
      ),
    );
  }
}
