// Shared ESLint configuration for the whole monorepo (ADR 0001).
// Every package runs `eslint .` and ESLint finds this file by walking up from the linted files.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
          ],
        },
      ],
    },
  },
  {
    // Domain code gets the time from an injected clock, never from the system (reproducible
    // calculations and tests). Applies to the shared money module and future API domain folders.
    files: ['packages/shared/src/**/*.ts', 'apps/api/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Use an injected clock instead of `new Date()` in domain code.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Use an injected clock instead of `Date.now()` in domain code.',
        },
      ],
    },
  },
  prettier,
);
