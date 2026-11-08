import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * HTTP settings shared by `main.ts` and the tests, so the tests exercise the same application
 * that runs in production.
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  // Do not reveal the framework to clients (review 2026-11-08, minor 5).
  app.disable('x-powered-by');
  return app;
}
