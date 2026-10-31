import { Heading, Text } from '@cera/ui/typography';
import { Mail } from 'lucide-react';

import type { ContentDocument } from '@cera/contracts';

import { CONFIRMED_TEAM_MEMBERS } from './about/about-profile.tsx';
import { AppLink } from './link.tsx';

export function TeamSection({ document }: { readonly document?: ContentDocument | undefined }) {
  const cmsMembers = (document?.teamMembers ?? []).filter(
    (member) =>
      member.role.trim().length > 0 &&
      member.photo !== undefined &&
      member.photo.url.trim().length > 0,
  );

  const publicMembers = cmsMembers.length > 0 ? cmsMembers : CONFIRMED_TEAM_MEMBERS;

  if (publicMembers.length === 0) return null;
  return (
    <section className="border-b border-border bg-surface-tint" aria-labelledby="team-heading">
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="flex flex-col gap-3">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
            Leadership & Research Team
          </Text>
          <Heading id="team-heading" level={2} size="h2">
            {document?.teamHeading?.trim() ? document.teamHeading : 'Our Research Team'}
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-1 max-w-3xl">
            {document?.teamIntroduction?.trim()
              ? document.teamIntroduction
              : 'Our team combines expertise across preclinical in vivo pharmacology, animal models, molecular genetics, histopathology, and computational drug modeling.'}
          </Text>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {publicMembers.map((member) => (
            <article
              key={member.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs transition-shadow hover:shadow-md"
            >
              {member.photo ? (
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-subtle">
                  <img
                    src={member.photo.url}
                    alt={member.photo.alt || member.name}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/40 via-transparent to-transparent opacity-60" />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <Heading level={3} size="h4" className="tracking-tight text-heading">
                  {member.name}
                </Heading>
                <Text size="body-sm" className="mt-1 font-semibold text-primary">
                  {member.role}
                </Text>
                {'designation' in member && member.designation ? (
                  <Text size="caption" tone="muted" className="mt-0.5">
                    {member.designation}
                  </Text>
                ) : null}
                {member.biography ? (
                  <Text size="body-sm" tone="muted" className="mt-3 flex-1 leading-relaxed">
                    {member.biography}
                  </Text>
                ) : null}
                {member.links && member.links.length > 0 ? (
                  <ul className="mt-5 flex list-none flex-wrap gap-3 border-t border-border pt-4 text-caption">
                    {member.links.map((link) => (
                      <li key={`${link.url}-${link.label}`}>
                        <AppLink
                          href={link.url}
                          external={link.url.startsWith('http')}
                          className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                        >
                          {link.url.startsWith('mailto:') ? (
                            <Mail size={14} aria-hidden="true" />
                          ) : null}
                          {link.label}
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
