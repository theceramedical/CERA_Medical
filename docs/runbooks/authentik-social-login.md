# Authentik social login (Google / Microsoft)

CERA does not implement Google OAuth in the web app. Social buttons call `/auth/signin?provider=…`, which adds Authentik’s `source=<slug>` parameter to the OIDC authorize URL.

## Google (production)

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth **Web application** client.
2. Authorized redirect URI: `https://auth.<CERA_DOMAIN>/source/oauth/callback/google/` (slug must match).
3. In Authentik admin: **Directory → Federation and Social login → Google OAuth Source**, slug `google`, paste client ID/secret.
4. On the CERA host `.env`, set `OIDC_GOOGLE_SOURCE_SLUG=google` and redeploy **web** so the sign-in page shows the button.

New users still need the **`cera-customers`** group (or verified email per CERA’s OIDC mapping) before the portal grants access.

## After a production deploy (Google customers)

Identity claim changes (for example `email_verified` from Google) apply on the **next** OIDC login. Existing browser sessions keep the old claims until the customer signs in again.

1. On **https://www.ceramedical.org/account**, use **Sign out**.
2. **Continue with Google** (same email).
3. Reload **Your account** — the yellow “Verify your email” banner should clear when Authentik emits `email_verified: true`.

If the banner remains after that fresh Google sign-in, on the production host re-apply the customer Authentik script (same as deploy):

```bash
cd /opt/cera
bash infra/scripts/reconfigure-authentik-customer-experience.sh
```

Then in Authentik admin (**Directory → Users** → the customer): after one more Google sign-in, **Attributes** should show `email_verified: true` (set by Google mapping, not by hand). Under **Providers → CERA production OIDC**, the **email** scope must include the **CERA email verification** property mapping.

**First-time Google signup:** completing “Create your CERA account” on `auth.ceramedical.org` can land on `/if/user/` (“internal users only”). That is Authentik’s portal, not CERA. Open **https://www.ceramedical.org/auth/sign-in** and **Continue with Google** again to finish the website session.

## What visitors should see

Passwords stay in Authentik. The website does not grow a second password database.

**Practical production setup (what deploy applies):** the public Google button starts Google immediately, because the Google source is attached to the CERA identification stage. A first-time Google visitor enrolls on a flow titled “Create your CERA account” and is added to `cera-customers` unless they already belong to a staff group. Email sign-in still opens `auth.ceramedical.org`, with the application name “CERA Medical” and CERA styling, not the default Authentik staff console. Staff continue to use `/auth/sign-in?next=/staff`, which hides Google and still requires MFA.

**The other production option:** keep the same Authentik users, groups, and MFA, but render the Authentik flow inside the CERA sign-in page (Authentik’s flow executor or a framed flow) so the address bar stays on `www.ceramedical.org`. That is more front-end work and the same identity system. It is the right follow-up if the separate `auth.` host is still too visible after branding.

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
