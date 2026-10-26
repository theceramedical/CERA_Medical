import { Heading, Text } from '@cera/ui/typography';

import { FacilityMedia } from '../facility-media.tsx';
import { AppLink } from '../link.tsx';

import type { PublicProject, ProjectStatus } from '../../lib/projects/listPublishedProjects.ts';

function ProjectCard({ project }: { readonly project: PublicProject }) {
  return (
    <li
      id={project.slug}
      className="scroll-mt-28 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
    >
      {project.imageUrl ? (
        <div className="relative aspect-[16/9] w-full">
          <FacilityMedia src={project.imageUrl} alt={project.imageAlt ?? ''} />
        </div>
      ) : null}
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-border bg-surface-tint px-2.5 py-1 text-caption font-semibold text-heading">
            {project.category}
          </span>
          <span className="rounded-sm border border-accent/40 bg-surface-tint-2 px-2.5 py-1 text-caption font-semibold text-accent-fill">
            {project.status}
          </span>
        </div>
        <Heading level={3} size="h4">
          {project.title}
        </Heading>
        <Text tone="muted" className="mt-3 line-clamp-3">
          {project.summary}
        </Text>
        {project.status === 'Completed' && project.publicationUrl ? (
          <a
            href={project.publicationUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex font-medium text-primary underline"
          >
            Publication
          </a>
        ) : null}
      </div>
    </li>
  );
}

function ProjectGroup({
  status,
  projects,
}: {
  readonly status: ProjectStatus;
  readonly projects: readonly PublicProject[];
}) {
  const heading = status === 'Running' ? 'Running projects' : 'Completed projects';
  const id = status.toLowerCase();
  return (
    <section className="mt-14 first:mt-0" aria-labelledby={`${id}-projects-heading`}>
      <Heading level={2} size="h2" id={`${id}-projects-heading`}>
        {heading}
      </Heading>
      {projects.length > 0 ? (
        <ul className="mt-6 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      ) : (
        <Text tone="muted" className="mt-4">
          There are no {status.toLowerCase()} projects to show right now.
        </Text>
      )}
    </section>
  );
}

export function ProjectsIndex({ projects }: { readonly projects: readonly PublicProject[] }) {
  return (
    <>
      <header className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" tone="muted">
            CERA MEDICAL
          </Text>
          <Heading level={1} size="h1" className="mt-3">
            Our Projects
          </Heading>
          <Text size="body-lg" tone="muted" measure className="mt-4">
            A selection of the studies running in our laboratories and the analyses we have
            completed. Client data are never shown on this page.
          </Text>
        </div>
      </header>
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <ProjectGroup
          status="Running"
          projects={projects.filter((project) => project.status === 'Running')}
        />
        <ProjectGroup
          status="Completed"
          projects={projects.filter((project) => project.status === 'Completed')}
        />
        <p className="mt-12 border-t border-border pt-6 text-body-sm text-muted">
          <AppLink href="/enquiry">Make an Enquiry</AppLink>
        </p>
      </div>
    </>
  );
}
