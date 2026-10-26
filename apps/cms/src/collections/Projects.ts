import { asString } from '../lib/as-string.ts';
import { PREVIEW_BREAKPOINTS, previewUrl } from '../lib/preview.ts';

import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const PROJECT_CATEGORIES = [
  'Preclinical Studies',
  'Molecular Research',
  'Biomedical Data Analysis',
] as const;

export const PROJECT_STATUSES = ['Running', 'Completed'] as const;

export const Projects: CollectionConfig = publishable({
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'projectStatus', 'sortOrder', 'featuredOnHome', '_status'],
    group: 'Content',
    description: 'Public project cards for Our Projects. Keep client data and unpublished articles off this collection.',
    livePreview: {
      url: ({ data }) => previewUrl(`/projects#${asString(data.slug)}`),
      breakpoints: [...PREVIEW_BREAKPOINTS],
    },
    preview: (data) => previewUrl(`/projects#${asString(data.slug)}`),
  },
  extraFields: [
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 1200,
      admin: { description: 'Public project description. Do not include client or participant data.' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: PROJECT_CATEGORIES.map((label) => ({ label, value: label })),
    },
    {
      name: 'projectStatus',
      type: 'select',
      required: true,
      options: PROJECT_STATUSES.map((label) => ({ label, value: label })),
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first within their status group.' },
    },
    {
      name: 'featuredOnHome',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Include this published project in the homepage selection.' },
    },
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'imageAlt', type: 'text', maxLength: 300 },
    {
      name: 'publicationUrl',
      type: 'text',
      maxLength: 2048,
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return true;
        if (typeof value !== 'string') return 'Enter an https URL.';
        try {
          return new URL(value).protocol === 'https:' ? true : 'Publication links must use https.';
        } catch {
          return 'Enter a valid https URL.';
        }
      },
      admin: { condition: (_, siblingData) => siblingData.projectStatus === 'Completed' },
    },
  ],
});
