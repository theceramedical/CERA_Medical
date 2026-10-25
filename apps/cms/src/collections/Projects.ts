import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const Projects: CollectionConfig = publishable({
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'projectStatus', 'featured', '_status', 'updatedAt'],
    group: 'Content',
  },
  extraFields: [
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Preclinical Studies', value: 'preclinical-studies' },
        { label: 'Molecular Research', value: 'molecular-research' },
        { label: 'Biomedical Data Analysis', value: 'biomedical-data-analysis' },
      ],
    },
    {
      name: 'projectStatus',
      type: 'select',
      required: true,
      options: [
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    { name: 'summary', type: 'textarea', required: true, maxLength: 1200 },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'publicationUrl',
      label: 'Publication URL',
      type: 'text',
      maxLength: 1000,
      validate: (value: unknown) => {
        if (value == null || value === '') return true;
        if (typeof value !== 'string') return 'Enter an HTTPS publication URL.';
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password
            ? true
            : 'Enter an HTTPS publication URL without credentials.';
        } catch {
          return 'Enter an HTTPS publication URL.';
        }
      },
      admin: { description: 'Optional. Use the public publication page URL.' },
    },
  ],
});
