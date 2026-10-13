import { Wordmark } from '@cera/ui/wordmark';

import type { WordmarkProps } from '@cera/ui/wordmark';

import { getPublicGlobal } from '../lib/cms/client.ts';
import { siteLogoSrc } from '../lib/site-logo.ts';

export async function SiteWordmark(props: Omit<WordmarkProps, 'logoSrc'>) {
  const settings = await getPublicGlobal('site-settings');
  return <Wordmark {...props} logoSrc={siteLogoSrc(settings)} />;
}
