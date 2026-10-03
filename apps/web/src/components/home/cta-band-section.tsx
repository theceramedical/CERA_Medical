import { CtaScript } from '@cera/ui/script-art';
import { Heading, Text } from '@cera/ui/typography';

import { CTA_BAND } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

export interface CtaContent {
  readonly heading?: string | undefined;
  readonly body?: string | undefined;
  readonly href?: string | undefined;
  readonly label?: string | undefined;
}

/**
 * The full-bleed gradient band (design-language.md section 5.8).
 *
 * The gradient is two tokens rather than a literal: `--color-gradient-from` and `--color-gradient-to`
 * are declared in theme.css, which is what lets the contrast gate measure the pairing at both stops
 * *and* at the midpoint - a gradient written inline would be a colour no test can find.
 *
 * **Gradient text is forbidden here,** per section 5.8. Text with a gradient fill has no single
 * foreground colour, so its contrast is unmeasurable and varies across the glyph; both the heading and
 * the sub-line are flat white on the gradient instead.
 */
export function CtaBandSection({ content = {} }: { readonly content?: CtaContent }) {
  const cta = { ...CTA_BAND, ...content };
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-linear-to-r from-gradient-from to-gradient-to"
    >
      <div className="mx-auto flex max-w-site flex-col gap-6 px-6 py-10 md:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
        <div>
          <Heading level={2} size="h2" tone="on-dark" id="cta-heading">
            {cta.heading}
          </Heading>

          {/*
           * `on-dark` at full opacity, not the reference's 85%.
           *
           * The reference draws this sub-line at 85% white, which on the darker `gradient-to` stop
           * drops below 4.5:1 at this size. Section 1.4 records the substitution: the visual intent -
           * a sub-line that recedes from the heading - is carried by the smaller size and the lighter
           * weight instead, both of which cost nothing in contrast.
           */}
          <Text size="body" tone="on-dark" measure className="mt-2">
            {cta.body}
          </Text>
        </div>

        <div className="flex items-center gap-8">
          <AppButtonLink
            href={cta.href ?? '/enquiry'}
            variant="on-dark"
            size="lg"
            className="shrink-0"
          >
            {cta.label ?? 'Make an Enquiry'}
          </AppButtonLink>

          {/*
           * Decorative lettering with a heart, hidden below `lg` per section 5.8 - there is no room
           * for it beside the button at narrower widths, and a decorative element is the first thing
           * that should go rather than the thing that forces a horizontal scroll.
           */}
          <CtaScript className="hidden w-36 text-on-primary/70 lg:block" />
        </div>
      </div>
    </section>
  );
}
