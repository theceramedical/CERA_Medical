#!/usr/bin/env bash
# Verifies encrypted CERA database backups remain local even with legacy remote settings.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
fixture="$(mktemp -d)"
cleanup() { rm -rf -- "$fixture"; }
trap cleanup EXIT
project="$fixture/project"
mkdir -p "$project/infra/scripts" "$fixture/bin"
cp "$root/infra/scripts/backup.sh" "$root/infra/scripts/deploy-common.sh" "$project/infra/scripts/"
printf 'BACKUP_AGE_PUBLIC_KEY=age1test-recipient\nBACKUP_RETENTION_DAYS=14\n' > "$project/.env"
printf 'IMAGE_TAG=test\n' > "$project/.release.env"
printf 'legacy-remote:old/path\n' > "$project/.backup-remote"
cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == compose ]]
while [[ "$1" != exec ]]; do shift; done
shift
[[ "$1" == -T && "$2" == postgres ]]
shift 2
[[ "$1" == pg_dump ]]
printf 'synthetic database dump for %s\n' "${@: -1}"
MOCK
cat > "$fixture/bin/age" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
while (($#)); do
  if [[ "$1" == -o ]]; then
    shift
    cat > "$1"
    exit
  fi
  shift
done
echo 'age mock expected -o output path' >&2
exit 1
MOCK
cat > "$fixture/bin/rclone" <<'MOCK'
#!/usr/bin/env bash
printf 'unexpected rclone call: %s\n' "$*" >> "$MOCK_RCLONE_LOG"
exit 99
MOCK
chmod 700 "$fixture/bin/"*
MOCK_RCLONE_LOG="$fixture/rclone.log" \
CERA_ENV_FILE="$project/.env" RELEASE_FILE="$project/.release.env" \
BACKUP_TARGET_DIR="$fixture/backups" BACKUP_REMOTE_FILE="$project/.backup-remote" \
BACKUP_OFFSITE_REMOTE='s3:should-never-be-used' PATH="$fixture/bin:$PATH" \
  bash "$project/infra/scripts/backup.sh" production
mapfile -t archives < <(find "$fixture/backups" -maxdepth 1 -type f -name 'production-*.dump.age' | sort)
[[ "${#archives[@]}" -eq 5 ]]
for archive in "${archives[@]}"; do
  test -s "$archive"
  [[ "$(stat -c '%a' "$archive")" == 600 ]]
done
test ! -e "$fixture/rclone.log"
echo 'CERA local-only encrypted backup fixture passed'
