import { Heading, Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { COMPLETED_PROJECTS, RUNNING_PROJECTS } from '../../../content/public-revision.ts';
import { getPublishedProjects } from '../../../lib/cms/public-research-content.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

interface ProjectListItem {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly status: string;
  readonly summary: string;
  readonly image?: string;
  readonly imageAlt?: string;
}

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Our Projects',
    description:
      'Studies running in CERA Medical laboratories and analyses that have been completed.',
    path: '/projects',
  });
}

function ProjectList({
  heading,
  projects,
}: {
  readonly heading: string;
  readonly projects: readonly ProjectListItem[];
}) {
  return (
    <section className="mb-12">
      <Heading level={2} size="h2" className="mb-6">
        {heading}
      </Heading>
      {projects.length === 0 ? (
        <Text tone="muted">No projects are currently published in this category.</Text>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              {project.image === undefined ? null : (
                <img
                  src={project.image}
                  alt={project.imageAlt ?? ''}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-tint px-3 py-1 text-caption font-semibold">
                    {project.category}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-caption font-semibold">
                    {project.status}
                  </span>
                </div>
                <Heading level={3} size="h4" className="mb-2">
                  <AppLink href={`/projects/${project.slug}`} className="no-underline">
                    {project.title}
                  </AppLink>
                </Heading>
                <Text tone="muted">{project.summary}</Text>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ProjectsPage() {
  const publishedProjects = await getPublishedProjects();
  const projects = publishedProjects ?? [...RUNNING_PROJECTS, ...COMPLETED_PROJECTS];
  const runningProjects = projects.filter((project) => project.status === 'Running');
  const completedProjects = projects.filter((project) => project.status === 'Completed');

  return (
    <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
      <Heading level={1} size="h1" className="mb-4">
        Our Projects
      </Heading>
      <Text size="body-lg" tone="muted" className="mb-12 max-w-3xl">
        A selection of the studies running in our laboratories and the analyses we have completed.
        Client data are never shown on this page.
      </Text>
      <ProjectList heading="Running projects" projects={runningProjects} />
      <ProjectList heading="Completed projects" projects={completedProjects} />
    </div>
  );
}
