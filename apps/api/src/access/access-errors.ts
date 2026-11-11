import { STATUS_CODES } from 'node:http';

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
  500: { code: 'INTERNAL_ERROR' },
  503: { code: 'SERVICE_UNAVAILABLE' },
} as const;

const CONTRACT_CODE = /^[A-Z][A-Z0-9_]*$/;

/** Body with the shape of the error contract of ADR 0003: `{ code, ... }` with an UPPER_SNAKE code. */
export function isContractErrorBody(body: unknown): body is { code: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as { code?: unknown }).code === 'string' &&
    CONTRACT_CODE.test((body as { code: string }).code)
  );
}

/**
 * Neutral body of a status (D60): the closed list above, otherwise the HTTP reason phrase as an
 * UPPER_SNAKE code (422 is `UNPROCESSABLE_ENTITY`). Never the message of whoever threw it.
 */
export function neutralBodyFor(status: number): { code: string } {
  const known = (NEUTRAL_BODIES as Record<number, { code: string } | undefined>)[status];
  if (known !== undefined) {
    return known;
  }
  const reason = STATUS_CODES[status];
  if (reason === undefined) {
    return status >= 500 ? NEUTRAL_BODIES[500] : NEUTRAL_BODIES[400];
  }
  return {
    code: reason
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, ''),
  };
}

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
