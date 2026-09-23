import { Heading, Text } from '@cera/ui/typography';

/**
 * Placeholder home page.
 *
 * Phase 04 replaces this with the hero, service row, process band, article row, CTA band, and
 * footer from the reference image. It exists now so `next build` has a route to render, which
 * is what proves the font pipeline and the Tailwind token compilation actually work end to end
 * rather than only in unit tests.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-site px-6 py-16">
      <Heading level={1} size="display-1">
        CERA Medical
      </Heading>
      <Text size="body-lg" tone="muted" measure className="mt-4">
        The design system is in place. Phase 04 builds this page.
      </Text>
    </main>
  );
}
