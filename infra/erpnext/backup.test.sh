#!/usr/bin/env bash
# Run on a host with age installed; exercises the encrypted stream without ERPNext.
set -euo pipefail
command -v age >/dev/null
command -v age-keygen >/dev/null
root="$(cd "$(dirname "$0")/../.." && pwd)"
fixture="$(mktemp -d)"
cleanup() { rm -rf -- "$fixture"; }
trap cleanup EXIT
mkdir -p "$fixture/cera/infra/erpnext" "$fixture/frappe" "$fixture/bin"
cp "$root/infra/erpnext/compose.cera.yaml" "$fixture/cera/infra/erpnext/"
age-keygen -o "$fixture/identity" >/dev/null 2>&1
recipient="$(age-keygen -y "$fixture/identity")"
printf 'BACKUP_AGE_PUBLIC_KEY=%s\nBACKUP_RETENTION_DAYS=14\n' "$recipient" > "$fixture/cera/.backup.env"
printf 'ERPNEXT_VERSION=test\nFRAPPE_SITE_NAME=cera-production\n' > "$fixture/frappe/.env"

cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
while [[ "$1" != exec ]]; do shift; done
shift
[[ "$1" == -T && "$2" == backend ]]
shift 2
case "$1" in
  mktemp)
    /usr/bin/mktemp -d /tmp/cera-erpnext-backup.XXXXXX | tee "$MOCK_ROOT/container-dir"
    ;;
  bench)
    output="${@: -1}"
    for item in database.sql.gz site-config.json public-files.tgz private-files.tgz; do
      printf '%s\n' "$item" > "$output/$item"
    done
    ;;
  find|tar|rm) "$@" ;;
  *) echo "Unexpected mock command: $*" >&2; exit 1 ;;
esac
MOCK
chmod 700 "$fixture/bin/docker"

MOCK_ROOT="$fixture" CERA_ROOT="$fixture/cera" FRAPPE_ROOT="$fixture/frappe" \
  PATH="$fixture/bin:$PATH" bash "$root/infra/erpnext/backup.sh"
archive="$(find "$fixture/cera/backups/erpnext" -name 'erpnext-*.tar.age' -print -quit)"
test -s "$archive"
contents="$(age -d -i "$fixture/identity" "$archive" | tar -tf -)"
for item in database.sql.gz site-config.json public-files.tgz private-files.tgz; do
  [[ "$contents" == *"./$item"* ]] || { echo "Missing $item" >&2; exit 1; }
done
test ! -e "$(cat "$fixture/container-dir")"
echo 'ERPNext encrypted backup fixture passed'
