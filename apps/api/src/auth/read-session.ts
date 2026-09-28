import { SESSION_COOKIE_NAME } from '@cera/contracts/session';

import { sessionKeyFromSecret, unsealSession, type SessionClaims } from './session.ts';

import type { FastifyRequest } from 'fastify';

export function createSessionReader(secret: string) {
  const key = sessionKeyFromSecret(secret);

  return async (request: FastifyRequest): Promise<SessionClaims | null> => {
    const header = request.headers.cookie;
    const token =
      tokenFromCookieHeader(header) ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (token === undefined || token.length === 0) return null;
    try {
      return await unsealSession(token, key);
    } catch {
      return null;
    }
  };
}

function tokenFromCookieHeader(header: string | string[] | undefined): string | null {
  const raw = Array.isArray(header) ? header.join('; ') : header;
  if (raw === undefined) return null;
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE_NAME) return rest.join('=');
  }
  return null;
}
