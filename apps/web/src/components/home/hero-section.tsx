import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { HeroScript } from '@cera/ui/script-art';
import { Heading, Text } from '@cera/ui/typography';
import Image from 'next/image';

import { HERO, HERO_TRUST_ITEMS } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

/**
 * The hero (design-language.md section 5.6): copy on the left at 7/12, imagery on the right at 5/12,
 * stacked below `lg`.
 */
export function HeroSection() {
  return (
    <section className="bg-surface-tint">
      <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <Text as="p" size="eyebrow" tone="muted">
            {HERO.eyebrow}
          </Text>

          {/*
           * One `<h1>`, two colours.
           *
           * The teal second line is a `<span>` inside the same heading, not a second heading. Two
           * headings would give the page two top-level titles and make the outline claim the hero is
           * two sections; a `<span>` is a colour change inside one sentence, which is what it is.
           *
           * The line break is a `<br />` rather than a block element for the same reason - and it is
           * safe here because both halves are complete phrases, so a screen reader that ignores the
           * break still reads a sentence that makes sense.
           */}
          <Heading level={1} size="display-1" className="mt-4">
            {HERO.headlinePrimary}
            <br />
            {/*
             * `text-accent-hover`, not `text-accent`, despite nothing here hovering.
             *
             * `accent-hover` is teal-700 and `accent` is the sampled teal-600, and the pairing the
             * contrast gate actually verifies is "accent headline on hero tint" against teal-700 -
             * see `TEXT_PAIRINGS` in `@cera/ui/pairings`. Using the token that reads better in this
             * position would be an unverified colour pair on the largest text on the site.
             */}
            <span className="text-accent-hover">{HERO.headlineAccent}</span>
          </Heading>

          <Text size="body-lg" tone="muted" measure className="mt-6">
            {HERO.body}
          </Text>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AppButtonLink href="/services" variant="primary" size="lg">
              Explore Services
            </AppButtonLink>
            <AppButtonLink href="/enquiry" variant="outline" size="lg">
              Make an Enquiry
            </AppButtonLink>
          </div>

          {/*
           * The trust row is a `<ul>`.
           *
           * Three short assertions with icons look like decoration and are in fact a list of claims,
           * which is what a screen reader should be told - "list, three items" is useful orientation,
           * and three floating strings are not.
           */}
          <ul className="mt-10 flex list-none flex-col gap-4 p-0 sm:flex-row sm:gap-8">
            {HERO_TRUST_ITEMS.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <Icon icon={item.icon} size="sm" className="shrink-0 text-accent" />
                <Text size="body-sm" tone="muted">
                  {item.label}
                </Text>
              </li>
            ))}
          </ul>
        </div>

        {/*
         * `relative` so the script and the badge can be positioned against this column. Without it
         * both would resolve against the initial containing block and end up somewhere else entirely -
         * the failure found in the table wrapper in Phase 03 WP-03.8.
         */}
        <div className="relative lg:col-span-5">
          {/*
           * Capped and centred until the columns split at `lg`.
           *
           * The portrait is 4:5, so at full width on a stacked layout it is 1.25 screens tall - the
           * visitor scrolls past an image rather than reading a page, and the section below the hero
           * stops existing on a phone. The reference image is a desktop composition and says nothing
           * about this, so the cap is a decision rather than a transcription: `max-w-sm` keeps the
           * portrait at a size a person reads as an illustration next to the copy instead of as a
           * full-bleed banner. Cropping to a landscape ratio would have been the alternative and is
           * worse - it would cut the subject out of a photograph nobody has taken yet.
           */}
          <div className="mx-auto max-w-sm overflow-hidden rounded-lg lg:max-w-none">
            {/*
             * The portrait is meaningful rather than decorative - it is what establishes that this is
             * a service delivered by people - so section 5.6 requires a real `alt`.
             *
             * **The `alt` describes the placeholder, not the photograph that will replace it.** The
             * asset is pending (PRD 22), and writing "a CERA Medical researcher at work" now would
             * be a description of something not on the page: a screen reader user would be told about
             * an image that does not exist, which is worse than being told it is a placeholder. The
             * real `alt` arrives with the real photograph.
             *
             * `width` and `height` are explicit and match the file's intrinsic size, which is what
             * reserves the box before the bytes arrive and holds cumulative layout shift at zero.
             * `priority` because this is the largest contentful paint on the page - without it Next
             * lazy-loads it and the measurement is of an empty box.
             */}
            <Image
              src="/images/hero-portrait.svg"
              alt="Placeholder illustration; CERA Medical research-laboratory imagery is pending."
              width={640}
              height={800}
              priority
              // `sizes` tells the browser how wide the image will actually be, so it downloads the
              // right source. Without it Next assumes full viewport width and fetches the largest
              // candidate for a column that is five twelfths of the page.
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>

          {/*
           * Decorative lettering, top-right. `HeroScript` is `aria-hidden` and has no title, so it
           * contributes nothing to the announcement - which is correct: the words it draws are not
           * content, they are ornament, and reading them out would interrupt the headline.
           *
           * Hidden below `lg`, and `lg` rather than `md` for a layout reason rather than a legibility
           * one. Section 5.6 calls for the script *overlaid* on the portrait, and that is only true
           * once the columns split: below `lg` the portrait is capped and centred, so a decoration
           * anchored to the column's right edge hangs off in the empty margin beside it, which reads
           * as a stray element rather than an overlay.
           *
           * The opacity is a colour value the contrast gate does not cover, and that is correct here:
           * SC 1.4.11 exempts graphics that are pure decoration, and this one is `aria-hidden` with no
           * accessible name precisely because removing it would cost the page nothing.
           */}
          <HeroScript className="pointer-events-none absolute -top-6 right-0 hidden w-40 text-accent/60 lg:block" />

          {/*
           * The overlapping badge card.
           *
           * Positioned from the bottom-left and deliberately inset rather than hanging off the edge:
           * section 5.6 requires that it neither covers the subject's face nor clips at 320px, and a
           * card that extends past its column does both at some width. `max-w-xs` caps it so the copy
           * wraps inside the card instead of widening it.
           */}
          <div className="mt-4 rounded-lg bg-surface p-5 shadow-md lg:absolute lg:bottom-6 lg:-left-6 lg:mt-0 lg:max-w-xs">
            <div className="flex items-start gap-4">
              <IconDisc tone="accent">
                <Icon icon={HERO.badge.icon} size="lg" />
              </IconDisc>

              <div>
                {/*
                 * `h2`, because this card is a top-level sibling of the hero's `h1` rather than a
                 * subsection of it. Drawn at `h4`, which is the size the reference uses.
                 */}
                <Heading level={2} size="h4">
                  {HERO.badge.title}
                </Heading>
                <Text size="caption" tone="muted" className="mt-1">
                  {HERO.badge.body}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
