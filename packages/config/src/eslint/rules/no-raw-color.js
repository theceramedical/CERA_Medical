/**
 * Forbids raw colour values outside the design-token layer.
 *
 * ADR-001 makes the reference image the single source of colour truth, and
 * design-language.md section 7 states that tokens are declared once. A review
 * comment cannot enforce that across a growing codebase, so this rule does.
 *
 * Flags:
 *   - hex literals: #fff, #ffffff, #ffffffff
 *   - functional notation: rgb(), rgba(), hsl(), hsla(), oklch(), lab(), color()
 *   - arbitrary Tailwind colour: bg-[#0A5378], text-[rgb(10,83,120)]
 *
 * Allows:
 *   - files under the configured token directories (default: token/style paths)
 *   - `transparent`, `currentColor`, `inherit`, and `none`
 *   - fully transparent black, which is idiomatic in shadow ramps
 */

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const FUNCTIONAL = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/;
const ARBITRARY_TW =
  /\b(?:bg|text|border|ring|shadow|outline|decoration|divide|from|via|to|fill|stroke|accent|caret|placeholder)-\[(?:#|rgb|hsl|oklch|lab)/;

/** Shadow ramps legitimately express opacity over a token colour. */
const SHADOW_EXEMPT = /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,/;

/** @type {import('eslint').Rule.RuleModule} */
export const noRawColor = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw colour values outside the design-token layer; use a semantic token instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowPaths: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawColor:
        'Raw colour "{{value}}" is not allowed here. Use a semantic design token (see .planning/design-language.md section 1.3). Tokens are declared only in packages/ui/src/styles/.',
    },
  },

  create(context) {
    const allowPaths = context.options[0]?.allowPaths ?? [
      'packages/config/src/eslint',
      'packages/ui/src/styles',
      '/styles/theme.css',
      '/styles/tokens',
    ];

    const filename = context.filename.replaceAll('\\', '/');
    if (allowPaths.some((allowed) => filename.includes(allowed))) {
      return {};
    }

    /**
     * @param {string} text
     * @returns {string | null} the offending fragment, or null when clean
     */
    function findViolation(text) {
      if (SHADOW_EXEMPT.test(text)) return null;
      return (
        text.match(HEX)?.[0] ?? text.match(FUNCTIONAL)?.[0] ?? text.match(ARBITRARY_TW)?.[0] ?? null
      );
    }

    /** @param {import('estree').Node & { value?: unknown }} node */
    function checkStringNode(node, raw) {
      const violation = findViolation(raw);
      if (violation !== null) {
        context.report({ node, messageId: 'rawColor', data: { value: violation } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkStringNode(node, node.value);
        }
      },
      TemplateElement(node) {
        if (typeof node.value?.raw === 'string') {
          checkStringNode(node, node.value.raw);
        }
      },
      JSXAttribute(node) {
        // Catches style={{ color: '#fff' }} where the literal visitor already
        // fires, but also className strings assembled inline.
        if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
          checkStringNode(node.value, node.value.value);
        }
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export const ceraPlugin = {
  meta: { name: '@cera/eslint-plugin', version: '0.1.0' },
  rules: { 'no-raw-color': noRawColor },
};
