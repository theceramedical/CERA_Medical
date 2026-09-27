/**
 * The public-read constraint.
 *
 * A boolean `read: true` combined with `draft: true` on the request is how drafts
 * leak: Payload treats a boolean as "yes, including drafts if the caller asked".
 * A query constraint cannot be widened by the caller - `_status: { equals: 'published' }`
 * is intersected with whatever they sent, so `draft: true` still only returns
 * published rows.
 *
 * This is CMS-101, and it is the only public-read implementation in this app.
 * Anything that returns `true` for an anonymous user is a regression.
 */
export const PUBLISHED_CONSTRAINT = { _status: { equals: 'published' } } as const;

export type PublishedConstraint = typeof PUBLISHED_CONSTRAINT;
