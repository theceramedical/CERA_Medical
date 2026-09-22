import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * React and JSX config.
 *
 * jsx-a11y rules are set to error rather than warn. The PRD targets WCAG 2.2 AA
 * (PRD 10), and a warning in a large codebase is a rule nobody sees. Catching a
 * missing label at lint time is far cheaper than catching it in the Phase 14
 * screen-reader pass.
 */
export const reactConfig = tseslint.config(
  ...baseConfig,

  {
    files: ['**/*.{ts,tsx,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,

      // React 19 with the automatic JSX runtime
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/no-array-index-key': 'warn',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],

      // Accessibility, per PRD 10 and design-language.md section 5
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 3 }],
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',

      // A raw <a href> to an internal route loses client navigation.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXOpeningElement[name.name="a"] > JSXAttribute[name.name="href"][value.value=/^\\//]',
          message: 'Use next/link for internal navigation instead of a raw anchor.',
        },
      ],
    },
  },

  // Server-side files have no DOM.
  {
    files: ['**/app/**/route.ts', '**/*.server.ts', '**/proxy.ts', '**/instrumentation.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);

export default reactConfig;
