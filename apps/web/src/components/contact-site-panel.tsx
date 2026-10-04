import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Mail, MapPin, Phone } from 'lucide-react';

import { AppButtonLink, AppLink } from './link.tsx';

import type { LucideIcon } from 'lucide-react';

export interface ContactLocation {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
  readonly icon?: 'mail' | 'mapPin' | 'phone';
}

export interface ContactEnquiryPanel {
  readonly heading?: string;
  readonly body?: string;
  readonly buttonLabel?: string;
  readonly buttonHref?: string;
  readonly showInlineForm?: boolean;
  readonly formSectionTitle?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  mapPin: MapPin,
  phone: Phone,
};

export function ContactSitePanel({
  locations,
  enquiry,
}: {
  readonly locations: readonly ContactLocation[];
  readonly enquiry: ContactEnquiryPanel;
}) {
  if (locations.length === 0 && !enquiry.heading) return null;

  return (
    <div className="mx-auto grid max-w-site grid-cols-1 gap-12 px-6 py-12 md:px-10 lg:grid-cols-2 lg:py-16">
      {locations.length > 0 ? (
        <section aria-labelledby="contact-details">
          <Heading level={2} size="h3" id="contact-details">
            How to reach us
          </Heading>
          <dl className="mt-6 flex flex-col gap-6">
            {locations.map((entry) => {
              const IconComponent = entry.icon === undefined ? MapPin : ICON_MAP[entry.icon];
              return (
                <div key={entry.label}>
                  <dt className="flex items-center gap-3 text-eyebrow text-muted uppercase">
                    <Icon
                      icon={IconComponent ?? MapPin}
                      size="md"
                      className="shrink-0 text-primary"
                    />
                    {entry.label}
                  </dt>
                  <dd className="mt-1 pl-8 text-body text-copy">
                    {entry.href === undefined ? (
                      entry.value
                    ) : (
                      <AppLink href={entry.href}>{entry.value}</AppLink>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ) : null}

      {enquiry.heading ? (
        <section aria-labelledby="contact-enquiry" className="rounded-lg bg-surface-tint p-8">
          <Heading level={2} size="h3" id="contact-enquiry">
            {enquiry.heading}
          </Heading>
          {enquiry.body ? (
            <Text tone="muted" className="mt-4">
              {enquiry.body}
            </Text>
          ) : null}
          <AppButtonLink
            href={enquiry.buttonHref ?? '/enquiry?source=web_contact_page'}
            variant="primary"
            className="mt-6"
          >
            {enquiry.buttonLabel ?? 'Make an Enquiry'}
          </AppButtonLink>
        </section>
      ) : null}
    </div>
  );
}
