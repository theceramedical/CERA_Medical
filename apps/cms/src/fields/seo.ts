import type { Field } from 'payload';

/**
 * The SEO group on every publishable document.
 *
 * Field lengths match `SeoSchema` in `@cera/contracts`, so a CMS save that
 * exceeds them is rejected here rather than at the web-app boundary after
 * publish. `ogImage` is a relation rather than a free URL so the asset goes
 * through the Media collection's alt-text requirement.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text', maxLength: 70 },
    { name: 'description', type: 'textarea', maxLength: 180 },
    { name: 'canonicalUrl', type: 'text' },
    {
      name: 'ogImage',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      // Preview routes force noindex regardless. This is for a published page
      // that should still stay out of a search result - a thank-you page, a
      // legal hold.
      admin: { description: 'Published but not indexed. Preview is always noindex.' },
    },
  ],
};
