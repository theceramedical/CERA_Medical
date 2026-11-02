import { NextResponse } from 'next/server';

import { isStaffReturnTo, safeReturnTo } from '../../../lib/auth/return-to.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export function GET(request: Request): NextResponse {
  const url = new URL(request.url);
  const next = safeReturnTo(url.searchParams.get('next'), '/staff');
  if (!isStaffReturnTo(next)) return NextResponse.redirect(new URL('/contact', url.origin), 308);
  const site = siteUrl();
  const local = ['localhost', '127.0.0.1'].includes(site.hostname);
  const staffOrigin = local
    ? url.origin
    : `${site.protocol}//staff.${site.hostname.replace(/^www\./, '')}`;
  // Cloudflare Access owns staff authentication. Visiting the protected app host starts its OTP
  // flow; this application does not collect or exchange customer/staff OIDC credentials.
  return NextResponse.redirect(new URL(next, staffOrigin), 302);
}
