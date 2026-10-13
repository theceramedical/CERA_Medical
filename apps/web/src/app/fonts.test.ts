import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const appDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(appDir, 'fonts.ts'), 'utf8');

describe('font configuration', () => {
  it('uses bundled Latin font files so builds need no remote font service', () => {
    expect(source).toContain("from 'next/font/local'");
    expect(source).not.toContain("from 'next/font/google'");
    expect(existsSync(join(appDir, 'font-files/source-sans-3-latin.woff2'))).toBe(true);
    expect(existsSync(join(appDir, 'font-files/montserrat-latin.woff2'))).toBe(true);
  });

  it('uses swap and metric-adjusted fallbacks for both faces', () => {
    expect(source.match(/display: 'swap'/g)).toHaveLength(2);
    expect(source.match(/adjustFontFallback: 'Arial'/g)).toHaveLength(2);
  });

  it('exposes both design-system variables and required weight ranges', () => {
    expect(source).toContain("variable: '--font-source-sans-3'");
    expect(source).toContain("variable: '--font-montserrat'");
    expect(source).toContain("weight: '400 700'");
    expect(source).toContain("weight: '600 700'");
  });
});
