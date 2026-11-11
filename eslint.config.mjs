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

// ---------------------------------------------------------------------------------------------
// Deny-by-default access in the API (ADR 0009, decision 4, "Reglas de lint"; test 13). An early
// warning: the barrier is the route inventory and the tests. In flat config a later matching
// block replaces the options of no-restricted-imports and no-restricted-syntax, so every block
// gets the complete array minus what that block is allowed (menor 6; R2-m-5).

// Names exported by apps/api/src/access that only some modules may import.
const ACCESS_IMPORT_MESSAGES = {
  PublicTechnicalRoute: '@PublicTechnicalRoute is only for src/health (ADR 0009, decision 5).',
  GatewayRoute: '@GatewayRoute is only for src/webpay-gateway (ADR 0007, decision 4).',
  PlatformRoute: '@PlatformRoute is only for src/platform (ADR 0006).',
  InternalJobRoute: '@InternalJobRoute is only for src/jobs (ADR 0008, decision 2).',
  AuthEntryRoute: '@AuthEntryRoute is only for src/auth (ADR 0005; D42).',
  IdentityRoute: '@IdentityRoute is only for src/identity (ADR 0002, decision 3).',
  runInCommunity:
    'runInCommunity is only for src/platform, src/jobs and src/access (ADR 0009, R2-M-2).',
  recordPlatformAction: 'recordPlatformAction is only for src/platform and src/access (D45).',
};

/** no-restricted-imports for apps/api/src, allowing the names or 'test-support' in `except`. */
function apiImportRestrictions(except) {
  const patterns = Object.entries(ACCESS_IMPORT_MESSAGES)
    .filter(([name]) => !except.includes(name))
    .map(([name, message]) => ({ regex: '(^|/)access(/|$)', importNames: [name], message }));
  patterns.push({
    group: [
      '@nestjs/serve-static',
      '@nestjs/serve-static/*',
      '@nestjs/websockets',
      '@nestjs/websockets/*',
      '@nestjs/microservices',
      '@nestjs/microservices/*',
    ],
    message: 'Static files, WebSockets and microservices bypass the access guard (ADR 0009, M-3).',
  });
  if (!except.includes('test-support')) {
    patterns.push({
      regex: '(^|/)test-support(/|$)',
      message: 'Test doubles are only for *.test.ts and test-support (ADR 0009, menor 10).',
    });
  }
  return ['error', { patterns }];
}

// no-restricted-syntax groups; a block may be allowed some of them, never the `always` group.
const API_SYNTAX_GROUPS = {
  'global-enhancers': [
    {
      selector: 'Identifier[name=/^APP_(GUARD|FILTER|INTERCEPTOR|PIPE)$/]',
      message: 'APP_GUARD, APP_FILTER, APP_INTERCEPTOR and APP_PIPE only in src/access (M-3).',
    },
    {
      selector: 'Identifier[name=/^useGlobal(Guards|Filters|Interceptors|Pipes)$/]',
      message: 'Global enhancers only in src/access and configure-app.ts (M-3).',
    },
    {
      selector: "Identifier[name='UseFilters']",
      message:
        '@UseFilters only in src/access: AccessExceptionFilter normalizes every error (M-3).',
    },
  ],
  'middleware-consumer': [
    {
      selector: 'Identifier[name=/^(MiddlewareConsumer|NestModule)$/]',
      message: 'NestJS middleware runs before the guard: only in src/access (M-3).',
    },
  ],
  'express-layers': [
    {
      selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='use']",
      message: 'app.use( only in configure-app.ts: layers outside NestJS skip the guard (M-3).',
    },
    {
      selector: 'Identifier[name=/^(useStaticAssets|enableVersioning)$/]',
      message: 'useStaticAssets and enableVersioning only in configure-app.ts (M-3).',
    },
    {
      selector:
        "CallExpression[callee.property.name=/^(get|post|put|patch|delete|options|head|all)$/][arguments.length>=2][arguments.0.type='Literal'][arguments.0.value=/^[/]/]",
      message: 'Routes registered directly in Express skip the guard: only in configure-app.ts.',
    },
    {
      selector:
        "CallExpression[callee.name='Router'], CallExpression[callee.property.name='Router']",
      message: 'Express routers skip the guard: only in configure-app.ts.',
    },
  ],
  'http-adapter': [
    {
      selector: "Identifier[name='getHttpAdapter']",
      message: 'getHttpAdapter() only in configure-app.ts and src/access (R2-m-5).',
    },
  ],
  'response-objects': [
    {
      selector: 'Decorator > CallExpression[callee.name=/^(Res|Response|Next)$/]',
      message:
        '@Res, @Response and @Next only in src/webpay-gateway: the response must wait for its audit (R3-m-1).',
    },
  ],
  'async-local-storage': [
    {
      selector: "NewExpression[callee.name='AsyncLocalStorage']",
      message: 'The request context lives in src/access (M-2).',
    },
  ],
  'app-factory': [
    {
      selector: "Identifier[name='createNestApplication']",
      message: 'Create applications only with createApp in configure-app.ts (menor 2).',
    },
    {
      selector: "MemberExpression[object.name='NestFactory'][property.name='create']",
      message: 'Create applications only with createApp in configure-app.ts (menor 2).',
    },
  ],
  always: [
    {
      selector: "Decorator > CallExpression[callee.name='All']",
      message: '@All() is not allowed: one method per route (ADR 0009, M-3).',
    },
    {
      selector: "Decorator > CallExpression[callee.name='Param'][arguments.length>1]",
      message: '@Param takes only the parameter name: the guard validates it (D39; R2-m-6).',
    },
    {
      selector:
        "Decorator > CallExpression[callee.name='Param'][arguments.length=1]:not([arguments.0.type='Literal'])",
      message: '@Param takes only the parameter name: the guard validates it (D39; R2-m-6).',
    },
    {
      selector: "Identifier[name='enterWith']",
      message: 'Never enterWith: it leaks across keep-alive requests; use als.run (M-2).',
    },
  ],
};

/** no-restricted-syntax selectors for apps/api/src, allowing the groups in `except`. */
function apiSyntaxRestrictions(except) {
  return Object.entries(API_SYNTAX_GROUPS)
    .filter(([group]) => group === 'always' || !except.includes(group))
    .flatMap(([, selectors]) => selectors);
}

// Modules with an exception, in the fixed order of ADR 0009, decision 4.
const API_MODULE_EXCEPTIONS = [
  { glob: 'apps/api/src/health/**', imports: ['PublicTechnicalRoute'], syntax: [] },
  {
    glob: 'apps/api/src/webpay-gateway/**',
    imports: ['GatewayRoute'],
    syntax: ['response-objects'],
  },
  {
    glob: 'apps/api/src/platform/**',
    imports: ['PlatformRoute', 'runInCommunity', 'recordPlatformAction'],
    syntax: [],
  },
  { glob: 'apps/api/src/jobs/**', imports: ['InternalJobRoute', 'runInCommunity'], syntax: [] },
  { glob: 'apps/api/src/auth/**', imports: ['AuthEntryRoute'], syntax: [] },
  { glob: 'apps/api/src/identity/**', imports: ['IdentityRoute'], syntax: [] },
  {
    glob: 'apps/api/src/access/**',
    imports: Object.keys(ACCESS_IMPORT_MESSAGES),
    syntax: ['global-enhancers', 'middleware-consumer', 'http-adapter', 'async-local-storage'],
  },
  {
    glob: 'apps/api/src/configure-app.ts',
    imports: [],
    syntax: ['global-enhancers', 'express-layers', 'http-adapter', 'app-factory'],
  },
];

function apiBlock(files, imports, syntax) {
  return {
    files,
    rules: {
      'no-restricted-imports': apiImportRestrictions(imports),
      'no-restricted-syntax': ['error', ...apiSyntaxRestrictions(syntax)],
    },
  };
}

/** General block, then test files, then one pair (code, tests) per module with an exception. */
function apiAccessBlocks() {
  const testFiles = ['**/*.test.ts', '**/test-support/**'];
  return [
    apiBlock(['apps/api/src/**/*.ts'], [], []),
    apiBlock(
      testFiles.map((pattern) => ['apps/api/src/**/*.ts', pattern]),
      ['test-support'],
      [],
    ),
    ...API_MODULE_EXCEPTIONS.flatMap(({ glob, imports, syntax }) => [
      apiBlock([glob], imports, syntax),
      apiBlock(
        testFiles.map((pattern) => [glob, pattern]),
        [...imports, 'test-support'],
        syntax,
      ),
    ]),
  ];
}

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
    // Applies to the shared money module (API domain folders have their own block below).
    files: ['packages/shared/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...noSystemClock],
    },
  },
  ...apiAccessBlocks(),
  {
    // API domain code: no system clock and no access exception at all, not even inside a module
    // that has one (ADR 0009, decision 4). Last API block, so it wins over the module blocks.
    files: ['apps/api/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': apiImportRestrictions([]),
      'no-restricted-syntax': ['error', ...noSystemClock, ...apiSyntaxRestrictions([])],
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
