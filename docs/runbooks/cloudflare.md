# Cloudflare edge (DNS, proxy, R2)

CERA production expects Cloudflare in front of the Hetzner host for DNS and (optionally) the orange-cloud proxy. TLS termination on the origin is still Caddy; Cloudflare should use **Full (strict)** when the origin presents a valid certificate.

## DNS records (production)

Point these at the production server IPv4 (A/AAAA). Proxy mode is recommended for `www` and apex; keep `api` proxied so WAF and rate limits apply at the edge.

| Host        | Purpose                                          |
| ----------- | ------------------------------------------------ |
| `@` (apex)  | Redirect to `www` at Caddy                       |
| `www`       | Public site (`apps/web`)                         |
| `api`       | Fastify API                                      |
| `admin`     | Payload CMS                                      |
| `catalogue` | Vendure dashboard                                |
| `auth`      | Authentik                                        |
| `crm`       | ERPNext frontend                                 |
| `media`     | Cloudflare R2 public bucket (not the app server) |

## Tokens and secrets

- **DNS edit token** (scoped): used only by the custom Caddy build for DNS-01 ACME when HTTP-01 is not used. Store in the host secret store, never in git.
- **R2 credentials**: `S3_*` variables in `/opt/cera/.env` for CMS and commerce asset plugins.
- Do not trust inbound `X-Forwarded-For` from the public internet; Caddy strips or overwrites forwarded headers from clients. Application code uses `X-Forwarded-Proto` / `X-Forwarded-Host` only on the hop from Caddy to `apps/web`.

## Verification

```bash
dig +short www.ceramedical.org A
curl -sS -I https://www.ceramedical.org/ | head -5
curl -sS https://api.ceramedical.org/health
```

After deploy, `https://www.ceramedical.org/` must return **200**, not a chain of **308** responses to the same URL.
