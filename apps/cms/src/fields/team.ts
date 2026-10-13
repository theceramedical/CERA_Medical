import type { Field } from 'payload';

export const teamFields: Field[] = [
  { name: 'teamHeading', type: 'text', defaultValue: 'Our team', maxLength: 160 },
  { name: 'teamIntroduction', type: 'textarea', maxLength: 800 },
  {
    name: 'teamMembers',
    label: 'Team members',
    type: 'array',
    maxRows: 60,
    admin: {
      description: 'Add, edit, reorder or remove team profiles. Publish the page to show changes.',
    },
    fields: [
      { name: 'name', type: 'text', required: true, maxLength: 160 },
      { name: 'role', type: 'text', required: true, maxLength: 160 },
      { name: 'photo', type: 'upload', relationTo: 'media' },
      { name: 'biography', type: 'textarea', maxLength: 2000 },
      {
        name: 'links',
        type: 'array',
        maxRows: 8,
        fields: [
          { name: 'label', type: 'text', required: true, maxLength: 80 },
          {
            name: 'url',
            type: 'text',
            required: true,
            maxLength: 500,
            admin: {
              description:
                'Full https:// profile URL, such as LinkedIn, ORCID or a university page.',
            },
            validate: (value: unknown) => {
              if (typeof value !== 'string') return 'Enter an HTTPS profile URL.';
              try {
                const url = new URL(value);
                return url.protocol === 'https:' && !url.username && !url.password
                  ? true
                  : 'Enter an HTTPS profile URL without credentials.';
              } catch {
                return 'Enter an HTTPS profile URL.';
              }
            },
          },
        ],
      },
    ],
  },
];
