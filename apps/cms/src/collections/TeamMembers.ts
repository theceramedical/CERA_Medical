import { publishFieldAccess } from '../access/matrix.ts';
import { approverOnlyTeamPublish } from '../hooks/team-publication.ts';

import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const TeamMembers: CollectionConfig = publishable({
  slug: 'team-members',
  labels: { singular: 'Team Member', plural: 'Team Members' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'designation', 'displayOrder', '_status', 'updatedAt'],
    group: 'Content',
    description:
      'Do not add profiles until CERA has confirmed current details and supplied approved photos.',
  },
  extraHooks: { beforeChange: [approverOnlyTeamPublish] },
  extraFields: [
    { name: 'name', type: 'text', required: true, maxLength: 160 },
    { name: 'role', type: 'text', required: true, maxLength: 200 },
    { name: 'designation', type: 'text', required: true, maxLength: 200 },
    { name: 'affiliation', type: 'text', required: true, maxLength: 240 },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Use only a photo supplied and approved for public use by CERA.' },
    },
    { name: 'displayOrder', type: 'number', required: true, min: 0, defaultValue: 0 },
    {
      name: 'clientConfirmed',
      type: 'checkbox',
      defaultValue: false,
      access: { create: publishFieldAccess, update: publishFieldAccess },
      admin: {
        position: 'sidebar',
        description: 'Approver only: confirm CERA has verified this profile’s current details.',
      },
    },
    {
      name: 'photoApproved',
      type: 'checkbox',
      defaultValue: false,
      access: { create: publishFieldAccess, update: publishFieldAccess },
      admin: {
        position: 'sidebar',
        description: 'Approver only: confirm this uploaded photo is approved for public use.',
      },
    },
  ],
});
