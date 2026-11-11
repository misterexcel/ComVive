// Shared ESLint configuration for the whole monorepo (ADR 0001).
// Every package runs `eslint .` and ESLint finds this file by walking up from the linted files.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Domain code gets the time from an injected clock, never from the system (reproducible
// calculations and tests).
const noSystemClock = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Use an injected clock instead of `new Date()` in domain code.',
  },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Use an injected clock instead of `Date.now()` in domain code.',
  },
];

// Money is an integer number of pesos computed with bigint (CLAUDE.md rule 1, ADR 0004).
const noFloatingPointMoney = [
  {
    selector: "CallExpression[callee.name='parseFloat']",
    message: 'Money is an integer: do not use parseFloat.',
  },
  {
    selector: "MemberExpression[object.name='Number'][property.name='parseFloat']",
    message: 'Money is an integer: do not use Number.parseFloat.',
  },
  {
    selector: "MemberExpression[object.name='Math'][property.name=/^(round|floor|ceil|trunc)$/]",
    message: 'Money is computed with bigint division and remainders, never with Math rounding.',
  },
  {
    selector: "MemberExpression[property.name='toFixed']",
    message: 'Money is an integer: do not use toFixed.',
  },
  {
    // Number literals with a decimal point or a negative exponent (bigint literals never match).
    selector: 'Literal[raw=/^[0-9_]*[.][0-9]|^[0-9][0-9_]*[.]$|^[0-9][0-9_.]*[eE]-/]',
    message: 'Money is an integer: do not use decimal number literals.',
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // NestJS modules are empty classes configured through decorators.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    // NestJS injects constructor dependencies from `design:paramtypes`, so a class used only as a
    // constructor parameter type is a runtime import; with these options
    // consistent-type-imports no longer asks to turn it into `import type`.
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      parserOptions: { emitDecoratorMetadata: true, experimentalDecorators: true },
    },
  },
  {
    files: ['apps/web/**', 'apps/mobile/**'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Only the API touches PostgreSQL (docs/arquitectura.md §1, ADR 0001).
    files: ['apps/web/**', 'apps/mobile/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@prisma/client',
                '@prisma/client/*',
                'prisma',
                '@comvive/api',
                '@comvive/api/*',
              ],
              message:
                'Web and mobile must not depend on the database or on apps/api; use the API contract.',
            },
            {
              regex: '(^|/)apps/api(/|$)',
              message: 'Web and mobile must not import apps/api.',
            },
            {
              // D35: the amount engine runs only in the API; CLP types stay in '@comvive/shared'.
              group: ['@comvive/shared/money-engine', '@comvive/shared/money-engine/*'],
              message:
                'The money engine runs only in the API (D35); show the amounts the API returns.',
            },
            {
              // Relative or deep imports of the same files, bypassing the package subpath.
              regex: '/(src|dist)/(money-engine|money/largest-remainder)([.][jt]s)?$',
              message: 'The money engine runs only in the API (D35).',
            },
          ],
        },
      ],
    },
  },
  {
    // Applies to the shared money module and future API domain folders.
    files: ['packages/shared/src/**/*.ts', 'apps/api/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...noSystemClock],
    },
  },
  {
    // No floating point in the money module (review 2026-11-08, minor 4). ESLint replaces the
    // rule options of the previous block for these files, so the clock rules are repeated here.
    // Tests are excluded: they must feed decimals, NaN and Infinity to prove they are rejected,
    // and fast-check generators may need Math helpers; they never produce amounts themselves.
    files: ['packages/shared/src/money/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...noSystemClock, ...noFloatingPointMoney],
    },
  },
  prettier,
);
