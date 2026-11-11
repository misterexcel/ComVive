import { afterAll, describe, expect, it, vi } from 'vitest';

import { assertRouteInventory } from './route-inventory.js';
import { createAccessTestApp } from './test-support/access-test-app.js';
import { UnitPaymentsTestController } from './test-support/test-controllers.js';

// ADR 0009, decision 4 (M-4) and test 5: assertRouteInventory runs at startup in Cloud Run,
// whose image has no docs/, so it must not read any file. While `forbid` is on, every function
// of node:fs and node:fs/promises throws and is recorded.
const fileSystem = vi.hoisted(() => {
  const state = { forbid: false, calls: [] as string[] };
  const wrap = (actual: Record<string, unknown>, moduleName: string) => {
    const wrapped: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(actual)) {
      wrapped[name] =
        typeof value === 'function'
          ? (...args: unknown[]) => {
              if (state.forbid) {
                state.calls.push(`${moduleName}.${name}`);
                throw new Error(`File system access is forbidden in this test (${name})`);
              }
              return (value as (...inner: unknown[]) => unknown)(...args);
            }
          : value;
    }
    return { ...wrapped, default: wrapped };
  };
  return { state, wrap };
});

vi.mock('node:fs', async (importOriginal) =>
  fileSystem.wrap(await importOriginal<Record<string, unknown>>(), 'fs'),
);
vi.mock('node:fs/promises', async (importOriginal) =>
  fileSystem.wrap(await importOriginal<Record<string, unknown>>(), 'fs/promises'),
);

describe('assertRouteInventory does not read files', () => {
  let close: (() => Promise<void>) | undefined;

  afterAll(async () => {
    fileSystem.state.forbid = false;
    await close?.();
  });

  it('passes with every node:fs function throwing', async () => {
    const { app } = await createAccessTestApp({ controllers: [UnitPaymentsTestController] });
    close = () => app.close();

    fileSystem.state.forbid = true;
    expect(() => assertRouteInventory(app, 'api', [])).not.toThrow();
    fileSystem.state.forbid = false;

    expect(fileSystem.state.calls).toEqual([]);
  });

  it('the mock is effective: a node:fs call while forbidden throws and is recorded', async () => {
    const { existsSync } = await import('node:fs');
    fileSystem.state.forbid = true;
    expect(() => existsSync('.')).toThrow(/forbidden/);
    fileSystem.state.forbid = false;
    expect(fileSystem.state.calls).toEqual(['fs.existsSync']);
  });
});
