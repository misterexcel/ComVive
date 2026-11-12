import { Controller, Get } from '@nestjs/common';

import { PublicTechnicalRoute } from '../access/access-policy.js';

/**
 * Liveness probe for Cloud Run. Never returns business or personal data and does not query the
 * database (ADR 0009, decision 5; ADR-0009-S6).
 */
@Controller('health')
export class HealthController {
  @Get()
  @PublicTechnicalRoute()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
