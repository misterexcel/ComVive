import { Controller, Get } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterEach, describe, expect, it } from 'vitest';

import { CommunityRoute } from './access-policy.js';
import type { PathResourceVisibility } from './ports.js';
import { collectRouteInventory } from './route-inventory.js';
import { createAccessTestApp } from './test-support/access-test-app.js';
import { COMMUNITY_A, TOKENS, UNIT_A1, UNIT_B1, testResource } from './test-support/fixtures.js';
import { runIsolationSweep, type SweepFixtures } from './test-support/isolation-sweep.js';
import {
  BillingConfigTestController,
  UnitPaymentsTestController,
} from './test-support/test-controllers.js';

// ADR 0009, test 10 (D39, M-3): generated from the inventory, grows with every endpoint.
const fixtures: SweepFixtures = {
  communityId: COMMUNITY_A,
  withoutMembership: TOKENS.noMembership,
  memberOfAnotherCommunity: TOKENS.memberB,
  memberOfCommunity: () => TOKENS.adminA,
  visibleId: (resource) => (resource === 'unit' ? UNIT_A1 : undefined),
  foreignId: (resource) => (resource === 'unit' ? UNIT_B1 : undefined),
};

@Controller('communities/:communityId/units/:unitId/leaky')
class LeakyUnitController {
  @Get()
  @CommunityRoute({
    resource: testResource('charge'),
    pathResources: { unitId: testResource('unit') },
  })
  read(): string {
    return 'leak';
  }
}

describe('isolation sweep generated from the inventory (test 10)', () => {
  const apps: NestExpressApplication[] = [];
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('every community route answers 401, 404, 404 and 404 per foreign path resource, with the exact body', async () => {
    const { app } = await createAccessTestApp({
      controllers: [UnitPaymentsTestController, BillingConfigTestController],
    });
    apps.push(app);

    const result = await runIsolationSweep(app, fixtures);

    expect(result.mismatches).toEqual([]);
    // 3 routes × 3 cases, plus, for each of the 2 routes with :unitId, the positive control and
    // one foreign unit.
    expect(result.casesRun).toBe(3 * 3 + 2 * 2);
    expect(result.routesSwept).toBe(
      collectRouteInventory(app).filter((route) => route.policies[0]?.kind === 'community').length,
    );
  });

  it('reports a control member that never reaches step 3b instead of trusting its 404 (M-4)', async () => {
    const { app } = await createAccessTestApp({ controllers: [UnitPaymentsTestController] });
    apps.push(app);

    // The concierge does not see charges: every 404 would come from step 3a, not from 3b.
    const result = await runIsolationSweep(app, {
      ...fixtures,
      memberOfCommunity: () => TOKENS.conciergeA,
    });

    expect(result.mismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route: 'POST /communities/{communityId}/units/{unitId}/payments',
          case: 'control: member with every path resource visible must not get 401 or 404',
          status: 404,
        }),
      ]),
    );
  });

  it('detects a path resource implementation that lets a foreign unit through', async () => {
    const { app } = await createAccessTestApp({
      controllers: [LeakyUnitController],
      pathResources: (): PathResourceVisibility[] => [
        {
          resource: 'unit',
          isWellFormed: () => true,
          isVisible: async () => ({ visible: true }),
        },
      ],
    });
    apps.push(app);

    const result = await runIsolationSweep(app, fixtures);

    expect(result.mismatches).toEqual([
      expect.objectContaining({
        route: 'GET /communities/{communityId}/units/{unitId}/leaky',
        case: 'foreign unit in unitId',
        status: 200,
      }),
    ]);
  });

  it('sweeps every community route of the real AppModule (none yet; grows with each slice)', async () => {
    const { AppModule } = await import('../app.module.js');
    const { app } = await createAccessTestApp({ rootModule: AppModule });
    apps.push(app);

    const result = await runIsolationSweep(app, fixtures);

    expect(result.mismatches).toEqual([]);
    expect(result.routesSwept).toBe(
      collectRouteInventory(app).filter((route) => route.policies[0]?.kind === 'community').length,
    );
  });
});
