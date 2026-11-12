import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import {
  AuthEntryRoute,
  CommunityRoute,
  GatewayRoute,
  IdentityRoute,
  InternalJobRoute,
  PlatformRoute,
  PublicTechnicalRoute,
} from '../access-policy.js';
import { currentRequestContainer, runInCommunity } from '../request-context.js';
import { COMMUNITY_B, testPermission, testPlatformResource, testResource } from './fixtures.js';

/** Handlers that ran, in order. Each test file resets it (spy of "the method did not run"). */
export const executed: string[] = [];

function snapshot(handler: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  executed.push(handler);
  const container = currentRequestContainer();
  return {
    handler,
    tenant: container?.tenant ?? null,
    identity: container?.identity ?? null,
    ...extra,
  };
}

@Controller('communities/:communityId/units/:unitId/payments')
export class UnitPaymentsTestController {
  @Post()
  @CommunityRoute({
    resource: testResource('charge'),
    permission: testPermission('payment.register'),
    pathResources: { unitId: testResource('unit') },
  })
  register(@Param('unitId') unitId: unknown, @Body() body: unknown): Record<string, unknown> {
    return snapshot('register', { unitId, unitIdType: typeof unitId, body });
  }

  @Get()
  @CommunityRoute({
    resource: testResource('charge'),
    pathResources: { unitId: testResource('unit') },
  })
  list(): Record<string, unknown> {
    return snapshot('list');
  }
}

@Controller('communities/:communityId/billing-config')
export class BillingConfigTestController {
  @Get()
  @CommunityRoute({ resource: testResource('billing-config') })
  read(): Record<string, unknown> {
    return snapshot('billing-config');
  }
}

@Controller('communities/:communityId/undecorated')
export class UndecoratedTestController {
  @Get()
  leak(): Record<string, unknown> {
    return snapshot('undecorated');
  }
}

@Controller('communities/:communityId/double-policy')
export class DoublePolicyTestController {
  @Get()
  @PublicTechnicalRoute()
  @CommunityRoute({ resource: testResource('charge') })
  both(): Record<string, unknown> {
    return snapshot('double-policy');
  }
}

@Controller('me')
export class IdentityTestController {
  @Get('communities')
  @IdentityRoute()
  myCommunities(): Record<string, unknown> {
    return snapshot('my-communities');
  }
}

@Controller('auth')
export class AuthEntryTestController {
  @Post('logout')
  @AuthEntryRoute()
  logout(@Body() body: unknown): Record<string, unknown> {
    return snapshot('logout', { body });
  }
}

@Controller('gateway/webpay/communities/:communityId/webpay-attempts/:attemptId/return')
export class GatewayTestController {
  @Get()
  @GatewayRoute('webpay-return')
  returnGet(): Record<string, unknown> {
    return snapshot('gateway-get');
  }

  @Post()
  @GatewayRoute('webpay-return')
  returnPost(@Body() body: unknown): Record<string, unknown> {
    return snapshot('gateway-post', { body });
  }
}

@Controller('platform')
export class PlatformTestController {
  @Get('webpay-attempts')
  @PlatformRoute({ permission: 'platform.webpay_review.read' })
  listAttempts(): Record<string, unknown> {
    return snapshot('platform-list');
  }

  @Post('webpay-attempts/:attemptId/resolution')
  @PlatformRoute({
    permission: 'platform.webpay_review.resolve',
    pathResources: { attemptId: testPlatformResource('webpay-attempt') },
  })
  resolve(@Body() body: unknown): Record<string, unknown> {
    return snapshot('platform-resolve', { body });
  }

  @Post('communities/:communityId/admin-memberships/:membershipId/revoke')
  @PlatformRoute({
    permission: 'platform.admin_role.grant',
    pathResources: { membershipId: testPlatformResource('admin-membership') },
  })
  revokeAdmin(): Record<string, unknown> {
    return snapshot('platform-revoke-admin');
  }

  @Post('communities/:communityId/run-elsewhere')
  @PlatformRoute({ permission: 'platform.admin_role.grant' })
  async runElsewhere(): Promise<Record<string, unknown>> {
    const inner = await runInCommunity(COMMUNITY_B, { type: 'system' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentRequestContainer()?.tenant ?? null;
    });
    return snapshot('platform-run-elsewhere', { inner });
  }
}

@Controller('internal/jobs')
export class InternalJobsTestController {
  @Post('tick')
  @InternalJobRoute()
  tick(): Record<string, unknown> {
    return snapshot('tick');
  }
}
