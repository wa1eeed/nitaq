#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# scripts/backup-db.sh — Daily Postgres → MinIO backup with 30-day retention.
#
# Usage:
#   ./scripts/backup-db.sh                       (uses env from current shell)
#   NODE_ENV=production ./scripts/backup-db.sh   (loads .env.production)
#
# Schedule via cron (production):
#   0 2 * * *   /opt/naqla/scripts/backup-db.sh >> /var/log/naqla-backup.log 2>&1
#
# Requirements on the host:
#   • pg_dump  (postgresql-client matching the DB major version)
#   • mc       (MinIO client, `brew install minio/stable/mc` on macOS)
#   • gzip
#
# Reads:
#   DATABASE_URL          — connection string for pg_dump
#   MINIO_ENDPOINT/PORT   — MinIO host/port for `mc alias set`
#   MINIO_ROOT_USER/PASS  — MinIO credentials
#   MINIO_BUCKET          — destination bucket (must exist)
#   NODE_ENV              — used to namespace backups (dev/staging/prod)
# -----------------------------------------------------------------------------

set -euo pipefail

# ─── Load env file ───────────────────────────────────────────────────────────
ENV_NAME="${NODE_ENV:-development}"
ENV_FILE=".env.${ENV_NAME}"
if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  set -a; source "${ENV_FILE}"; set +a
fi

# ─── Validate required env ───────────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${MINIO_ENDPOINT:?MINIO_ENDPOINT is required}"
: "${MINIO_PORT:?MINIO_PORT is required}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
: "${MINIO_BUCKET:?MINIO_BUCKET is required}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_NAME="naqla-${ENV_NAME}-${TIMESTAMP}.sql.gz"
TMPFILE="$(mktemp -t naqla-backup.XXXXXX).sql.gz"
trap 'rm -f "${TMPFILE}"' EXIT

# ─── Dump + compress in a single pipeline (no intermediate disk file) ────────
echo "[$(date -u +%FT%TZ)] Dumping database..."
pg_dump --no-owner --no-privileges --clean --if-exists "${DATABASE_URL}" | gzip -9 > "${TMPFILE}"
SIZE_BYTES=$(stat -f%z "${TMPFILE}" 2>/dev/null || stat -c%s "${TMPFILE}")
echo "[$(date -u +%FT%TZ)] Dump completed: ${SIZE_BYTES} bytes"

# ─── Configure MinIO client (idempotent) ─────────────────────────────────────
SCHEME="http"
if [ "${MINIO_USE_SSL:-false}" = "true" ]; then SCHEME="https"; fi
mc alias set naqla-backup "${SCHEME}://${MINIO_ENDPOINT}:${MINIO_PORT}" \
  "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null

# Ensure bucket exists (no-op if already there)
mc mb --ignore-existing "naqla-backup/${MINIO_BUCKET}" > /dev/null

# ─── Upload ──────────────────────────────────────────────────────────────────
DEST="naqla-backup/${MINIO_BUCKET}/backups/${BACKUP_NAME}"
echo "[$(date -u +%FT%TZ)] Uploading to ${DEST}..."
mc cp "${TMPFILE}" "${DEST}"
echo "[$(date -u +%FT%TZ)] Upload successful"

# ─── Retention: delete backups older than RETENTION_DAYS days ────────────────
echo "[$(date -u +%FT%TZ)] Pruning backups older than ${RETENTION_DAYS} days..."
mc rm --recursive --force --older-than "${RETENTION_DAYS}d" \
  "naqla-backup/${MINIO_BUCKET}/backups/" 2>/dev/null || true

echo "[$(date -u +%FT%TZ)] ✅ Backup complete: ${BACKUP_NAME}"
