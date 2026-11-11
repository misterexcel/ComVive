import type { NestExpressApplication } from '@nestjs/platform-express';

import { assertRouteInventory } from './access/route-inventory.js';
import { AppModule } from './app.module.js';
import { createApp } from './configure-app.js';

/**
 * The `api` application exactly as `main.ts` starts it, before listening: created with
 * `createApp`, initialized and checked against the route inventory (ADR 0009, decision 4; D38).
 * If the inventory does not match, it throws and the process exits without listening.
 */
export async function createApiApp(env: NodeJS.ProcessEnv): Promise<NestExpressApplication> {
  const app = await createApp(AppModule, env);
  await app.init();
  assertRouteInventory(app, 'api');
  return app;
}
