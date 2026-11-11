import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  currentRequestContainer,
  fillIdentityContext,
  fillTenantContext,
  openRequestContainer,
  requireTenantContext,
  runInCommunity,
} from './request-context.js';

const COMMUNITY_A = '0b7c9d2e-0000-4000-8000-00000000000a';
const COMMUNITY_B = '0b7c9d2e-0000-4000-8000-00000000000b';
const member = { type: 'member', personId: 'p-1', roles: ['admin'] } as const;

// ADR 0009, decision 3 ("Contexto de la petición", M-2) and test 9.
describe('request context container', () => {
  it('requireTenantContext throws outside any container', () => {
    expect(() => requireTenantContext()).toThrow(/outside a request container/);
  });

  it('requireTenantContext throws with an empty container', () => {
    openRequestContainer(() => {
      expect(() => requireTenantContext()).toThrow(/no tenant context/);
    });
  });

  it('fills the tenant context once and exposes it', () => {
    openRequestContainer(() => {
      fillTenantContext({ communityId: COMMUNITY_A, actor: member });
      expect(requireTenantContext()).toEqual({ communityId: COMMUNITY_A, actor: member });
    });
  });

  it('throws when the container is filled twice', () => {
    openRequestContainer(() => {
      fillTenantContext({ communityId: COMMUNITY_A, actor: member });
      expect(() => fillTenantContext({ communityId: COMMUNITY_B, actor: member })).toThrow(
        /already filled/,
      );
      expect(() => fillIdentityContext({ personId: 'p-1' })).toThrow(/already filled/);
    });
  });

  it('throws when filling outside a container', () => {
    expect(() => fillIdentityContext({ personId: 'p-1' })).toThrow(/outside a request container/);
  });

  it('gives every request its own empty container', async () => {
    const seen: unknown[] = [];
    await Promise.all(
      [COMMUNITY_A, COMMUNITY_B].map((communityId, index) =>
        openRequestContainer(async () => {
          expect(currentRequestContainer()?.tenant).toBeUndefined();
          fillTenantContext({ communityId, actor: { ...member, personId: `p-${index}` } });
          await new Promise((resolve) => setTimeout(resolve, 5 - index * 5));
          seen.push(requireTenantContext());
        }),
      ),
    );
    expect(seen).toHaveLength(2);
    expect(seen).toContainEqual({ communityId: COMMUNITY_A, actor: { ...member, personId: 'p-0' } });
    expect(seen).toContainEqual({ communityId: COMMUNITY_B, actor: { ...member, personId: 'p-1' } });
  });

  describe('runInCommunity (R2-M-2)', () => {
    it('runs fn in a nested container with the given community and restores the outer one', async () => {
      await openRequestContainer(async () => {
        fillTenantContext({
          communityId: COMMUNITY_A,
          actor: { type: 'platform', personId: 'ops-1', platformRole: 'platform_operations' },
        });
        const inner = await runInCommunity(COMMUNITY_B, { type: 'system' }, async () =>
          requireTenantContext(),
        );
        expect(inner).toEqual({ communityId: COMMUNITY_B, actor: { type: 'system' } });
        expect(requireTenantContext().communityId).toBe(COMMUNITY_A);
      });
    });

    it('works without an outer request container (worker jobs)', async () => {
      const inner = await runInCommunity(
        COMMUNITY_B,
        { type: 'platform', personId: 'ops-1', platformRole: 'platform_operations' },
        () => requireTenantContext(),
      );
      expect(inner.actor).toEqual({
        type: 'platform',
        personId: 'ops-1',
        platformRole: 'platform_operations',
      });
    });

    it('does not accept a member actor (type test)', () => {
      expectTypeOf(runInCommunity).parameter(1).not.toMatchTypeOf<typeof member>();
      // @ts-expect-error a member actor never runs code in a community taken from a record.
      void (() => runInCommunity(COMMUNITY_B, member, () => undefined));
    });
  });
});
