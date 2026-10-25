import { Heading, Text } from '@cera/ui/typography';

import type { PublishedTeamMember } from '../../lib/cms/public-research-content.ts';

export function ApprovedTeamSection({
  teamMembers,
}: {
  readonly teamMembers: readonly PublishedTeamMember[];
}) {
  if (teamMembers.length === 0) return null;

  return (
    <section className="border-b border-border bg-surface" aria-labelledby="team-heading">
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
          Our team
        </p>
        <Heading level={2} size="h2" id="team-heading" className="mt-1 mb-4">
          The people behind the work
        </Heading>
        <Text tone="muted" className="mb-10 max-w-3xl">
          Preclinical, molecular and computational research at CERA Medical is led by this team.
        </Text>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((person) => (
            <li
              key={person.name}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              <img
                src={person.photo}
                alt=""
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="p-5">
                <Heading level={3} size="h4">
                  {person.name}
                </Heading>
                <Text size="body-sm" className="mt-1 font-semibold text-accent-fill">
                  {person.role}
                </Text>
                <Text size="caption" tone="muted" className="mt-1">
                  {person.designation}
                </Text>
                {person.affiliation.length > 0 ? (
                  <Text size="caption" tone="muted" className="mt-1">
                    {person.affiliation}
                  </Text>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
