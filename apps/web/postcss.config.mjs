/**
 * Tailwind v4 runs as a PostCSS plugin and needs no other entry.
 *
 * There is deliberately no `tailwind.config.ts`. In v4 the theme lives in CSS, in
 * `@cera/ui`'s `theme.css`, and a config file would be a second place to declare tokens -
 * which is the thing ADR-001 exists to prevent. Autoprefixer is not listed either: v4
 * handles vendor prefixing itself, and adding it back causes duplicated properties.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
