import { HttpException } from '@nestjs/common';

/**
 * Single bodies of the access responses (ADR 0002; ADR 0009, decision 3, "Cuerpos únicos";
 * ADR-0009-S1 and S3): only the code, never a message that could reveal the framework, the
 * route or whether a resource exists.
 */
export const NEUTRAL_BODIES = {
  400: { code: 'BAD_REQUEST' },
  401: { code: 'UNAUTHORIZED' },
  403: { code: 'FORBIDDEN' },
  404: { code: 'NOT_FOUND' },
  413: { code: 'PAYLOAD_TOO_LARGE' },
  503: { code: 'SERVICE_UNAVAILABLE' },
} as const;

export type NeutralStatus = 401 | 403 | 404;

/** Rejection of the guard: 401, 404 or 403. */
export class AccessDeniedException extends HttpException {
  constructor(readonly neutralStatus: NeutralStatus) {
    super(NEUTRAL_BODIES[neutralStatus], neutralStatus);
  }
}

/** Unreadable body (deferred body parser error), answered after the guard (decision 6). */
export class UnreadableBodyException extends HttpException {
  constructor() {
    super(NEUTRAL_BODIES[400], 400);
  }
}

/** Invalid gateway call: the neutral 302 of ADR 0007, never 404 or 400. */
export class GatewayRejectedException extends Error {
  constructor(readonly redirectTo: string) {
    super('Gateway call rejected');
    this.name = 'GatewayRejectedException';
  }
}

/** The platform audit pool is exhausted (D43): 503 for platform only. */
export class PlatformAuditUnavailableException extends HttpException {
  constructor() {
    super(NEUTRAL_BODIES[503], 503);
  }
}

/** The platform audit insert failed: 500 instead of the original answer (ADR 0006, decision 8). */
export class PlatformAuditFailedException extends Error {
  constructor() {
    super('Platform audit write failed');
    this.name = 'PlatformAuditFailedException';
  }
}
