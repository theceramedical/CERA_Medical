import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareDatabase, readHeaders, readCookies } = vi.hoisted(() => ({
  getCloudflareDatabase: vi.fn(),
  readHeaders: vi.fn(),
  readCookies: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: readHeaders, cookies: readCookies }));
vi.mock('../cloudflare/runtime.ts', () => ({ getCloudflareDatabase }));

import { getSession } from './session.ts';

const ISSUER = 'https://cera-auth-tests.cloudflareaccess.com';
const AUDIENCE = 'cera-staff-test-audience';
const STAFF_HOST = 'staff.ceramedical.org';
const STAFF_EMAIL = 'staff@example.org';
const STAFF_SUBJECT = 'access-user-subject';

let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;
let publicJwk: Record<string, unknown>;
let currentHeaders = new Headers();
let users: Map<string, { id: string; email: string; role: string }>;

function fakeDatabase() {
  return {
    prepare(sql: string) {
      return {
        bind(...values: (string | number)[]) {
          return {
            first<T>() {
              if (sql.includes('WHERE id = ?')) {
                const user = users.get(String(values[0]));
                return Promise.resolve(
                  (user ? { id: user.id, email: user.email } : null) as T | null,
                );
              }
              if (sql.includes('WHERE lower(email) = lower(?)')) {
                const user = [...users.values()].find(
                  ({ email }) => email.toLowerCase() === String(values[0]).toLowerCase(),
                );
                return Promise.resolve(
                  (user ? { id: user.id, email: user.email } : null) as T | null,
                );
              }
              return Promise.resolve(null);
            },
            run() {
              if (sql.includes('INSERT INTO user')) {
                const [id, , email, role] = values;
                users.set(String(id), { id: String(id), email: String(email), role: String(role) });
              }
              return Promise.resolve({ success: true });
            },
          };
        },
      };
    },
  };
}

async function accessToken(
  claims: { issuer?: string; audience?: string; email?: string; subject?: string } = {},
  signingKey = privateKey,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: claims.email ?? STAFF_EMAIL, type: 'app' })
    .setProtectedHeader({ alg: 'RS256', kid: 'access-test-key' })
    .setIssuer(claims.issuer ?? ISSUER)
    .setAudience(claims.audience ?? AUDIENCE)
    .setSubject(claims.subject ?? STAFF_SUBJECT)
    .setIssuedAt(now)
    .setNotBefore(now - 1)
    .setExpirationTime(now + 300)
    .sign(signingKey);
}

async function requestSession(token: string, host = STAFF_HOST) {
  currentHeaders = new Headers({ host, 'cf-access-jwt-assertion': token });
  return getSession();
}

describe('Cloudflare Access staff session', () => {
  beforeAll(async () => {
    const pair = await generateKeyPair('RS256', { modulusLength: 2048 });
    const otherPair = await generateKeyPair('RS256', { modulusLength: 2048 });
    privateKey = pair.privateKey;
    otherPrivateKey = otherPair.privateKey;
    publicJwk = {
      ...(await exportJWK(pair.publicKey)),
      alg: 'RS256',
      kid: 'access-test-key',
      use: 'sig',
    };
  });

  beforeEach(() => {
    users = new Map();
    currentHeaders = new Headers();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', ISSUER);
    vi.stubEnv('CLOUDFLARE_ACCESS_AUD', AUDIENCE);
    vi.stubEnv(
      'CLOUDFLARE_ACCESS_STAFF_ROLE_MAP',
      JSON.stringify({ [STAFF_EMAIL]: ['administrator'] }),
    );
    getCloudflareDatabase.mockResolvedValue(fakeDatabase());
    readHeaders.mockImplementation(() => currentHeaders);
    readCookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ keys: [publicJwk] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    );
  });

  it('accepts a valid Access application JWT and creates the D1 actor', async () => {
    const session = await requestSession(await accessToken());

    expect(session).toMatchObject({
      sub: STAFF_SUBJECT,
      email: STAFF_EMAIL,
      emailVerified: true,
      roles: ['administrator'],
    });
    expect(users.get(STAFF_SUBJECT)).toMatchObject({
      email: STAFF_EMAIL,
      role: 'administrator',
    });
  });

  it('rejects a token with the wrong issuer', async () => {
    expect(
      await requestSession(await accessToken({ issuer: 'https://attacker.example' })),
    ).toBeNull();
  });

  it('rejects a token with the wrong audience', async () => {
    expect(await requestSession(await accessToken({ audience: 'another-access-app' }))).toBeNull();
  });

  it('rejects a token signed by a key outside the Access JWKS', async () => {
    expect(await requestSession(await accessToken({}, otherPrivateKey))).toBeNull();
  });

  it('rejects an otherwise valid assertion on the public host', async () => {
    expect(await requestSession(await accessToken(), 'www.ceramedical.org')).toBeNull();
  });

  it('rejects when the staff role map is missing', async () => {
    vi.stubEnv('CLOUDFLARE_ACCESS_STAFF_ROLE_MAP', '');

    expect(await requestSession(await accessToken())).toBeNull();
  });

  it('rejects an authenticated email that is not in the staff role map', async () => {
    expect(await requestSession(await accessToken({ email: 'unknown@example.org' }))).toBeNull();
  });
});
