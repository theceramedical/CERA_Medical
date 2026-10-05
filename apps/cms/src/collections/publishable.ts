import { documentAccess } from '../access/matrix.ts';
import { reviewFields } from '../fields/review.ts';
import { seoField } from '../fields/seo.ts';
import { slugField } from '../fields/slug.ts';
import { auditAfterChange, auditAfterDelete } from '../hooks/audit.ts';
import { publicationBeforeChange } from '../hooks/before-change.ts';
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate.ts';

import type { CollectionConfig, Field } from 'payload';

/**
 * The versions, access, hooks, and fields every publishable collection shares.
 *
 * Drafts with autosave and scheduled publish. Restore is a write of `_status`
 * (Payload applies the version by updating the document), so the publication
 * hook is the restore gate - an editor restoring a published version is an
 * editor publishing, and the hook rejects it.
 */
export function publishable(options: {
  readonly slug: CollectionConfig['slug'];
  readonly labels: NonNullable<CollectionConfig['labels']>;
  readonly admin: NonNullable<CollectionConfig['admin']>;
  readonly extraFields?: CollectionConfig['fields'];
  readonly slugField?: Field;
  readonly extraHooks?: Pick<
    NonNullable<CollectionConfig['hooks']>,
    'beforeChange' | 'afterChange' | 'afterDelete'
  >;
}): CollectionConfig {
  return {
    slug: options.slug,
    labels: options.labels,
    admin: options.admin,
    access: documentAccess,
    versions: {
      drafts: {
        autosave: { interval: 10_000 },
        schedulePublish: true,
      },
      maxPerDoc: 50,
    },
    hooks: {
      beforeChange: [publicationBeforeChange, ...(options.extraHooks?.beforeChange ?? [])],
      afterChange: [
        auditAfterChange(`content.${options.slug}`),
        revalidateAfterChange(options.slug),
        ...(options.extraHooks?.afterChange ?? []),
      ],
      afterDelete: [
        auditAfterDelete,
        revalidateAfterDelete,
        ...(options.extraHooks?.afterDelete ?? []),
      ],
    },
    fields: [
      { name: 'title', type: 'text', required: true, maxLength: 200 },
      options.slugField ?? slugField,
      seoField,
      ...reviewFields,
      ...(options.extraFields ?? []),
    ],
  };
}
