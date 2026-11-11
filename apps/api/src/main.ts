import 'reflect-metadata';

import { createApiApp } from './api-app.js';
import { parsePort } from './config/port.js';

async function bootstrap(): Promise<void> {
  // Cloud Run injects PORT and TRUST_PROXY_HOPS; see .env.example for local development. Fails
  // before listening if a value is invalid or the route inventory does not match (ADR 0009, D38).
  const port = parsePort(process.env['PORT']);
  const app = await createApiApp(process.env);
  await app.listen(port);
}

await bootstrap();
