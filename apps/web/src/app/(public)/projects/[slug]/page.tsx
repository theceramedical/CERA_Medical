import { Heading, Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import { AppLink } from '../../../../components/link.tsx';
import { COMPLETED_PROJECTS, RUNNING_PROJECTS } from '../../../../content/public-revision.ts';
import { getPublishedProjects } from '../../../../lib/cms/public-research-content.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateStaticParams() {
  return [...RUNNING_PROJECTS, ...COMPLETED_PROJECTS].map((project) => ({ slug: project.slug }));
}

export const dynamicParams = true;

async function findProject(slug: string) {
  const publishedProjects = await getPublishedProjects();
  if (publishedProjects !== null) {
    return publishedProjects.find((project) => project.slug === slug);
  }
  return [...RUNNING_PROJECTS, ...COMPLETED_PROJECTS].find((project) => project.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await findProject(slug);
  if (project === undefined) {
    return pageMetadata({
      title: 'Project not found',
      description: 'That project could not be found.',
      path: `/projects/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findProject(slug);
  if (project === undefined) notFound();

  const image = 'image' in project ? project.image : undefined;
  const imageAlt = 'imageAlt' in project ? project.imageAlt : undefined;
  const video = 'video' in project ? project.video : undefined;
  const publicationUrl = 'publicationUrl' in project ? project.publicationUrl : undefined;

  return (
    <article className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
      <p className="mb-4 text-caption text-muted">
        <AppLink href="/projects">Our Projects</AppLink>
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-surface-tint px-3 py-1 text-caption font-semibold">
          {project.category}
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-caption font-semibold">
          {project.status}
        </span>
      </div>
      <Heading level={1} size="h1" className="mb-4 max-w-3xl">
        {project.title}
      </Heading>
      <Text size="body-lg" tone="muted" className="mb-8 max-w-3xl">
        {project.summary}
      </Text>
      {image === undefined ? null : (
        <figure className="max-w-3xl overflow-hidden rounded-lg border border-border bg-surface">
          {video === undefined ? (
            <img src={image} alt={imageAlt ?? ''} className="w-full object-cover" />
          ) : (
            <video className="w-full" poster={image} muted loop playsInline autoPlay controls>
              <source src={video} type="video/mp4" />
            </video>
          )}
          {imageAlt === undefined ? null : (
            <figcaption className="px-4 py-3 text-caption text-muted">{imageAlt}</figcaption>
          )}
        </figure>
      )}
      {publicationUrl === undefined ? null : (
        <p className="mt-8">
          <a
            href={publicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent-fill underline underline-offset-4"
          >
            Read the publication
          </a>
        </p>
      )}
    </article>
  );
}
