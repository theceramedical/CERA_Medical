import 'server-only';

import { RoleSchema, type Role } from '@cera/contracts';
import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { compactDecrypt } from 'jose';
import { cookies } from 'next/headers';

export interface WebSession {
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly roles: readonly Role[];
  readonly mfa: boolean;
}

export async function getSession(): Promise<WebSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token === undefined) return null;
  const secret = process.env.SESSION_SECRET;
  if (secret === undefined) return null;
  try {
    const key = Buffer.from(secret, 'base64').subarray(0, 32);
    const { plaintext } = await compactDecrypt(token, key);
    const value = JSON.parse(new TextDecoder().decode(plaintext)) as WebSession & {
      exp?: number;
      absoluteExp?: number;
    };
    const now = Math.floor(Date.now() / 1000);
    if (
      !value.exp ||
      !value.absoluteExp ||
      value.exp <= now ||
      value.absoluteExp <= now ||
      !Array.isArray(value.roles) ||
      value.roles.some((role) => !RoleSchema.safeParse(role).success)
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
