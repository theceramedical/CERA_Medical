# Export operator credentials (production host)

Secrets live on the VPS only. Use this to build one private document for your password manager.

## One-shot command (SSH as root)

After the repo is on the server at `/opt/cera`:

```bash
bash /opt/cera/infra/scripts/export-operator-credentials.sh | tee ~/cera-operator-secrets.txt
chmod 600 ~/cera-operator-secrets.txt
```

Copy to your laptop, then **delete the file on the server**:

```bash
scp root@178.105.73.48:~/cera-operator-secrets.txt ~/Downloads/
ssh root@178.105.73.48 'rm -f ~/cera-operator-secrets.txt'
```

## Before the script exists on the server

Run this inline (same output shape):

```bash
ssh root@178.105.73.48 'bash -s' <<'SCRIPT'
CERA_ENV_FILE=/opt/cera/.env
FRAPPE_DIR=/opt/frappe_docker
get_env() { grep -m1 "^$1=" "$CERA_ENV_FILE" 2>/dev/null | sed "s/^$1=//" | sed "s/^\"//;s/\"$//"; }
d=$(get_env CERA_DOMAIN); d=${d:-ceramedical.org}
echo "=== URLS ==="
echo "CMS https://admin.$d"
echo "Vendure https://catalogue.$d/dashboard"
echo "CRM https://crm.$d"
echo "Authentik https://auth.$d"
echo "Site https://www.$d"
echo "=== LOGINS ==="
echo "CMS email=$(get_env CMS_BOOTSTRAP_ADMIN_EMAIL)"
echo "CMS password=$(get_env CMS_BOOTSTRAP_ADMIN_PASSWORD)"
echo "Vendure user=$(get_env SUPERADMIN_USERNAME)"
echo "Vendure password=$(get_env SUPERADMIN_PASSWORD)"
echo "Authentik email=$(get_env AUTHENTIK_BOOTSTRAP_EMAIL)"
echo "Authentik password=$(get_env AUTHENTIK_BOOTSTRAP_PASSWORD)"
echo "ERPNext Administrator password=$(cat $FRAPPE_DIR/.admin-initial 2>/dev/null || echo MISSING)"
echo "=== ERPNext API (not web login) ==="
cat /opt/cera/.erpnext-credentials 2>/dev/null
echo "=== FULL .env ==="
cat /opt/cera/.env
SCRIPT
```

## What is not included

- **Google OAuth** client secret (Google Cloud Console + Authentik source).
- **Cloudflare** API token, **GitHub** `PRODUCTION_SSH_KEY`, **SSH** host keys.
- **R2** keys if stored only in Cloudflare (check `S3_*` in `.env` when using R2).

See [editor-handbook.md](./editor-handbook.md) for what each URL is for.
