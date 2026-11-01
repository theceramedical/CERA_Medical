import 'server-only';

import { RoleSchema, STAFF_ROLES, type Role } from '@cera/contracts';
import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { compactDecrypt, createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { cookies, headers } from 'next/headers';

import { getCloudflareDatabase } from '../cloudflare/runtime.ts';

import type { D1Database } from '../cloudflare/runtime.ts';

export interface WebSession {
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly roles: readonly Role[];
}

const remoteJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/** D1 production uses the Access assertion as staff identity; local fallback uses CERA cookies. */
export async function getSession(): Promise<WebSession | null> {
  const db = await getCloudflareDatabase();
  if (db !== null) {
    try {
      return await accessStaffSession(await headers(), db);
    } catch {
      return null;
    }
  }

  return readCookieSession();
}

async function accessStaffSession(
  requestHeaders: Headers,
  db: D1Database,
): Promise<WebSession | null> {
  const token = requestHeaders.get('cf-access-jwt-assertion');
  if (!token || token.length > 8192 || !isStaffHost(requestHeaders)) return null;

  const teamDomain = configuredTeamDomain();
  const audience = process.env.CLOUDFLARE_ACCESS_AUD?.trim();
  // Access authenticates staff at the edge using the configured email OTP policy. The signed
  // assertion proves that Access admitted the identity; application roles remain allowlisted here.
  if (!teamDomain || !audience) return null;

  try {
    let jwks = remoteJwks.get(teamDomain);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
      remoteJwks.set(teamDomain, jwks);
    }

    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      audience,
      clockTolerance: 5,
      issuer: teamDomain,
      requiredClaims: ['exp', 'iat', 'nbf', 'sub', 'email', 'type'],
    });
    const identity = accessIdentity(payload);
    if (!identity) return null;

    const roles = staffRolesForEmail(identity.email);
    if (!roles) return null;
    const primaryRole = roles[0];
    if (!primaryRole) return null;

    const actorId = await upsertAccessStaffUser(db, identity.sub, identity.email, primaryRole);
    if (!actorId) return null;

    return {
      sub: actorId,
      email: identity.email,
      emailVerified: true,
      roles,
    };
  } catch {
    return null;
  }
}

function accessIdentity(payload: JWTPayload): { sub: string; email: string } | null {
  if (
    payload.type !== 'app' ||
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    typeof payload.email !== 'string' ||
    !isEmail(payload.email)
  )
    return null;

  return { sub: payload.sub, email: payload.email.trim().toLowerCase() };
}

function staffRolesForEmail(email: string): readonly Role[] | null {
  const raw = process.env.CLOUDFLARE_ACCESS_STAFF_ROLE_MAP;
  if (!raw || raw.length > 32_768) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const rolesByEmail = new Map<string, readonly Role[]>();
    for (const [configuredEmail, configuredRoles] of Object.entries(parsed)) {
      const normalizedEmail = configuredEmail.trim().toLowerCase();
      if (!isEmail(normalizedEmail) || rolesByEmail.has(normalizedEmail)) return null;
      if (
        !Array.isArray(configuredRoles) ||
        configuredRoles.length === 0 ||
        configuredRoles.some(
          (role) =>
            typeof role !== 'string' ||
            !RoleSchema.safeParse(role).success ||
            !STAFF_ROLES.includes(role as Role),
        )
      )
        return null;

      rolesByEmail.set(normalizedEmail, [...new Set(configuredRoles as Role[])]);
    }

    return rolesByEmail.get(email) ?? null;
  } catch {
    return null;
  }
}

async function upsertAccessStaffUser(
  db: D1Database,
  subject: string,
  email: string,
  primaryRole: Role,
): Promise<string | null> {
  try {
    const subjectUser = await db
      .prepare('SELECT id, email FROM user WHERE id = ?')
      .bind(subject)
      .first<{ id: string; email: string }>();
    if (subjectUser && subjectUser.email.trim().toLowerCase() !== email) return null;

    const emailUser = subjectUser
      ? null
      : await db
          .prepare('SELECT id, email FROM user WHERE lower(email) = lower(?)')
          .bind(email)
          .first<{ id: string; email: string }>();
    if (emailUser && emailUser.email.trim().toLowerCase() !== email) return null;

    const actorId = subjectUser?.id ?? emailUser?.id ?? subject;
    const name = email.split('@')[0] ?? 'CERA staff';
    await db
      .prepare(
        `INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, unixepoch(), unixepoch())
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, email_verified = 1,
          role = excluded.role, updated_at = unixepoch()`,
      )
      .bind(actorId, name, email, primaryRole)
      .run();

    const stored = await db
      .prepare('SELECT id, email FROM user WHERE id = ?')
      .bind(actorId)
      .first<{ id: string; email: string }>();
    return stored?.email.trim().toLowerCase() === email ? stored.id : null;
  } catch {
    return null;
  }
}

function configuredTeamDomain(): string | null {
  const raw = process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN?.trim();
  if (!raw) return null;
  try {
    const team = new URL(raw);
    if (
      team.protocol !== 'https:' ||
      team.username ||
      team.password ||
      team.pathname !== '/' ||
      team.search ||
      team.hash ||
      !team.hostname.endsWith('.cloudflareaccess.com')
    )
      return null;
    return team.origin;
  } catch {
    return null;
  }
}

function isStaffHost(requestHeaders: Headers): boolean {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
  const requestHost = requestHeaders.get('host');
  if (!configuredSite || !requestHost) return false;

  try {
    const publicHost = new URL(configuredSite).hostname.toLowerCase().replace(/^www\./, '');
    const receivedHost = new URL(`https://${requestHost}`).hostname.toLowerCase();
    return receivedHost === `staff.${publicHost}`;
  } catch {
    return false;
  }
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readCookieSession(): Promise<WebSession | null> {
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
