import { join } from 'node:path';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// ADR 0009, decision 4 ("Reglas de lint") and test 13 (M-3, menores 2, 6 and 10; R2-M-2,
// R2-m-5, R2-m-6; D45, R3-m-1): the rules are an early warning, the barrier is the tests.
const REPO_ROOT = join(import.meta.dirname, '../../../..');
const RULES = new Set(['no-restricted-imports', 'no-restricted-syntax']);

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: REPO_ROOT });
});

async function restrictedMessages(file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId !== null && RULES.has(message.ruleId))
    .map((message) => `${message.ruleId}: ${message.message}`);
}

const ACCESS = '../access/access-policy.js';

describe('lint rules of ADR 0009 (test 13)', () => {
  it.each([
    [
      '@PublicTechnicalRoute outside src/health',
      'apps/api/src/units/units.controller.ts',
      `import { PublicTechnicalRoute } from '${ACCESS}';`,
    ],
    [
      '@GatewayRoute in src/health',
      'apps/api/src/health/health.controller.ts',
      `import { GatewayRoute } from '${ACCESS}';`,
    ],
    [
      '@PlatformRoute outside src/platform',
      'apps/api/src/units/units.controller.ts',
      `import { PlatformRoute } from '${ACCESS}';`,
    ],
    [
      '@InternalJobRoute outside src/jobs',
      'apps/api/src/units/units.controller.ts',
      `import { InternalJobRoute } from '${ACCESS}';`,
    ],
    [
      '@AuthEntryRoute outside src/auth',
      'apps/api/src/units/units.controller.ts',
      `import { AuthEntryRoute } from '${ACCESS}';`,
    ],
    [
      '@IdentityRoute outside src/identity',
      'apps/api/src/units/units.controller.ts',
      `import { IdentityRoute } from '${ACCESS}';`,
    ],
    [
      'runInCommunity from src/units',
      'apps/api/src/units/units.service.ts',
      "import { runInCommunity } from '../access/request-context.js';",
    ],
    [
      'recordPlatformAction from src/units',
      'apps/api/src/units/units.service.ts',
      "import { recordPlatformAction } from '../access/platform-access-audit.js';",
    ],
    [
      'APP_GUARD outside src/access',
      'apps/api/src/units/units.module.ts',
      "import { APP_GUARD } from '@nestjs/core';",
    ],
    [
      'APP_FILTER outside src/access',
      'apps/api/src/units/units.module.ts',
      "import { APP_FILTER } from '@nestjs/core';",
    ],
    [
      'APP_INTERCEPTOR outside src/access',
      'apps/api/src/units/units.module.ts',
      "import { APP_INTERCEPTOR } from '@nestjs/core';",
    ],
    [
      'APP_PIPE outside src/access',
      'apps/api/src/units/units.module.ts',
      "import { APP_PIPE } from '@nestjs/core';",
    ],
    [
      '@UseFilters outside src/access',
      'apps/api/src/units/units.controller.ts',
      "import { UseFilters } from '@nestjs/common';",
    ],
    [
      'useGlobalPipes outside configure-app.ts',
      'apps/api/src/main.ts',
      'declare const app: { useGlobalPipes(): void };\napp.useGlobalPipes();',
    ],
    [
      'a NestModule with MiddlewareConsumer outside src/access',
      'apps/api/src/units/units.module.ts',
      "import type { MiddlewareConsumer, NestModule } from '@nestjs/common';\nexport class UnitsModule implements NestModule { configure(_consumer: MiddlewareConsumer): void {} }",
    ],
    [
      'app.use( outside configure-app.ts',
      'apps/api/src/main.ts',
      'declare const app: { use(fn: unknown): void };\napp.use(() => undefined);',
    ],
    [
      'app.use( in src/access',
      'apps/api/src/access/anything.ts',
      'declare const app: { use(fn: unknown): void };\napp.use(() => undefined);',
    ],
    [
      'a direct Express route outside configure-app.ts',
      'apps/api/src/units/units.ts',
      "declare const app: { get(path: string, fn: unknown): void };\napp.get('/units', () => undefined);",
    ],
    [
      'useStaticAssets outside configure-app.ts',
      'apps/api/src/main.ts',
      "declare const app: { useStaticAssets(path: string): void };\napp.useStaticAssets('public');",
    ],
    [
      'enableVersioning outside configure-app.ts',
      'apps/api/src/main.ts',
      'declare const app: { enableVersioning(): void };\napp.enableVersioning();',
    ],
    [
      'getHttpAdapter() outside configure-app.ts and src/access',
      'apps/api/src/units/units.ts',
      'declare const app: { getHttpAdapter(): void };\napp.getHttpAdapter();',
    ],
    [
      '@nestjs/serve-static',
      'apps/api/src/units/units.module.ts',
      "import { ServeStaticModule } from '@nestjs/serve-static';",
    ],
    [
      '@nestjs/websockets',
      'apps/api/src/units/units.gateway.ts',
      "import { WebSocketGateway } from '@nestjs/websockets';",
    ],
    [
      '@nestjs/microservices',
      'apps/api/src/units/units.module.ts',
      "import { ClientsModule } from '@nestjs/microservices';",
    ],
    [
      '@All()',
      'apps/api/src/units/units.controller.ts',
      "import { All } from '@nestjs/common';\nexport class C { @All('x') x(): void {} }",
    ],
    [
      "@Param('unitId', ParseUUIDPipe)",
      'apps/api/src/units/units.controller.ts',
      "import { Param, ParseUUIDPipe } from '@nestjs/common';\nexport class C { x(@Param('unitId', ParseUUIDPipe) unitId: string): string { return unitId; } }",
    ],
    [
      "@Param('unitId', new ParseUUIDPipe())",
      'apps/api/src/units/units.controller.ts',
      "import { Param, ParseUUIDPipe } from '@nestjs/common';\nexport class C { x(@Param('unitId', new ParseUUIDPipe()) unitId: string): string { return unitId; } }",
    ],
    [
      '@Param(new ValidationPipe())',
      'apps/api/src/units/units.controller.ts',
      "import { Param, ValidationPipe } from '@nestjs/common';\nexport class C { x(@Param(new ValidationPipe()) p: unknown): unknown { return p; } }",
    ],
    [
      'enterWith',
      'apps/api/src/access/request-context.ts',
      "import { AsyncLocalStorage } from 'node:async_hooks';\nconst s = new AsyncLocalStorage();\ns.enterWith({});",
    ],
    [
      'new AsyncLocalStorage outside src/access',
      'apps/api/src/units/context.ts',
      "import { AsyncLocalStorage } from 'node:async_hooks';\nexport const s = new AsyncLocalStorage();",
    ],
    [
      'createNestApplication outside configure-app.ts',
      'apps/api/src/units/units.ts',
      'declare const m: { createNestApplication(): void };\nm.createNestApplication();',
    ],
    [
      'NestFactory.create outside configure-app.ts',
      'apps/api/src/main.ts',
      "import { NestFactory } from '@nestjs/core';\nvoid NestFactory.create(class {});",
    ],
    [
      'test-support from code that is not a test',
      'apps/api/src/units/units.service.ts',
      "import { TOKENS } from '../access/test-support/fixtures.js';\nvoid TOKENS;",
    ],
    [
      '@Res() in src/platform',
      'apps/api/src/platform/attempts.controller.ts',
      "import { Res } from '@nestjs/common';\nexport class C { x(@Res() r: unknown): unknown { return r; } }",
    ],
    [
      '@Response() outside src/webpay-gateway',
      'apps/api/src/units/units.controller.ts',
      "import { Response } from '@nestjs/common';\nexport class C { x(@Response() r: unknown): unknown { return r; } }",
    ],
    [
      '@Next() outside src/webpay-gateway',
      'apps/api/src/units/units.controller.ts',
      "import { Next } from '@nestjs/common';\nexport class C { x(@Next() n: unknown): unknown { return n; } }",
    ],
    [
      '@PlatformRoute in src/platform/domain',
      'apps/api/src/platform/domain/rules.ts',
      `import { PlatformRoute } from '../../access/access-policy.js';\nvoid PlatformRoute;`,
    ],
    [
      'runInCommunity in src/platform/domain',
      'apps/api/src/platform/domain/rules.ts',
      "import { runInCommunity } from '../../access/request-context.js';\nvoid runInCommunity;",
    ],
  ])('reports %s', async (_label, file, code) => {
    expect(await restrictedMessages(file, code)).not.toEqual([]);
  });

  it('a domain file with new Date() and APP_GUARD fails by both rules', async () => {
    const messages = await restrictedMessages(
      'apps/api/src/units/domain/rules.ts',
      "import { APP_GUARD } from '@nestjs/core';\nexport const now = new Date();\nexport const guard = APP_GUARD;",
    );
    expect(messages.some((message) => message.includes('injected clock'))).toBe(true);
    expect(messages.some((message) => message.includes('APP_GUARD'))).toBe(true);
  });

  it.each([
    [
      "@Param('unitId')",
      'apps/api/src/units/units.controller.ts',
      "import { Param } from '@nestjs/common';\nexport class C { x(@Param('unitId') unitId: string): string { return unitId; } }",
    ],
    [
      'getHttpAdapter() in src/access',
      'apps/api/src/access/route-inventory.ts',
      'declare const app: { getHttpAdapter(): void };\napp.getHttpAdapter();',
    ],
    [
      'runInCommunity in src/jobs',
      'apps/api/src/jobs/runner.ts',
      "import { runInCommunity } from '../access/request-context.js';\nvoid runInCommunity;",
    ],
    [
      'recordPlatformAction in src/platform',
      'apps/api/src/platform/resolution.service.ts',
      "import { recordPlatformAction } from '../access/platform-access-audit.js';\nvoid recordPlatformAction;",
    ],
    [
      '@Res() in src/webpay-gateway',
      'apps/api/src/webpay-gateway/return.controller.ts',
      "import { Res } from '@nestjs/common';\nexport class C { x(@Res() r: unknown): unknown { return r; } }",
    ],
    [
      '@PublicTechnicalRoute in src/health',
      'apps/api/src/health/health.controller.ts',
      `import { PublicTechnicalRoute } from '${ACCESS}';\nvoid PublicTechnicalRoute;`,
    ],
    [
      '@CommunityRoute anywhere',
      'apps/api/src/units/units.controller.ts',
      `import { CommunityRoute } from '${ACCESS}';\nvoid CommunityRoute;`,
    ],
    [
      'APP_GUARD in src/access',
      'apps/api/src/access/access.module.ts',
      "import { APP_GUARD } from '@nestjs/core';\nvoid APP_GUARD;",
    ],
    [
      'app.use( and NestFactory.create in configure-app.ts',
      'apps/api/src/configure-app.ts',
      "import { NestFactory } from '@nestjs/core';\ndeclare const app: { use(fn: unknown): void };\napp.use(() => undefined);\nvoid NestFactory.create(class {});",
    ],
    [
      'test-support from a test file',
      'apps/api/src/units/units.test.ts',
      "import { TOKENS } from '../access/test-support/fixtures.js';\nvoid TOKENS;",
    ],
    [
      'a supertest call with a path',
      'apps/api/src/units/units.test.ts',
      "declare const http: { get(path: string): void };\nhttp.get('/units');",
    ],
  ])('allows %s', async (_label, file, code) => {
    expect(await restrictedMessages(file, code)).toEqual([]);
  });
}, 60_000);
