import { reactConfig } from '@cera/config/eslint/react';

export default [
  ...reactConfig,
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
