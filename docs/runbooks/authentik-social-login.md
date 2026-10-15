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

### What deploy configures for customer identity

`configure-authentik-customer-experience.py` (run on every deploy) applies:

- **Email verification from Google.** Authentik's Google source reads Google's v1 userinfo, which reports `verified_email` (not `email_verified`). Both are accepted. Verification is stored with the address it covers (`email_verified_address`); if the account email later changes, the email scope reports unverified.
- **Sync on every Google sign-in.** The `cera-customer-source-authentication` flow runs the `CERA sync email verification` policy, so a returning customer's status follows Google's current claim. Gmail accounts stored as unverified by the earlier mapping are corrected during deploy.
- **Real sign-out.** CERA providers use `cera-customer-invalidation` / `cera-staff-invalidation`, which end the Authentik session and redirect to `/auth/signed-out`. Authentik's default provider invalidation flow has no stages and left the Authentik session alive.
- **No stale-session denial.** The social source sign-in flow does not require an unauthenticated browser, so a leftover Authentik session for another account no longer produces “Flow does not apply to current user”.
- **No customer dead end on `/if/user/`.** The brand's default application is CERA Medical, with launch URL `https://www.ceramedical.org/auth/signin?next=/account`; external (customer) accounts reaching Authentik's portal are sent back to the website.

The deploy log prints counts only (Google-linked accounts, repaired accounts, emails shared by more than one account), never addresses.

Email/password customers without a stored `email_verified` attribute are still treated as verified by the email scope. Add an Authentik email-verification stage to the email enrollment flow before relying on that path for proof of address.

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
