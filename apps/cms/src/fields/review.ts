import { publishFieldAccess } from '../access/matrix.ts';

import type { Field } from 'payload';

/**
 * The two-person-rule fields, plus the editor's "ready for review" flag.
 *
 * `approverId` and `publishedAt` are not writable by an editor - field-level
 * access, not a hidden input. A hidden input is still in the POST body.
 *
 * `reviewRequested` is writable by anyone who can update the document. That is
 * the queue: an editor flags a draft, an approver filters the list on this
 * field. Clearing it is the approver's signal that the draft went back.
 */
export const reviewFields: Field[] = [
  {
    name: 'reviewRequested',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: 'Flag this draft for an approver. Does not publish it.',
    },
  },
  {
    name: 'authorId',
    type: 'text',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'approverId',
    type: 'text',
    access: {
      create: publishFieldAccess,
      update: publishFieldAccess,
    },
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'publishedAt',
    type: 'date',
    access: {
      create: publishFieldAccess,
      update: publishFieldAccess,
    },
    admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
  },
  {
    /**
     * Seeded records carry this so a wipe can target them without guessing at
     * titles. Never shown; never writable from the admin.
     */
    name: 'fixture',
    type: 'checkbox',
    defaultValue: false,
    access: { update: () => false },
    admin: { hidden: true },
  },
];
