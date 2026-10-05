# Authentik social login (Google / Microsoft)

CERA does not implement Google OAuth in the web app. Social buttons call `/auth/signin?provider=…`, which adds Authentik’s `source=<slug>` parameter to the OIDC authorize URL.

## Google (production)

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth **Web application** client.
2. Authorized redirect URI: `https://auth.<CERA_DOMAIN>/source/oauth/callback/google/` (slug must match).
3. In Authentik admin: **Directory → Federation and Social login → Google OAuth Source**, slug `google`, paste client ID/secret.
4. On the CERA host `.env`, set `OIDC_GOOGLE_SOURCE_SLUG=google` and redeploy **web** so the sign-in page shows the button.

New users still need the **`cera-customers`** group (or verified email per CERA’s OIDC mapping) before the portal grants access.

## Customers vs staff

| Audience      | Google on website                                                   | Email / password | Authentik groups                                               |
| ------------- | ------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------- |
| **Customers** | Yes (`/auth/sign-in`, `/auth/sign-up`)                              | Yes              | `cera-customers` (auto when email verified and no staff group) |
| **Staff**     | **No** — use staff entry (`/auth/sign-in?next=/staff` hides Google) | Yes + **MFA**    | `cera-enquiry-handlers`, `cera-administrators`, etc.           |

Operator account **`admin@ceramedical.org`** is staff only (no `cera-customers`). Re-apply after deploy:

```bash
CERA_OPERATOR_PASSWORD='…' bash /opt/cera/infra/scripts/ensure-authentik-cera-admin.sh
```

## Microsoft

Same pattern with slug `microsoft` and `OIDC_MICROSOFT_SOURCE_SLUG=microsoft`.
