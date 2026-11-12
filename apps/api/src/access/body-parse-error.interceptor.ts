import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { throwError, type Observable } from 'rxjs';

import { UnreadableBodyException } from './access-errors.js';
import { readAccessPolicies } from './access-policy.js';
import { hasDeferredBodyError } from './body-parsers.js';

/**
 * Answers 400 `BAD_REQUEST` for a body the parsers could not read, after the guard and before the
 * pipes (ADR 0009, decision 6): without session 401, foreign unit 404, without permission 403,
 * and only then 400 (ADR 0003, decision 9; TC-GC-CB-33 (d)). On `gateway` routes the verifier
 * already treated it as missing parameters.
 */
@Injectable()
export class BodyParseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const kind = readAccessPolicies(context.getHandler())[0]?.kind;
    if (hasDeferredBodyError(request) && kind !== 'gateway') {
      return throwError(() => new UnreadableBodyException());
    }
    return next.handle();
  }
}
