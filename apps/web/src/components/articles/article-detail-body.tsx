import { Heading, Text } from '@cera/ui/typography';

import { extendedArticleSections } from '../../content/article-extended-copy.ts';
import { HOMEPAGE_ARTICLES } from '../../content/homepage.ts';
import { lexicalParagraphCount } from '../../lib/lexical-length.ts';
import { AppButtonLink } from '../link.tsx';
import { RichText } from '../rich-text.tsx';

import type { ArticleSection } from '../../content/article-extended-copy.ts';

function ExtendedSections({ sections }: { readonly sections: readonly ArticleSection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <Heading level={2} size="h3">
            {section.heading}
          </Heading>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 48)} className="mt-4" measure>
              {paragraph}
            </Text>
          ))}
          {section.bullets !== undefined && section.bullets.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-muted">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function ArticleDetailBody({
  slug,
  title,
  excerpt,
  body,
}: {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: unknown;
}) {
  const teaser = HOMEPAGE_ARTICLES.find((item) => item.slug === slug);
  const extended = extendedArticleSections(slug);
  const thin = lexicalParagraphCount(body) < 4;
  const showExtended = extended !== undefined && thin;

  return (
    <article className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {teaser ? (
            <Text
              size="eyebrow"
              className="mb-4 inline-flex rounded-full border border-border bg-surface-tint px-3 py-1 font-semibold text-accent uppercase"
            >
              {teaser.category}
            </Text>
          ) : null}
          <div className="prose-cera rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
            {showExtended ? <ExtendedSections sections={extended} /> : <RichText body={body} />}
            {showExtended && lexicalParagraphCount(body) > 0 ? (
              <div className="mt-10 border-t border-border pt-8">
                <Text size="body-sm" tone="muted" className="mb-4 font-semibold uppercase">
                  Summary
                </Text>
                <RichText body={body} />
              </div>
            ) : null}
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-lg border border-border bg-surface-tint p-6 shadow-card">
              <Heading level={2} size="h4">
                Discuss this topic
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2">
                {excerpt.length > 0 ? excerpt : title}
              </Text>
              <AppButtonLink
                href="/enquiry"
                variant="primary"
                className="mt-4 w-full justify-center"
              >
                Make an Enquiry
              </AppButtonLink>
              <AppButtonLink
                href="/services"
                variant="outline"
                className="mt-3 w-full justify-center"
              >
                View services
              </AppButtonLink>
            </div>
            <Text size="caption" tone="muted">
              Research updates describe methods and governance; they are not medical advice. Do not
              submit identifiable patient data through the public enquiry form.
            </Text>
          </div>
        </aside>
      </div>
    </article>
  );
}
