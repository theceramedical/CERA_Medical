/** @type {import('prettier').Config} */
export const prettierConfig = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  overrides: [
    { files: '*.md', options: { proseWrap: 'preserve', printWidth: 100 } },
    { files: ['*.yml', '*.yaml'], options: { singleQuote: false } },
    { files: '*.json', options: { printWidth: 120 } },
  ],
};

export default prettierConfig;
