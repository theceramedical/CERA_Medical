import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads the design tokens out of `theme.css`.
 *
 * Parsed rather than restated. A TypeScript object mirroring the sixty-odd colour values
 * would be a second source of truth, and the failure it produces is the worst kind: the
 * contrast test passes against the copy while the stylesheet ships something else. Nobody
 * finds that by reading the diff, because both files look right on their own.
 *
 * Node only - it touches the filesystem. Used by the contrast test and by the `/dev/design`
 * route, which is a server component and so runs in Node too. No client component imports
 * this.
 */

const THEME_PATH = join(dirname(fileURLToPath(import.meta.url)), 'styles', 'theme.css');

/** Tokens as authored, with `var()` references still unresolved. */
export function readRawTokens(source = readFileSync(THEME_PATH, 'utf8')): Map<string, string> {
  const block = extractThemeBlock(stripComments(source));
  const tokens = new Map<string, string>();

  // Declarations are `--name: value;`. The value is taken up to the first semicolon that
  // is not inside parentheses, which is what keeps a multi-stop `box-shadow` or a
  // `clamp()` containing commas in one piece.
  for (const declaration of splitDeclarations(block)) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;

    const name = declaration.slice(0, colon).trim();
    if (!name.startsWith('--')) continue;

    tokens.set(name, declaration.slice(colon + 1).trim());
  }

  return tokens;
}

/**
 * Tokens with every `var()` reference followed to a literal value.
 *
 * The semantic layer is deliberately built from references - `--color-foreground` is
 * `var(--color-navy-900)` - so that the relationship is visible in the stylesheet. Anything
 * measuring a colour needs the value at the end of that chain.
 */
export function readResolvedTokens(source?: string): Map<string, string> {
  const raw = readRawTokens(source);
  const resolved = new Map<string, string>();

  for (const name of raw.keys()) {
    resolved.set(name, resolveToken(name, raw, new Set()));
  }

  return resolved;
}

/** Only the tokens that resolve to a single colour, keyed without the `--color-` prefix. */
export function readColorTokens(source?: string): Map<string, string> {
  const colors = new Map<string, string>();

  for (const [name, value] of readResolvedTokens(source)) {
    if (!name.startsWith('--color-')) continue;
    if (!isSingleColor(value)) continue;

    colors.set(name.slice('--color-'.length), value);
  }

  return colors;
}

/**
 * Follows `var()` chains to a literal.
 *
 * `seen` is not defensive padding. `--font-wordmark` legitimately references
 * `--font-sans`, and a typo turning a reference back on itself would otherwise recurse
 * until the stack gives out, reported as a stack overflow in a test with no mention of the
 * token that caused it.
 */
function resolveToken(name: string, raw: Map<string, string>, seen: Set<string>): string {
  const value = raw.get(name);

  if (value === undefined) return '';

  if (seen.has(name)) {
    throw new Error(`Token ${name} references itself, directly or through a chain.`);
  }

  seen.add(name);

  return value.replaceAll(/var\(\s*(--[\w-]+)\s*\)/g, (_match, referenced: string) =>
    resolveToken(referenced, raw, seen),
  );
}

/**
 * Removes comments before parsing.
 *
 * Done first so a `{`, `}`, or `;` inside prose cannot be mistaken for syntax. The token
 * file is heavily commented by design, and one of those comments mentions
 * `[data-theme="dark"]`.
 */
function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

/** The body of the `@theme` block, by brace matching rather than a regex. */
function extractThemeBlock(source: string): string {
  const start = source.indexOf('@theme');

  if (start === -1) {
    throw new Error('theme.css contains no @theme block. Tokens cannot be read.');
  }

  const open = source.indexOf('{', start);
  let depth = 0;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }

  throw new Error('The @theme block in theme.css is unterminated.');
}

/** Splits on semicolons at parenthesis depth zero. */
function splitDeclarations(block: string): string[] {
  const declarations: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of block) {
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;

    if (char === ';' && depth === 0) {
      declarations.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() !== '') declarations.push(current);

  return declarations;
}

/**
 * Whether a resolved value is one colour rather than a list or a font stack.
 *
 * Shadows and gradients contain colours but are not colours, and feeding one to a contrast
 * calculation produces a number that looks plausible and means nothing.
 */
function isSingleColor(value: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(value.trim());
}
