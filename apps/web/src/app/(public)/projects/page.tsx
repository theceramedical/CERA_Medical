import { ProjectsIndex } from '../../../components/projects/projects-index.tsx';
import { listPublishedProjects } from '../../../lib/projects/listPublishedProjects.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Our Projects',
    description: 'A selection of CERA Medical projects that are running or completed.',
    path: '/projects',
  });
}

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();
  return <ProjectsIndex projects={projects} />;
}
