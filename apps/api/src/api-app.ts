import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { createApp } from './configure-app.js';

/**
 * The `api` application exactly as `main.ts` starts it, before listening: created with
 * `createApp` and initialized (ADR 0009, decision 7).
 */
export async function createApiApp(env: NodeJS.ProcessEnv): Promise<NestExpressApplication> {
  const app = await createApp(AppModule, env);
  await app.init();
  return app;
}
