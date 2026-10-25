import 'server-only';

import { unstable_cache } from 'next/cache';

import { publicizeCmsMediaUrl } from './media-url.ts';

export interface PublishedTeamMember {
  name: string;
  role: string;
  designation: string;
  affiliation: string;
  photo: string;
  order: number;
}

export interface PublishedProject {
  slug: string;
  title: string;
  category: string;
  status: 'Running' | 'Completed';
  summary: string;
  featured: boolean;
  publicationUrl?: string;
}

const CMS_FETCH_TIMEOUT_MS = 4000;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

const PROJECT_CATEGORIES: Readonly<Record<string, string>> = {
  'preclinical-studies': 'Preclinical Studies',
  'molecular-research': 'Molecular Research',
  'biomedical-data-analysis': 'Biomedical Data Analysis',
};

const PROJECT_STATUSES: Readonly<Record<string, 'Running' | 'Completed'>> = {
  running: 'Running',
  completed: 'Completed',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeHttpsUrl(value: unknown): string | null {
  const candidate = text(value);
  if (candidate === null) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && url.username === '' && url.password === ''
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function safeMediaUrl(value: unknown): string | null {
  const candidate = text(value);
  if (candidate === null) return null;
  try {
    const url = new URL(candidate);
    if (url.username !== '' || url.password !== '') return null;
    if (url.protocol === 'https:') return url.href;
    const isLocalhost =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
    return url.protocol === 'http:' && isLocalhost ? url.href : null;
  } catch {
    return null;
  }
}

function mediaUrl(value: unknown, apiUrl: string): string | null {
  const candidate = text(isRecord(value) ? value.url : value);
  if (candidate === null) return null;
  try {
    // Resolve Payload's relative upload paths before applying the existing S3 mapping.
    const absolute = new URL(candidate, `${apiUrl.replace(/\/$/, '')}/`).href;
    return safeMediaUrl(publicizeCmsMediaUrl(absolute));
  } catch {
    return null;
  }
}

async function fetchPublishedRows(
  apiUrl: string,
  collection: 'projects' | 'team-members',
  fields: readonly string[],
  sort: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`${apiUrl.replace(/\/$/, '')}/${collection}`);
    url.searchParams.set('where[_status][equals]', 'published');
    url.searchParams.set('depth', collection === 'team-members' ? '1' : '0');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('sort', sort);
    for (const field of ['_status', ...fields]) {
      url.searchParams.set(`select[${field}]`, 'true');
    }
    if (collection === 'team-members') {
      url.searchParams.set('populate[media][url]', 'true');
      url.searchParams.set('populate[media][filename]', 'true');
    }

    // No credentials, preview headers, or access override: Payload's public access applies.
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('Public CMS content unavailable');
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.docs)) {
      throw new Error('Invalid public CMS response');
    }
    for (const row of body.docs) {
      if (isRecord(row) && row._status === 'published') rows.push(row);
    }
    if (body.hasNextPage === false || body.docs.length < PAGE_SIZE) return rows;
  }
  throw new Error('Public CMS pagination limit exceeded');
}

const loadProjects = unstable_cache(
  async (apiUrl: string): Promise<PublishedProject[]> => {
    const rows = await fetchPublishedRows(
      apiUrl,
      'projects',
      ['slug', 'title', 'category', 'projectStatus', 'summary', 'featured', 'publicationUrl'],
      '-featured,title',
    );
    const projects: PublishedProject[] = [];
    for (const row of rows) {
      const slug = text(row.slug);
      const title = text(row.title);
      const categoryValue = text(row.category);
      const statusValue = text(row.projectStatus);
      const summary = text(row.summary);
      const category = categoryValue === null ? undefined : PROJECT_CATEGORIES[categoryValue];
      const status = statusValue === null ? undefined : PROJECT_STATUSES[statusValue];
      if (
        slug === null ||
        title === null ||
        category === undefined ||
        status === undefined ||
        summary === null ||
        typeof row.featured !== 'boolean'
      )
        continue;
      const publicationUrl = safeHttpsUrl(row.publicationUrl);
      projects.push({
        slug,
        title,
        category,
        status,
        summary,
        featured: row.featured,
        ...(publicationUrl === null ? {} : { publicationUrl }),
      });
    }
    return projects.sort(
      (a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title, 'en'),
    );
  },
  ['cms', 'projects', 'published'],
  { tags: ['cms:projects'], revalidate: 60 },
);

const loadTeamMembers = unstable_cache(
  async (apiUrl: string): Promise<PublishedTeamMember[]> => {
    const rows = await fetchPublishedRows(
      apiUrl,
      'team-members',
      [
        'name',
        'role',
        'designation',
        'affiliation',
        'photo',
        'displayOrder',
        'clientConfirmed',
        'photoApproved',
      ],
      'displayOrder,name',
    );
    const members: PublishedTeamMember[] = [];
    for (const row of rows) {
      const name = text(row.name);
      const role = text(row.role);
      const designation = text(row.designation);
      const affiliation = text(row.affiliation);
      const photo = mediaUrl(row.photo, apiUrl);
      if (
        name === null ||
        role === null ||
        designation === null ||
        affiliation === null ||
        typeof row.displayOrder !== 'number' ||
        !Number.isFinite(row.displayOrder) ||
        row.clientConfirmed !== true ||
        row.photoApproved !== true ||
        photo === null
      )
        continue;
      members.push({
        name,
        role,
        designation,
        affiliation,
        photo,
        order: row.displayOrder,
      });
    }
    return members.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'en'));
  },
  ['cms', 'team-members', 'published'],
  { tags: ['cms:team-members'], revalidate: 60 },
);

export async function getPublishedProjects(): Promise<PublishedProject[] | null> {
  try {
    return await loadProjects(
      process.env.CMS_API_URL ?? process.env.CMS_URL ?? 'http://localhost:3001/api',
    );
  } catch {
    // Keep transient failures out of the persistent cache so a recovering CMS can retry.
    return null;
  }
}

export async function getPublishedTeamMembers(): Promise<PublishedTeamMember[]> {
  try {
    return await loadTeamMembers(
      process.env.CMS_API_URL ?? process.env.CMS_URL ?? 'http://localhost:3001/api',
    );
  } catch {
    return [];
  }
}
