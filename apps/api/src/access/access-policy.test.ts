import { describe, expect, it } from 'vitest';

import { CommunityRoute, PublicTechnicalRoute, readAccessPolicies } from './access-policy.js';
import { testResource } from './test-support/fixtures.js';

// ADR 0009, decision 2 and test 2 (cross M-3).
describe('access policy decorators', () => {
  it('a policy decorator applied to a class throws while the module loads', () => {
    const asClassDecorator = (decorator: MethodDecorator) => decorator as unknown as ClassDecorator;
    expect(() => {
      @asClassDecorator(CommunityRoute({ resource: testResource('unit') }))
      class UnitsController {}
      return UnitsController;
    }).toThrow(/@CommunityRoute\(\) applies to methods only, not to the class UnitsController/);
    expect(() => {
      @asClassDecorator(PublicTechnicalRoute())
      class StatusController {}
      return StatusController;
    }).toThrow(TypeError);
  });

  it('appends policies instead of replacing them, so a second decorator is detected', () => {
    class Controller {
      @PublicTechnicalRoute()
      @CommunityRoute({ resource: testResource('unit') })
      both(): void {}
    }
    expect(readAccessPolicies(Controller.prototype.both).map((policy) => policy.kind)).toEqual([
      'community',
      'public-technical',
    ]);
  });
});
