import { absoluteOrigin } from '../lib/seo-site.ts';

import { JsonLd, organizationJsonLd, websiteJsonLd } from './json-ld.tsx';

/** Sitewide structured data on every public page. */
export function SiteJsonLd() {
  const origin = absoluteOrigin();
  return (
    <>
      <JsonLd data={organizationJsonLd(origin)} />
      <JsonLd data={websiteJsonLd(origin)} />
    </>
  );
}
