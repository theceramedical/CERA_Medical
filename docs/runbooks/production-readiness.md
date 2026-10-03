# Production readiness checklist

Use this after code changes and before accepting public traffic.

## Public site

- [ ] `NEXT_PUBLIC_SITE_URL` is `https://www.ceramedical.org` (www + https).
- [ ] `curl -sS -I https://www.ceramedical.org/` returns **200**, not a chain of **308** to the same URL.
- [ ] Homepage sections render: services, audience, process, insights, enquiry CTA.
- [ ] `pnpm health` passes on the host after deploy.

## Edge and DNS

- [ ] Cloudflare DNS for apex, `www`, `api`, `admin`, `catalogue`, `auth`, `crm`, `media` — see [cloudflare.md](./cloudflare.md).
- [ ] Caddy presents valid TLS; only ports 80/443 public.

## Applications

- [ ] GHCR images pulled by digest via `infra/scripts/deploy.sh production`.
- [ ] Migrator ran once per release before app containers start.
- [ ] CMS bootstrap executed (`bootstrap-client-content` via deploy) on first install.
- [ ] Authentik flows and CERA groups configured (`configure-authentik-cera.py`).

## Integrations

- [ ] **ERPNext** at `crm.<domain>`; worker `ERPNEXT_*` variables set — [erpnext.md](./erpnext.md).
- [ ] **Resend** domain verified; webhooks hit `api` `/v1/webhooks/resend`.
- [ ] **R2** bucket and `S3_PUBLIC_URL` / `media.<domain>` for CMS and commerce assets.

## Secrets

- [ ] `/opt/cera/.env` mode 600; never committed.
- [ ] Rotate any credential that was shared in chat, email, or tickets.

## Release

- [ ] `gh auth login` on the machine that triggers GitHub Actions.
- [ ] Run **Release to production** from `main` (repository owner).
- [ ] `infra/scripts/smoke-test.sh` and external smoke pass.
