import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { parsePort } from './config/port.js';
import { configureApp } from './configure-app.js';

async function bootstrap(): Promise<void> {
  // Cloud Run injects PORT; see .env.example for local development. Fails before creating the
  // app if the value is not a valid port.
  const port = parsePort(process.env['PORT']);
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  await app.listen(port);
}

await bootstrap();
