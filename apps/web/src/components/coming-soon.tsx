import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PageHeader } from './page-header.tsx';

/**
 * A page that exists, has real structure and metadata, and says plainly what is not built yet.
 *
 * The alternative was leaving these routes out until their phase, and that is worse in a way that is
 * easy to underestimate: the header and footer link to `/services`, `/articles`, `/search`,
 * `/enquiry`, `/faqs` and `/auth/sign-in`, so every one of those links would 404 for the whole of
 * Phase 04. A 404 is indistinguishable from a bug, so the shell's own navigation would be untestable -
 * the keyboard walk and the accessibility sweep would both be walking over broken links, and a real
 * broken link would hide in the noise.
 *
 * It also means the heading outline, the metadata, and the breadcrumb position for each route are
 * settled now and reviewed once, rather than six times in six later phases.
 *
 * The notice is honest rather than promotional. "Coming soon" with no further information is the
 * pattern users have learned to distrust; naming what will be here is the difference between a
 * placeholder and a dead end.
 */
export interface ComingSoonProps {
  readonly title: string;
  readonly lede: string;
  /** What will be on this page, in one sentence. Shown in the notice. */
  readonly plan: string;
}

export function ComingSoon({ title, lede, plan }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} lede={lede} />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {/*
         * `tone="info"`, which renders `role="status"` rather than `role="alert"`. This is
         * information that was already on the page when it loaded, not something that just happened,
         * and `alert` would interrupt a screen reader user's reading to tell them about it.
         */}
        <Alert tone="info" title="This page is not finished yet">
          <Text size="body-sm">{plan}</Text>
        </Alert>
      </div>
    </>
  );
}
