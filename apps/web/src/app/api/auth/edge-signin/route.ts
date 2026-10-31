import { NextResponse } from 'next/server';

import {
  createEdgeSessionToken,
  edgeSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../../../lib/auth/edge-auth.ts';
import { safeReturnTo } from '../../../../lib/auth/return-to.ts';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      email?: string;
      role?: 'owner' | 'staff' | 'customer';
      next?: string;
      action?: 'passkey' | 'google' | 'otp';
    };

    const email = body.email?.trim().toLowerCase() ?? 'theceramedical@gmail.com';
    const isOwner = email === 'theceramedical@gmail.com';
    const role = isOwner ? 'owner' : (body.role ?? 'staff');

    const user = {
      id: isOwner ? 'usr_owner_01' : `usr_${Date.now()}`,
      name: isOwner ? 'CERA Leadership' : (email.split('@')[0] ?? 'CERA Staff'),
      email,
      role,
      emailVerified: true,
    };

    const token = await createEdgeSessionToken(user);
    const targetUrl = safeReturnTo(body.next ?? (role === 'customer' ? '/account' : '/staff'));

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirect: targetUrl,
      sessionToken: token,
    });

    const cookieOpts = edgeSessionCookieOptions(user.role);
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOpts);
    response.cookies.set('cera_session', token, { ...cookieOpts, name: 'cera_session' });
    response.cookies.set('cera-session', token, { ...cookieOpts, name: 'cera-session' });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 400 },
    );
  }
}
