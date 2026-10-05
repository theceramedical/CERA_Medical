import { Heading, Text } from '@cera/ui/typography';

import { PageHeader } from './page-header.tsx';

import type { ReactNode } from 'react';

export function AuthPageShell({
  title,
  lede,
  children,
  aside,
}: {
  readonly title: string;
  readonly lede: string;
  readonly children: ReactNode;
  readonly aside?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} lede={lede} />
      <div className="mx-auto grid max-w-site gap-8 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-16">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          {children}
        </section>
        {aside !== undefined ? (
          <aside className="rounded-lg bg-surface-tint p-6">{aside}</aside>
        ) : null}
      </div>
    </>
  );
}

export function AuthPanelIntro({
  heading,
  body,
}: {
  readonly heading: string;
  readonly body: string;
}) {
  return (
    <>
      <Heading level={2} size="h3">
        {heading}
      </Heading>
      <Text tone="muted" className="mt-3">
        {body}
      </Text>
    </>
  );
}
