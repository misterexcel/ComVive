import { Controller, Get } from '@nestjs/common';

/** Liveness probe for Cloud Run. Never returns business or personal data. */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
