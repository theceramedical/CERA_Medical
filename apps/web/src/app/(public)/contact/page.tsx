import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

import { AppButtonLink, AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';

import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * Contact details.
 *
 * Placeholder values pending CERA's own (PRD 22), and deliberately obvious ones - a `0000` phone
 * number and an `example.com` address - so that nobody mistakes them for real and calls them. A
 * plausible-looking fake is worse than an obvious one.
 */

export const metadata: Metadata = {
  title: 'Contact CERA Medical',
  description: 'How to reach CERA Medical by email or phone, and our opening hours.',
};

/**
 * The block is a `<dl>`, not a list of paragraphs.
 *
 * Each entry is genuinely a label and a value - "Email" and the address - which is what a description
 * list is for, and a screen reader announces the pair. A `<ul>` of "Email: x@y" strings carries the
 * same words and none of the relationship, so a user navigating by list items hears the label and the
 * value as one undifferentiated string.
 */
interface ContactEntry {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  /** A `mailto:` or `tel:` URL, where one makes sense. */
  readonly href?: string;
}

const CONTACT_ENTRIES: readonly ContactEntry[] = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@example.com',
    href: 'mailto:hello@example.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    // `tel:` keeps the number dialable on a phone, which is most of the traffic to a page like this.
    value: '+44 (0)20 0000 0000',
    href: 'tel:+442000000000',
  },
  {
    icon: Clock,
    label: 'Opening hours',
    value: 'Monday to Friday, 9am to 5pm',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Placeholder address, pending confirmation',
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        lede="For anything about a specific enquiry, quote its reference number and we will find it straight away."
      />

      <div className="mx-auto grid max-w-site grid-cols-1 gap-12 px-6 py-12 md:px-10 lg:grid-cols-2 lg:py-16">
        <section aria-labelledby="contact-details">
          <Heading level={2} size="h3" id="contact-details">
            How to reach us
          </Heading>

          {/*
           * One `<div>` per entry, containing the `<dt>` and `<dd>` directly.
           *
           * A `<dl>` has a restrictive content model: its children may only be `dt`, `dd`, `div`,
           * `script`, or `template`, and a wrapping `div` may hold only the `dt`/`dd` group. The first
           * draft here nested a second `div` inside the wrapper to stack the label over the value next
           * to the icon, which reads perfectly well and is invalid - axe reported both
           * `definition-list` and `dlitem`, meaning assistive technology no longer treats these as
           * term/value pairs at all. The icon therefore lives inside the `<dt>`, and the `<dd>` is
           * indented to match: `pl-8` is the `size-5` icon plus `gap-3`.
           */}
          <dl className="mt-6 flex flex-col gap-6">
            {CONTACT_ENTRIES.map((entry) => (
              <div key={entry.label}>
                <dt className="flex items-center gap-3 text-eyebrow text-muted uppercase">
                  {/* Decorative. The `<dt>` it sits in already says "Email"; an icon repeating that
                      in an announcement is noise. */}
                  <Icon icon={entry.icon} size="md" className="shrink-0 text-primary" />
                  {entry.label}
                </dt>
                <dd className="mt-1 pl-8 text-body text-copy">
                  {/* `AppLink` sees the `mailto:`/`tel:` scheme and renders a plain anchor, so the
                      router is never asked to prefetch an email address. */}
                  {entry.href === undefined ? (
                    entry.value
                  ) : (
                    <AppLink href={entry.href}>{entry.value}</AppLink>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="contact-enquiry" className="rounded-lg bg-surface-tint p-8">
          <Heading level={2} size="h3" id="contact-enquiry">
            Enquiring about a service?
          </Heading>

          <Text tone="muted" className="mt-4">
            The enquiry form is the fastest route: it records which service you are asking about,
            gives you a reference number straight away, and lets you follow progress without having
            to call.
          </Text>

          <AppButtonLink href="/enquiry" variant="primary" className="mt-6">
            Make an Enquiry
          </AppButtonLink>
        </section>
      </div>
    </>
  );
}
