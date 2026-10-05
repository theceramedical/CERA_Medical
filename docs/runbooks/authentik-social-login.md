# Authentik social login (Google / Microsoft)

CERA does not implement Google OAuth in the web app. Social buttons call `/auth/signin?provider=…`, which adds Authentik’s `source=<slug>` parameter to the OIDC authorize URL.

## Google (production)

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth **Web application** client.
2. Authorized redirect URI: `https://auth.<CERA_DOMAIN>/source/oauth/callback/google/` (slug must match).
3. In Authentik admin: **Directory → Federation and Social login → Google OAuth Source**, slug `google`, paste client ID/secret.
4. On the CERA host `.env`, set `OIDC_GOOGLE_SOURCE_SLUG=google` and redeploy **web** so the sign-in page shows the button.

New users still need the **`cera-customers`** group (or verified email per CERA’s OIDC mapping) before the portal grants access.

## Microsoft

Same pattern with slug `microsoft` and `OIDC_MICROSOFT_SOURCE_SLUG=microsoft`.
