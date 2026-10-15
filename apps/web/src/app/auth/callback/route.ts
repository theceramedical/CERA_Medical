import {
  ALL_SESSION_COOKIE_NAMES,
  OIDC_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@cera/contracts/session';
import { NextResponse, type NextRequest } from 'next/server';
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';

import {
  emailVerifiedClaim,
  identityClaims,
  configuredCallbackUrl,
  oidcConfiguration,
  openHandshake,
  sealHandshake,
} from '../../../lib/auth/oidc.ts';
import { isStaffReturnTo, safeReturnTo } from '../../../lib/auth/return-to.ts';
import { rolesIncludeStaff } from '../../../lib/auth/staff-roles.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  let errorReason = 'identity';
  let response: NextResponse;
  try {
    const token = request.cookies.get(OIDC_STATE_COOKIE_NAME)?.value;
    if (!token || !url.searchParams.get('code') || !url.searchParams.get('state')) {
      errorReason = 'expired';
      throw new Error('Missing handshake');
    }
    let handshake;
    try {
      handshake = await openHandshake(token);
    } catch (error) {
      errorReason = 'expired';
      throw error;
    }
    let tokens;
    try {
      const audience =
        handshake.audience === 'staff' || isStaffReturnTo(handshake.next) ? 'staff' : 'customer';
      tokens = await authorizationCodeGrant(
        await oidcConfiguration(audience),
        configuredCallbackUrl(url, audience),
        {
          pkceCodeVerifier: handshake.verifier,
          expectedState: handshake.state,
          expectedNonce: handshake.nonce,
          idTokenExpected: true,
        },
      );
    } catch (error) {
      errorReason = 'provider';
      throw error;
    }
    let identity;
    try {
      let claimSet: Record<string, unknown> = { ...(tokens.claims() ?? {}) };
      const groups = claimSet.groups;
      const idTokenVerified = emailVerifiedClaim(claimSet.email_verified);
      const needsUserInfo =
        !Array.isArray(groups) ||
        groups.length === 0 ||
        typeof claimSet.email !== 'string' ||
        !idTokenVerified;
      if (
        needsUserInfo &&
        typeof tokens.access_token === 'string' &&
        typeof claimSet.sub === 'string'
      ) {
        const userinfo = await fetchUserInfo(
          await oidcConfiguration(handshake.audience === 'staff' ? 'staff' : 'customer'),
          tokens.access_token,
          claimSet.sub,
        );
        const userInfoVerified = emailVerifiedClaim(userinfo.email_verified);
        claimSet = { ...claimSet, ...userinfo };
        // An explicit verified claim from either token wins. A missing claim
        // does not. Spreading userinfo must not wipe a verified ID token when
        // userinfo omits the field.
        if (idTokenVerified || userInfoVerified) claimSet.email_verified = true;
      }
      identity = identityClaims(claimSet);
    } catch (error) {
      errorReason = 'identity';
      throw error;
    }
    if (!identity.roles.length) {
      errorReason = 'access';
      throw new Error('No platform role');
    }
    const staff = rolesIncludeStaff(identity.roles);
    const staffTarget = handshake.audience === 'staff' || isStaffReturnTo(handshake.next);
    if (staffTarget && !staff) {
      errorReason = 'access';
      throw new Error('Customer identity cannot enter the staff workspace');
    }
    if (!staffTarget && staff && !identity.roles.includes('customer')) {
      handshake.next = '/staff';
    }
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (staff ? 30 * 60 : 12 * 60 * 60);
    const claims = {
      ...identity,
      iat: now,
      exp,
      absoluteExp: now + (staff ? 8 * 60 * 60 : 7 * 24 * 60 * 60),
    };
    response = NextResponse.redirect(new URL(safeReturnTo(handshake.next), siteUrl()));
    response.cookies.set(SESSION_COOKIE_NAME, await sealHandshake(claims), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: exp - now,
    });
    for (const name of ALL_SESSION_COOKIE_NAMES)
      if (name !== SESSION_COOKIE_NAME)
        response.cookies.set(name, '', { secure: true, path: '/', maxAge: 0 });
  } catch (error) {
    console.error(
      'OIDC callback failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
    response = NextResponse.redirect(new URL(`/auth/error?reason=${errorReason}`, siteUrl()));
  }
  response.cookies.set(OIDC_STATE_COOKIE_NAME, '', { secure: true, path: '/', maxAge: 0 });
  return response;
}
