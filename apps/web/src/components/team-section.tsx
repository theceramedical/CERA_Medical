import { Heading, Text } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

import { ABOUT_TEAM_PROFILES_REQUIRING_CONFIRMATION } from './about/about-profile.tsx';
import { AppLink } from './link.tsx';

export function TeamSection({ document }: { readonly document: ContentDocument }) {
  const publicMembers = (document.teamMembers ?? []).filter((member) =>
    !ABOUT_TEAM_PROFILES_REQUIRING_CONFIRMATION.has(member.name) &&
    member.role.trim().length > 0 &&
    member.photo !== undefined &&
    member.photo.url.trim().length > 0 &&
    member.photo.alt.trim().length > 0,
  );
  if (publicMembers.length === 0) return null;
  return (
    <section className="bg-surface-tint" aria-labelledby="team-heading">
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Heading id="team-heading" level={2} size="h2">
          {document.teamHeading?.trim() ? document.teamHeading : 'Our team'}
        </Heading>
        {document.teamIntroduction ? (
          <Text className="mt-4 max-w-3xl">{document.teamIntroduction}</Text>
        ) : null}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {publicMembers.map((member) => (
            <article
              key={member.id}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              {member.photo ? (
                <img
                  src={member.photo.url}
                  alt={member.photo.alt || member.name}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : null}
              <div className="p-6">
                <Heading level={3} size="h4">
                  {member.name}
                </Heading>
                <Text className="mt-2 font-semibold text-primary">{member.role}</Text>
                {member.biography ? (
                  <Text className="mt-4 whitespace-pre-wrap">{member.biography}</Text>
                ) : null}
                <ul className="mt-5 flex list-none flex-wrap gap-4 p-0">
                  {member.links.map((link) => (
                    <li key={`${link.url}-${link.label}`}>
                      <AppLink href={link.url} external>
                        {link.label}
                      </AppLink>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
