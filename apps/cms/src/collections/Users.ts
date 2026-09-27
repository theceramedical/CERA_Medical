import type { CollectionConfig } from 'payload';

/**
 * Staff accounts for the admin UI.
 *
 * Federated to Authentik in Phase 09. Until then these are local Payload users
 * with a `role` field that the access functions read. A user created without a
 * role is an editor, which is the safe default: they can draft and cannot
 * publish. Making the default `administrator` is how the first seed user
 * accidentally ships as a god-mode account that nobody remembers exists.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
    group: 'Settings',
  },
  auth: true,
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'administrator',
    update: ({ req, id }) => req.user?.role === 'administrator' || req.user?.id === id,
    delete: ({ req }) => req.user?.role === 'administrator',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'content_editor',
      options: [
        { label: 'Content Editor', value: 'content_editor' },
        { label: 'Content and Clinical Approver', value: 'content_approver' },
        { label: 'Operations Support', value: 'operations_manager' },
        { label: 'Enquiry Handler', value: 'enquiry_handler' },
        { label: 'Administrator', value: 'administrator' },
        { label: 'Auditor', value: 'auditor' },
      ],
      access: {
        // Only an administrator can change someone else's role. An approver
        // promoting themselves is the failure the two-person rule exists to
        // prevent at the identity layer.
        update: ({ req }) => req.user?.role === 'administrator',
      },
    },
  ],
};
