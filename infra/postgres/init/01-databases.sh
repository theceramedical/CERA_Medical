#!/bin/bash
# =============================================================================
# Create the five CERA databases with least-privilege roles.
# Implements .planning/architecture.md section 5 and PRD section 9.
#
# Runs only once, against an empty data directory. To re-run:
#     docker compose down -v
#
# The isolation property this establishes: each role owns exactly one database
# and cannot connect to any other. PRD 9 requires "separate databases and
# least-privilege roles", and a shared superuser would make the audit trail in
# cera_app reachable from a CMS compromise.
# =============================================================================
set -euo pipefail

echo "[init] creating CERA databases and least-privilege roles"

create_database_and_role() {
  local db_name="$1"
  local db_user="$2"
  local db_password="$3"

  if [ -z "$db_password" ]; then
    echo "[init] FATAL: no password supplied for role '${db_user}'" >&2
    exit 1
  fi

  echo "[init]   ${db_name} owned by ${db_user}"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${db_user}') THEN
        CREATE ROLE ${db_user} WITH LOGIN PASSWORD '${db_password}';
      END IF;
    END
    \$\$;

    SELECT 'CREATE DATABASE ${db_name} OWNER ${db_user} ENCODING ''UTF8'''
    WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${db_name}')\gexec

    -- Deny the implicit PUBLIC grant so only the owner can connect.
    REVOKE ALL ON DATABASE ${db_name} FROM PUBLIC;
    GRANT CONNECT, TEMPORARY ON DATABASE ${db_name} TO ${db_user};
EOSQL

  # Lock down the public schema inside the database. Since Postgres 15 the
  # public schema is no longer world-writable, but the CREATE grant is still
  # worth revoking explicitly so the intent is visible.
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" <<-EOSQL
    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    ALTER SCHEMA public OWNER TO ${db_user};
    GRANT ALL ON SCHEMA public TO ${db_user};
EOSQL
}

create_database_and_role "${CERA_APP_DB:-cera_app}"           "${CERA_APP_DB_USER:-cera_app}"           "${CERA_APP_DB_PASSWORD:-}"
create_database_and_role "${CERA_CMS_DB:-cera_cms}"            "${CERA_CMS_DB_USER:-cera_cms}"            "${CERA_CMS_DB_PASSWORD:-}"
create_database_and_role "${CERA_COMMERCE_DB:-cera_commerce}"  "${CERA_COMMERCE_DB_USER:-cera_commerce}"  "${CERA_COMMERCE_DB_PASSWORD:-}"
create_database_and_role "${AUTHENTIK_DB:-authentik}"          "${AUTHENTIK_DB_USER:-authentik}"          "${AUTHENTIK_DB_PASSWORD:-}"
create_database_and_role "${GLITCHTIP_DB:-glitchtip}"          "${GLITCHTIP_DB_USER:-glitchtip}"          "${GLITCHTIP_DB_PASSWORD:-}"

# Vendure needs the btree_gist extension for its search index, and creating an
# extension requires elevated rights. Do it here as superuser so the Vendure
# role never needs them.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${CERA_COMMERCE_DB:-cera_commerce}" <<-'EOSQL'
  CREATE EXTENSION IF NOT EXISTS btree_gist;
EOSQL

# pg_trgm powers the near-miss matching in search (WEB-303).
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${CERA_APP_DB:-cera_app}" <<-'EOSQL'
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

echo "[init] done: 5 databases, 5 roles, no cross-database access"
