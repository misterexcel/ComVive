import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  All,
  Controller,
  Get,
  Module,
  Post,
  VersioningType,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { createApiApp } from '../api-app.js';
import { AppModule } from '../app.module.js';
import { createApp } from '../configure-app.js';
import { ACCESS_PROVIDERS } from './access.module.js';
import {
  CommunityRoute,
  GatewayRoute,
  IdentityRoute,
  InternalJobRoute,
  PlatformRoute,
  PublicTechnicalRoute,
} from './access-policy.js';
import { ROUTE_EXCEPTIONS, type RouteException } from './route-exceptions.js';
import {
  assertExceptionsAuthorized,
  assertRouteInventory,
  collectRouteInventory,
  describeExpressStack,
} from './route-inventory.js';
import { createAccessTestApp } from './test-support/access-test-app.js';
import { testPermission, testPlatformResource, testResource } from './test-support/fixtures.js';
import {
  BillingConfigTestController,
  DoublePolicyTestController,
  UndecoratedTestController,
  UnitPaymentsTestController,
} from './test-support/test-controllers.js';

const ADR_DIRECTORY = join(import.meta.dirname, '../../../../docs/adr');

const apps: NestExpressApplication[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function appWith(
  controllers: (new () => unknown)[],
  options: Parameters<typeof createAccessTestApp>[0] = {},
): Promise<NestExpressApplication> {
  const { app } = await createAccessTestApp({ controllers, ...options });
  apps.push(app);
  return app;
}

const exception = (
  method: string,
  pathTemplate: string,
  policy: RouteException['policy'],
  app: RouteException['app'] = 'api',
): RouteException => ({ app, method, pathTemplate, policy, authorizedBy: 'test' });

function inventoryErrors(
  app: NestExpressApplication,
  kind: 'api' | 'worker',
  exceptions: readonly RouteException[] = [],
): string {
  try {
    assertRouteInventory(app, kind, exceptions);
    return '';
  } catch (error) {
    return (error as Error).message;
  }
}

// ---------------------------------------------------------------------------------------------
// Controllers with one problem each.

@Controller('status')
class UnlistedTechnicalController {
  @Get()
  @PublicTechnicalRoute()
  status(): string {
    return 'ok';
  }
}

@Controller('units/:communityId')
class MisplacedCommunityController {
  @Get()
  @CommunityRoute({ resource: testResource('unit') })
  read(): string {
    return '';
  }
}

@Controller('communities/:id/units')
class WrongCommunityParamController {
  @Get()
  @CommunityRoute({ resource: testResource('unit') })
  read(): string {
    return '';
  }
}

@Controller('communities/:communityID/units')
class WrongCaseCommunityParamController {
  @Get()
  @CommunityRoute({ resource: testResource('unit') })
  read(): string {
    return '';
  }
}

@Controller('communities')
class CommunitiesRootController {
  @Get()
  @CommunityRoute({ resource: testResource('unit') })
  list(): string {
    return '';
  }
}

@Controller('communities/:communityId/profile')
class CommunitiesWithIdentityController {
  @Get()
  @IdentityRoute()
  read(): string {
    return '';
  }
}

@Controller('gateway/webpay/communities/:communityId/webpay-attempts/:attemptId/return')
class GatewayUnderCommunitiesController {
  @Get()
  @GatewayRoute('webpay-return')
  back(): string {
    return '';
  }
}

@Controller('internal/jobs')
class InternalJobController {
  @Post('tick')
  @InternalJobRoute()
  tick(): string {
    return '';
  }
}

@Controller('communities/:communityId')
class WildcardsController {
  @Get('files/*splat')
  @CommunityRoute({ resource: testResource('unit') })
  splat(): string {
    return '';
  }

  @Get('optional{/:unitId}')
  @CommunityRoute({
    resource: testResource('unit'),
    pathResources: { unitId: testResource('unit') },
  })
  optional(): string {
    return '';
  }

  // eslint-disable-next-line no-restricted-syntax -- test 5 proves @All() makes the inventory fail.
  @All('everything')
  @CommunityRoute({ resource: testResource('unit') })
  everything(): string {
    return '';
  }
}

@Controller('communities/:communityId/charges')
class PostWithoutPermissionController {
  @Post()
  @CommunityRoute({ resource: testResource('charge') })
  create(): string {
    return '';
  }
}

@Controller('communities/:communityId/units/:unitId/charges')
class UndeclaredParamController {
  @Get()
  @CommunityRoute({ resource: testResource('charge') })
  list(): string {
    return '';
  }
}

@Controller('communities/:communityId/periods/:periodId')
class UnimplementedResourceController {
  @Get()
  @CommunityRoute({
    resource: testResource('charge'),
    pathResources: { periodId: testResource('period') },
  })
  read(): string {
    return '';
  }
}

@Controller('communities/:communityId/units')
class StrayPathResourceController {
  @Get()
  @CommunityRoute({
    resource: testResource('unit'),
    pathResources: { unitId: testResource('unit') },
  })
  list(): string {
    return '';
  }
}

@Controller('me/communities/:communityId')
class IdentityWithParamController {
  @Get()
  @IdentityRoute()
  read(): string {
    return '';
  }
}

@Controller('platform')
class PlatformCommunityPositionController {
  @Get('webpay-attempts/:communityId')
  @PlatformRoute({ permission: 'platform.webpay_review.read' })
  misplaced(): string {
    return '';
  }

  @Get('communities/:communityId')
  @PlatformRoute({ permission: 'platform.admin_role.grant' })
  community(): string {
    return '';
  }

  @Get('webpay-attempts/:attemptId')
  @PlatformRoute({
    permission: 'platform.webpay_review.read',
    pathResources: { attemptId: testPlatformResource('webpay-attempt') },
  })
  attempt(): string {
    return '';
  }
}

@Controller('communities/:communityId/units/:unitId/payments')
class WellFormedCommunityController {
  @Post()
  @CommunityRoute({
    resource: testResource('charge'),
    permission: testPermission('payment.register'),
    pathResources: { unitId: testResource('unit') },
  })
  register(): string {
    return '';
  }
}

// ---------------------------------------------------------------------------------------------

describe('collectRouteInventory', () => {
  it('lists every route with its normalized template and its policies, sorted', async () => {
    const app = await appWith([UnitPaymentsTestController, BillingConfigTestController]);
    const inventory = collectRouteInventory(app);
    expect(
      inventory.map(({ method, pathTemplate, policies }) => ({
        method,
        pathTemplate,
        kinds: policies.map((policy) => policy.kind),
      })),
    ).toEqual([
      {
        method: 'GET',
        pathTemplate: '/communities/{communityId}/billing-config',
        kinds: ['community'],
      },
      {
        method: 'GET',
        pathTemplate: '/communities/{communityId}/units/{unitId}/payments',
        kinds: ['community'],
      },
      {
        method: 'POST',
        pathTemplate: '/communities/{communityId}/units/{unitId}/payments',
        kinds: ['community'],
      },
    ]);
  });
});

describe('assertRouteInventory (test 5)', () => {
  it('passes on the real AppModule created with createApp', async () => {
    const app = await createApiApp({ TRUST_PROXY_HOPS: '0' });
    apps.push(app);
    expect(() => assertRouteInventory(app, 'api')).not.toThrow();
  });

  it('passes on a well-formed community route and a platform route with communityId third', async () => {
    const app = await appWith([WellFormedCommunityController]);
    expect(inventoryErrors(app, 'api')).toBe('');
  });

  it('fails for a route without a policy and names it (test 1)', async () => {
    const app = await appWith([UndecoratedTestController]);
    expect(inventoryErrors(app, 'api')).toMatch(
      /GET \/communities\/\{communityId\}\/undecorated has no access policy/,
    );
  });

  it('fails for a route with two policies (test 2)', async () => {
    const app = await appWith([DoublePolicyTestController]);
    expect(inventoryErrors(app, 'api')).toMatch(
      /GET \/communities\/\{communityId\}\/double-policy has 2 access policies/,
    );
  });

  it('fails for an exception route missing from ROUTE_EXCEPTIONS', async () => {
    const app = await appWith([UnlistedTechnicalController]);
    expect(inventoryErrors(app, 'api')).toMatch(
      /GET \/status \(public-technical\) is not in ROUTE_EXCEPTIONS/,
    );
  });

  it('fails for a ROUTE_EXCEPTIONS entry without a registered route', async () => {
    const app = await appWith([WellFormedCommunityController]);
    expect(inventoryErrors(app, 'api', [exception('GET', '/ghost', 'public-technical')])).toMatch(
      /ROUTE_EXCEPTIONS lists GET \/ghost \(public-technical\) but the api does not register it/,
    );
  });

  it('fails when the policy of a listed route differs from ROUTE_EXCEPTIONS', async () => {
    const app = await appWith([UnlistedTechnicalController]);
    expect(inventoryErrors(app, 'api', [exception('GET', '/status', 'auth-entry')])).toMatch(
      /GET \/status \(public-technical\) is not in ROUTE_EXCEPTIONS/,
    );
  });

  it.each([
    [
      'a community route that does not start with /communities/:communityId',
      MisplacedCommunityController,
      /GET \/units\/\{communityId\} must start with \/communities\/:communityId/,
    ],
    [
      'a community route with :id',
      WrongCommunityParamController,
      /GET \/communities\/\{id\}\/units must start with \/communities\/:communityId/,
    ],
    [
      'a community route with :communityID',
      WrongCaseCommunityParamController,
      /GET \/communities\/\{communityID\}\/units must start with \/communities\/:communityId/,
    ],
    [
      'GET /communities',
      CommunitiesRootController,
      /GET \/communities must start with \/communities\/:communityId/,
    ],
    [
      'a POST community route without permission',
      PostWithoutPermissionController,
      /POST \/communities\/\{communityId\}\/charges is an action and must declare a permission/,
    ],
    [
      'a path parameter missing from pathResources',
      UndeclaredParamController,
      /GET \/communities\/\{communityId\}\/units\/\{unitId\}\/charges does not declare the path parameter unitId in pathResources/,
    ],
    [
      'a resource type without PathResourceVisibility',
      UnimplementedResourceController,
      /resource type period of GET \/communities\/\{communityId\}\/periods\/\{periodId\} has no PathResourceVisibility/,
    ],
    [
      'a pathResources entry that is not a path parameter',
      StrayPathResourceController,
      /GET \/communities\/\{communityId\}\/units declares pathResources\.unitId, which is not a path parameter/,
    ],
  ])('fails for %s', async (_label, controller, message) => {
    const app = await appWith([controller]);
    expect(inventoryErrors(app, 'api')).toMatch(message);
  });

  it('fails for a route whose first segment is communities with another policy', async () => {
    const app = await appWith([CommunitiesWithIdentityController]);
    const errors = inventoryErrors(app, 'api', [
      exception('GET', '/communities/{communityId}/profile', 'identity'),
    ]);
    expect(errors).toMatch(
      /GET \/communities\/\{communityId\}\/profile starts with communities and must use the community policy/,
    );
  });

  it('accepts /gateway/webpay/communities/... with the gateway policy', async () => {
    const app = await appWith([GatewayUnderCommunitiesController]);
    const path = '/gateway/webpay/communities/{communityId}/webpay-attempts/{attemptId}/return';
    expect(inventoryErrors(app, 'api', [exception('GET', path, 'gateway')])).toBe('');
  });

  it('fails for an internal-job route in the api', async () => {
    const app = await appWith([InternalJobController]);
    const errors = inventoryErrors(app, 'api', [
      exception('POST', '/internal/jobs/tick', 'internal-job'),
    ]);
    expect(errors).toMatch(
      /POST \/internal\/jobs\/tick: the api must not register internal-job routes/,
    );
  });

  it('fails for a route that is not internal-job in the worker', async () => {
    const app = await appWith([InternalJobController, WellFormedCommunityController]);
    const errors = inventoryErrors(app, 'worker', [
      exception('POST', '/internal/jobs/tick', 'internal-job', 'worker'),
    ]);
    expect(errors).toMatch(
      /POST \/communities\/\{communityId\}\/units\/\{unitId\}\/payments: the worker only registers internal-job routes/,
    );
  });

  it('fails for a wildcard, an optional segment and @All()', async () => {
    const app = await appWith([WildcardsController]);
    const errors = inventoryErrors(app, 'api');
    expect(errors).toMatch(
      /GET \/communities\/:communityId\/files\/\*splat has a wildcard or optional segment/,
    );
    expect(errors).toMatch(
      /GET \/communities\/:communityId\/optional\{\/:unitId\} has a wildcard or optional segment/,
    );
    expect(errors).toMatch(/ALL \/communities\/\{communityId\}\/everything uses @All\(\)/);
  });

  it('fails when versioning is enabled', async () => {
    const app = await appWith([WellFormedCommunityController], {
      // eslint-disable-next-line no-restricted-syntax -- test 5 proves versioning makes the inventory fail.
      beforeInit: (created) => created.enableVersioning({ type: VersioningType.URI }),
    });
    expect(inventoryErrors(app, 'api')).toMatch(/versioning is enabled/);
  });

  it('fails for an identity route with a path parameter', async () => {
    const app = await appWith([IdentityWithParamController]);
    const errors = inventoryErrors(app, 'api', [
      exception('GET', '/me/communities/{communityId}', 'identity'),
    ]);
    expect(errors).toMatch(
      /GET \/me\/communities\/\{communityId\} \(identity\) must not have path parameters/,
    );
  });

  it('fails for a platform route with :communityId outside the third segment, and passes it third', async () => {
    const app = await appWith([PlatformCommunityPositionController]);
    const errors = inventoryErrors(app, 'api', [
      exception('GET', '/platform/webpay-attempts/{communityId}', 'platform'),
      exception('GET', '/platform/communities/{communityId}', 'platform'),
      exception('GET', '/platform/webpay-attempts/{attemptId}', 'platform'),
    ]);
    expect(errors).toMatch(
      /GET \/platform\/webpay-attempts\/\{communityId\} may only have :communityId as the third segment, after communities/,
    );
    expect(errors).not.toMatch(/GET \/platform\/communities\/\{communityId\} /);
    expect(errors).not.toMatch(/\{attemptId\}/);
  });

  it('fails for an application without AccessGuard as global guard', async () => {
    @Module({ imports: [DiscoveryModule], providers: ACCESS_PROVIDERS })
    class AccessWithoutGuardModule {}
    const moduleRef = await Test.createTestingModule({
      imports: [AccessWithoutGuardModule],
      controllers: [WellFormedCommunityController],
    }).compile();
    const app = await createApp(moduleRef, { TRUST_PROXY_HOPS: '0' });
    await app.init();
    apps.push(app);
    expect(inventoryErrors(app, 'api')).toMatch(/AccessGuard is not registered as a global guard/);
  });

  it('fails for an application not created with createApp', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    // eslint-disable-next-line no-restricted-syntax -- test 5 proves an app built outside createApp fails.
    const app = moduleRef.createNestApplication<NestExpressApplication>();
    await app.init();
    apps.push(app);
    expect(inventoryErrors(app, 'api', ROUTE_EXCEPTIONS)).toMatch(
      /the application was not created with createApp/,
    );
  });
});

describe('ROUTE_EXCEPTIONS', () => {
  it('holds today only GET /health of the api, authorized by ADR 0009, decision 5', () => {
    expect(ROUTE_EXCEPTIONS).toEqual([
      {
        app: 'api',
        method: 'GET',
        pathTemplate: '/health',
        policy: 'public-technical',
        authorizedBy: 'ADR 0009, decisión 5',
      },
    ]);
  });
});

describe('assertExceptionsAuthorized (test 5, CI only)', () => {
  it('passes on the real ROUTE_EXCEPTIONS against docs/adr', async () => {
    await expect(assertExceptionsAuthorized(ADR_DIRECTORY)).resolves.toBeUndefined();
  });

  const fixtureDirectory = (adrs: Record<string, string>): string => {
    const directory = mkdtempSync(join(tmpdir(), 'comvive-adr-'));
    for (const [name, content] of Object.entries(adrs)) {
      writeFileSync(join(directory, name), content);
    }
    return directory;
  };
  const listedBy = (authorizedBy: string): RouteException[] => [
    {
      app: 'api',
      method: 'GET',
      pathTemplate: '/health',
      policy: 'public-technical',
      authorizedBy,
    },
  ];

  it.each([
    ['- **Estado:** **Aprobado** (2026-11-08, por el líder)'],
    ['- **Estado:** Aceptado por el líder del proyecto el 2026-11-11 (rev. 4)'],
  ])('passes with %s', async (statusLine) => {
    const directory = fixtureDirectory({ '0042-algo.md': `# ADR 0042\n\n${statusLine}\n` });
    await expect(
      assertExceptionsAuthorized(directory, listedBy('ADR 0042, decisión 1')),
    ).resolves.toBeUndefined();
  });

  it('fails for an ADR that does not exist', async () => {
    const directory = fixtureDirectory({});
    await expect(
      assertExceptionsAuthorized(directory, listedBy('ADR 0099, decisión 1')),
    ).rejects.toThrow(/ADR 0099 does not exist/);
  });

  it('fails for a Propuesto ADR', async () => {
    const directory = fixtureDirectory({
      '0042-algo.md': '# ADR 0042\n\n- **Estado:** Propuesto\n',
    });
    await expect(
      assertExceptionsAuthorized(directory, listedBy('ADR 0042, decisión 1')),
    ).rejects.toThrow(/ADR 0042 is Propuesto, not Aprobado or Aceptado/);
  });

  it('fails for the literal status line this ADR had before its approval (R2-m-8)', async () => {
    const directory = fixtureDirectory({
      '0009-guard.md':
        '# ADR 0009\n\n- **Estado:** Propuesto (rev. 4; tercera pasada de revisión crítica resuelta. Al aprobarlo, el líder cambia esta línea a "Aprobado" o "Aceptado" con la fecha; de la primera palabra después de `Estado:` depende la verificación `assertExceptionsAuthorized`, decisión 4, y una línea que dice "Aprobado" más adelante no basta)\n',
    });
    await expect(
      assertExceptionsAuthorized(directory, listedBy('ADR 0009, decisión 5')),
    ).rejects.toThrow(/ADR 0009 is Propuesto/);
  });

  it('fails for an ADR without a status line', async () => {
    const directory = fixtureDirectory({ '0042-algo.md': '# ADR 0042\n\nSin estado.\n' });
    await expect(
      assertExceptionsAuthorized(directory, listedBy('ADR 0042, decisión 1')),
    ).rejects.toThrow(/ADR 0042 has no status line/);
  });

  it('fails for an authorizedBy that does not name an ADR', async () => {
    const directory = fixtureDirectory({});
    await expect(
      assertExceptionsAuthorized(directory, listedBy('la arquitectura')),
    ).rejects.toThrow(/does not name an ADR/);
  });
});

// Test 6: layers outside NestJS.
describe('Express stack (test 6)', () => {
  it('is exactly the closed list of createApp, with every Express route in the inventory', async () => {
    const app = await appWith([WellFormedCommunityController, BillingConfigTestController]);
    expect(describeExpressStack(app)).toEqual([
      'nestjs-adapter-hooks',
      'wrappedBodyParsers',
      'requestContextMiddleware',
      // Routes in registration order (controllers as listed in the module).
      'route POST /communities/:communityId/units/:unitId/payments',
      'route GET /communities/:communityId/billing-config',
      'nestjs-not-found',
      'nestjs-error-handler',
    ]);
    expect(inventoryErrors(app, 'api')).toBe('');
  });

  it('fails when a module adds NestJS middleware with MiddlewareConsumer (ADR-0009-S7)', async () => {
    @Module({ controllers: [WellFormedCommunityController] })
    class SneakyModule implements NestModule {
      configure(consumer: MiddlewareConsumer): void {
        consumer
          .apply((_req: unknown, _res: unknown, next: () => void) => next())
          .forRoutes('*splat');
      }
    }
    const app = await appWith([], { imports: [SneakyModule] });
    expect(inventoryErrors(app, 'api')).toMatch(/Express stack differs from createApp/);
  });

  it('fails when app.use adds a layer', async () => {
    const app = await appWith([WellFormedCommunityController], {
      beforeInit: (created) =>
        // eslint-disable-next-line no-restricted-syntax -- test 6 proves an extra layer makes the inventory fail.
        created.use(function extraLayer(_req: unknown, _res: unknown, next: () => void) {
          next();
        }),
    });
    expect(inventoryErrors(app, 'api')).toMatch(/Express stack differs from createApp/);
  });
});

// Test 15: the test application is the production one.
describe('the test application is the production application (test 15)', () => {
  it('createApp on a testing module and createApiApp (main.ts) have the same layers, guard, filter, interceptors and options', async () => {
    const production = await createApiApp({ TRUST_PROXY_HOPS: '0' });
    apps.push(production);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const test = await createApp(moduleRef, { TRUST_PROXY_HOPS: '0' });
    await test.init();
    apps.push(test);

    const shape = (app: NestExpressApplication) => {
      const config = (
        app as unknown as {
          config: {
            getGlobalGuards(): object[];
            getGlobalFilters(): object[];
            getGlobalInterceptors(): object[];
            getGlobalPipes(): object[];
          };
        }
      ).config;
      const express = app.getHttpAdapter().getInstance() as { get(setting: string): unknown };
      return {
        stack: describeExpressStack(app),
        guards: config.getGlobalGuards().map((guard) => guard.constructor.name),
        filters: config.getGlobalFilters().map((filter) => filter.constructor.name),
        interceptors: config
          .getGlobalInterceptors()
          .map((interceptor) => interceptor.constructor.name),
        pipes: config.getGlobalPipes().map((pipe) => pipe.constructor.name),
        options: (app as unknown as { appOptions: unknown }).appOptions,
        settings: ['x-powered-by', 'case sensitive routing', 'strict routing', 'trust proxy'].map(
          (setting) => express.get(setting),
        ),
      };
    };

    expect(shape(test)).toEqual(shape(production));
    expect(shape(production)).toMatchObject({
      guards: ['AccessGuard'],
      filters: ['AccessExceptionFilter'],
      interceptors: ['PlatformAccessAuditInterceptor', 'BodyParseErrorInterceptor'],
      options: { bodyParser: false },
      settings: [false, true, true, 0],
    });
  });
});
