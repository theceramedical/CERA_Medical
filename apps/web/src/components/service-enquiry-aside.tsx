import { Heading, Text } from '@cera/ui/typography';
import { CheckCircle2, Clock3, MessageSquare, ShieldCheck } from 'lucide-react';

import { checkoutEnabled } from '../lib/checkout-enabled.ts';

import { AddToCartButton } from './add-to-cart-button.tsx';
import { AppButtonLink } from './link.tsx';

import type { LayoutBlock } from './cms-content-page.tsx';

function stringField(block: LayoutBlock, key: string): string {
  return typeof block[key] === 'string' ? block[key] : '';
}

function recordArray(block: LayoutBlock, key: string): readonly LayoutBlock[] {
  const value = block[key];
  return Array.isArray(value)
    ? value.filter((item): item is LayoutBlock => item !== null && typeof item === 'object')
    : [];
}

const DEFAULT_TRUST = [
  'Reply target: within three working days',
  'Do not include direct participant identifiers',
  'Protocol, timeline and deliverables documented',
] as const;

export interface ServiceEnquiryAsideProps {
  readonly slug: string;
  readonly displayPrice: string | null;
  readonly listPriceMinor: number | null;
  readonly productCheckoutEnabled: boolean;
  readonly enquiryEnabled: boolean;
  readonly enquiryAside: LayoutBlock | null;
  readonly sidebarCards: readonly LayoutBlock[];
}

export function ServiceEnquiryAside({
  slug,
  displayPrice,
  listPriceMinor,
  productCheckoutEnabled,
  enquiryEnabled,
  enquiryAside,
  sidebarCards,
}: ServiceEnquiryAsideProps) {
  const eyebrow = enquiryAside ? stringField(enquiryAside, 'eyebrow') : 'Project inquiry';
  const title =
    enquiryAside && stringField(enquiryAside, 'title').length > 0
      ? stringField(enquiryAside, 'title')
      : 'Start a project conversation';
  const body =
    enquiryAside && stringField(enquiryAside, 'body').length > 0
      ? stringField(enquiryAside, 'body')
      : 'Tell us about your research question, materials or data, expected outputs and timeline. Scope, cost and delivery are agreed in writing before work begins.';
  const buttonLabel =
    enquiryAside && stringField(enquiryAside, 'buttonLabel').length > 0
      ? stringField(enquiryAside, 'buttonLabel')
      : 'Request this service';

  const trustFromCms = recordArray(enquiryAside ?? {}, 'trustItems')
    .map((row) => stringField(row, 'label'))
    .filter((line) => line.length > 0);
  const trustItems = trustFromCms.length > 0 ? trustFromCms : [...DEFAULT_TRUST];

  return (
    <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
      <div className="rounded-lg border border-border border-t-4 border-t-primary bg-surface-tint p-6 shadow-card">
        <div className="flex items-center gap-2 text-accent">
          <MessageSquare aria-hidden className="size-5" />
          <Text size="eyebrow" className="uppercase tracking-wider">
            {eyebrow}
          </Text>
        </div>
        <Heading level={2} size="h4" className="mt-2">
          {title}
        </Heading>
        <Text size="body-sm" tone="muted" className="mt-3">
          {body}
        </Text>
        {displayPrice !== null ? (
          <Text className="mt-4 font-semibold text-primary">{displayPrice}</Text>
        ) : null}
        {checkoutEnabled() &&
        productCheckoutEnabled &&
        listPriceMinor !== null &&
        listPriceMinor > 0 ? (
          <div className="mt-4">
            <AddToCartButton slug={slug} />
          </div>
        ) : null}
        {enquiryEnabled ? (
          <AppButtonLink href={`/services/${slug}/enquiry`} className="mt-6 w-full justify-center">
            {buttonLabel}
          </AppButtonLink>
        ) : (
          <Text size="body-sm" tone="muted" className="mt-6">
            This service is available by referral only.
          </Text>
        )}
        <ul className="mt-6 flex list-none flex-col gap-3 border-t border-border pt-6 p-0">
          {trustItems.map((line) => (
            <li key={line} className="flex gap-3">
              {line.toLowerCase().includes('reply') ? (
                <Clock3 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              ) : line.toLowerCase().includes('identifier') ? (
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              ) : (
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
              )}
              <Text size="body-sm">{line}</Text>
            </li>
          ))}
        </ul>
      </div>

      {sidebarCards.map((card, index) => {
        const cardTitle = stringField(card, 'title');
        const cardBody = stringField(card, 'body');
        const items = recordArray(card, 'items');
        const bullets = recordArray(card, 'bullets')
          .map((row) => stringField(row, 'text'))
          .filter((t) => t.length > 0);
        const key = card.id === undefined ? `sidebar-${String(index)}` : String(card.id);
        return (
          <div
            key={key}
            className="rounded-lg border border-border bg-surface-subtle p-5 shadow-card"
          >
            <Heading level={3} size="h4" className="uppercase tracking-wide text-primary">
              {cardTitle}
            </Heading>
            {cardBody ? (
              <Text size="body-sm" tone="muted" className="mt-3">
                {cardBody}
              </Text>
            ) : null}
            {items.length > 0 ? (
              <dl className="mt-4 space-y-3">
                {items.map((item) => {
                  const label = stringField(item, 'label');
                  const detail = stringField(item, 'detail');
                  return (
                    <div key={label}>
                      <dt className="text-body-sm font-semibold text-copy">{label}</dt>
                      {detail ? <dd className="mt-0.5 text-body-sm text-muted">{detail}</dd> : null}
                    </div>
                  );
                })}
              </dl>
            ) : null}
            {bullets.length > 0 ? (
              <ul className="mt-4 flex list-none flex-col gap-2 p-0">
                {bullets.map((line) => (
                  <li key={line} className="flex gap-2 text-body-sm text-muted">
                    <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
