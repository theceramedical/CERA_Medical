import { Heading, Text } from '@cera/ui/typography';

import { PageHeader } from './page-header.tsx';

import type { ReactNode } from 'react';

/**
 * The layout for a policy document: privacy notice, terms of service.
 *
 * Shared because both are the same shape - a dated preamble, then numbered sections of headings and
 * paragraphs - and because the one thing these pages must get right is the heading outline. A policy
 * is a document people navigate rather than read start to finish, and for a screen reader user the
 * heading list *is* the table of contents. Building each page by hand is how one of them ends up with
 * an `h3` under an `h1`.
 *
 * Sections are data rather than children so the same array can also render the on-page contents list
 * below, which is the sighted equivalent of that heading list.
 */
export interface PolicySection {
  /** Used for the heading and, slugged, for its `id`. */
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface PolicyDocumentProps {
  readonly title: string;
  readonly lede: string;
  /**
   * When the document last changed, as an ISO date.
   *
   * Rendered in a `<time datetime>` so the machine-readable value and the displayed text cannot
   * disagree - and a policy with no date is one nobody can tell whether they have already agreed to.
   */
  readonly updated: string;
  readonly sections: readonly PolicySection[];
  /** Shown above the sections. Used to mark these as placeholder text pending legal review. */
  readonly notice?: ReactNode;
}

/** `Our commitments` becomes `our-commitments`. Stable across renders, so links to it keep working. */
function slug(heading: string): string {
  return heading
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

export function PolicyDocument({ title, lede, updated, sections, notice }: PolicyDocumentProps) {
  return (
    <>
      <PageHeader title={title} lede={lede}>
        <Text size="caption" tone="muted" className="mb-4">
          Last updated{' '}
          <time dateTime={updated}>
            {new Date(updated).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </Text>
      </PageHeader>

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="max-w-measure">
          {notice}

          {/*
           * An on-page contents list, as a labelled navigation landmark.
           *
           * `<ol>` because the order is meaningful - policy sections are referred to by position -
           * and each entry is an in-page anchor, which is a plain `<a href="#...">` rather than a
           * `next/link`: a fragment on the current page is not a navigation the router should handle.
           */}
          <nav aria-labelledby="policy-contents" className="mt-8">
            <Heading level={2} size="h4" id="policy-contents">
              Contents
            </Heading>

            <ol className="mt-4 flex list-decimal flex-col gap-1 pl-6">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slug(section.heading)}`}
                    className="text-body-sm text-primary underline decoration-1 underline-offset-2 hover:decoration-2"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((section) => (
            <section key={section.heading} className="mt-12">
              {/*
               * The `id` is on the heading, not on the section.
               *
               * Following the contents link then moves the browser's reading position to the heading
               * itself, so a screen reader announces the section title on arrival. An `id` on the
               * wrapping `<section>` scrolls to the same place and announces nothing.
               */}
              <Heading level={2} size="h3" id={slug(section.heading)}>
                {section.heading}
              </Heading>

              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph} className="mt-4">
                  {paragraph}
                </Text>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
