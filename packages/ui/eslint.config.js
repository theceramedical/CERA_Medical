import { reactConfig } from '@cera/config/eslint/react';

export default [
  ...reactConfig,
  {
    /**
     * This package has no Next dependency and must not acquire one: `Link`, `Breadcrumbs`, and
     * `Pagination` all take the link component through an `as`/`linkAs` prop precisely so
     * `apps/web` can bind `next/link` without the design system knowing the framework exists.
     *
     * The shared rule that pushes raw anchors towards `next/link` is right for `apps/web` and
     * unsatisfiable here, where a bare `<a>` is both the documented default and the only thing a
     * test fixture can render.
     */
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    /**
     * `theme.css` is the token layer, and the `no-raw-color` rule already allow-lists
     * `packages/ui/src/styles`. `tokens.ts` sits beside it and reads it, so it holds no
     * literals of its own - no exemption needed, and that is worth leaving unexempted so
     * the day someone inlines a value there, lint says so.
     */
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      /**
       * The contrast test asserts against specification-fixed values - 21:1 for black on
       * white, the gamma curve at mid-grey - and those have to be written as hex to be
       * meaningful. Restricted to test files, so a component still cannot do it.
       */
      '@cera/no-raw-color': 'off',
    },
  },
];
