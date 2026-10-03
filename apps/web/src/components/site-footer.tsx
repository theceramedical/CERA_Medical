import { Heading, Text } from '@cera/ui/typography';
import { Wordmark } from '@cera/ui/wordmark';
import NextLink from 'next/link';

import { AppLink } from './link.tsx';
import { MAIN_NAV, SUPPORT_NAV } from './navigation.ts';

import type { NavItem } from './navigation.ts';

/**
 * The footer (design-language.md section 5.9): four columns and a lighter bottom bar.
 *
 * Server-rendered contact details and navigation.
 */
export function SiteFooter() {
  return (
    <footer className="bg-surface-footer">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-6 pt-12 pb-12 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
        <div>
          <Wordmark />
          <Text size="body-sm" tone="muted" className="mt-4">
            Biomedical Research and Development.
          </Text>
        </div>

        <FooterNav heading="Quick Links" items={MAIN_NAV} />
        <FooterNav heading="Support" items={SUPPORT_NAV} />

        <div>
          <FooterHeading>Contact CERA Medical</FooterHeading>
          <Text size="body-sm" tone="muted" className="mt-4">
            Project enquiries and information requests:
          </Text>
          <AppLink href="mailto:theceramedica@gmail.com" className="mt-2 inline-flex">
            theceramedica@gmail.com
          </AppLink>
        </div>
      </div>

      {/*
       * A separate, lighter bar. `border-t` rather than a second background colour, because the
       * reference's bar is only a shade apart from the footer and a 1px rule reads more clearly at
       * 400% zoom than a near-identical fill does.
       */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-site flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-10">
          {/*
           * `caption` in `neutral-600`, not the sampled `neutral-500`.
           *
           * The reference's grey measures below 4.5:1 at this size, and 13px is not large text -
           * that threshold starts at 24px, or 18.66px bold. design-language.md section 1.4 records
           * the substitution.
           */}
          <Text size="caption" tone="muted">
            © 2026 CERA Medical. All rights reserved.
          </Text>
          <Text size="caption" tone="muted">
            Biomedical research and development in Haripur, Pakistan.
          </Text>
        </div>
      </div>
    </footer>
  );
}

/**
 * One labelled link column.
 *
 * `<nav>` per column with its own `aria-label`, per section 5.9. One `<nav>` around all three would
 * be a single landmark containing multiple unrelated groups of links, which is precisely the footer a
 * screen reader user skips. The named landmarks make the page sections easy to navigate.
 *
 * The heading and the label carry the same words on purpose: `aria-labelledby` pointing at the
 * heading would also work and is one indirection more for no benefit, since the string is right here.
 */
function FooterNav({
  heading,
  items,
}: {
  readonly heading: string;
  readonly items: readonly NavItem[];
}) {
  return (
    <nav aria-label={heading}>
      <FooterHeading>{heading}</FooterHeading>

      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {items.map((item) => (
          <li key={item.href}>
            <NextLink
              href={item.href}
              className="inline-flex min-h-8 items-center text-body-sm text-neutral-700 no-underline hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * `level={2}` with `size="h4"`.
 *
 * The footer columns are top-level sections of the document, so their headings sit one level below
 * the page's `h1`; they are drawn at `h4` because that is the size the reference uses. `Heading`
 * separates the two so this is not a choice between a correct outline and correct typography.
 */
function FooterHeading({ children }: { readonly children: string }) {
  return (
    <Heading level={2} size="h4">
      {children}
    </Heading>
  );
}
