import { ComingSoon } from '../../../../components/coming-soon.tsx';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Sign-in error',
    description: 'The sign-in attempt could not be completed.',
    path: '/auth/error',
    noIndex: true,
  });
}

export default function AuthErrorPage() {
  return (
    <ComingSoon
      title="Sign-in could not be completed"
      lede="The sign-in attempt expired or was cancelled. You can start again from the sign-in page."
      plan="Nothing was stored. If this keeps happening, quote the request ID from the response headers to support."
    />
  );
}
