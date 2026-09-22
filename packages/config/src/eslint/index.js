import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { ceraPlugin } from './rules/no-raw-color.js';

/**
 * Base flat config shared by every workspace.
 *
 * Rule choices here are deliberately opinionated where the PRD has a matching
 * requirement, and quiet everywhere else:
 *   - no-floating-promises catches an unawaited outbox write, which would
 *     silently drop an integration job (PRD 8.1).
 *   - no-console keeps logging in packages/observability, so redaction cannot
 *     be bypassed by a stray console.log (PRD 10, Observability).
 *   - no-raw-color enforces ADR-001.
 */
export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.generated.ts',
      '**/payload-types.ts',
      '**/drizzle/**/*.sql',
      // Declaration files hold no logic, so the type-aware rules have nothing
      // to check. Linting them only produces "not found by the project service"
      // errors for any .d.ts that is hand-written rather than emitted.
      '**/*.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2023 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      'import-x': importX,
      '@cera': ceraPlugin,
    },
    settings: {
      // import-x v4 uses `resolver-next` with a resolver factory. The legacy
      // `'import-x/resolver': { typescript: true }` shape still parses but fails
      // at resolve time with "invalid interface loaded as resolver", which
      // reports as an error on every import line rather than as a config problem.
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
        }),
      ],
    },
    rules: {
      // Correctness
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Type-safety escape hatches must be deliberate
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Security-adjacent
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Observability discipline
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Design tokens
      '@cera/no-raw-color': 'error',

      // Import hygiene
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '@cera/**', group: 'internal', position: 'before' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 4 }],
      'import-x/no-self-import': 'error',

      // General
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      curly: ['error', 'multi-line'],
    },
  },

  // Plain JS and config files sit outside any tsconfig, so the type-aware rules
  // cannot run and throw at rule-load time if left enabled.
  //
  // The disabled rules are merged into `rules` rather than spread alongside it.
  // Spreading `...tseslint.configs.disableTypeChecked` and then declaring a
  // sibling `rules` key replaces the disabled set instead of extending it, which
  // silently re-enables every type-aware rule.
  {
    files: ['**/*.{js,mjs,cjs}', '**/*.config.{ts,mts}'],
    languageOptions: {
      parserOptions: { projectService: false, project: false },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'no-console': 'off',
    },
  },

  // Tests may reach for looser types and log freely.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**', '**/e2e/**', '**/fixtures/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-console': 'off',
    },
  },

  // Seeds and infrastructure scripts legitimately write to stdout.
  {
    files: ['**/scripts/**', '**/seed/**', '**/migrations/**'],
    rules: { 'no-console': 'off' },
  },

  prettier,
);

export default baseConfig;
