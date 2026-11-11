import { Module } from '@nestjs/common';

import { AccessModule } from './access/access.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [AccessModule],
  controllers: [HealthController],
})
export class AppModule {}
