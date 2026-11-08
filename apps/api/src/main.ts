import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Cloud Run injects PORT; see .env.example for local development.
  const port = Number(process.env['PORT'] ?? DEFAULT_PORT);
  await app.listen(port);
}

await bootstrap();
