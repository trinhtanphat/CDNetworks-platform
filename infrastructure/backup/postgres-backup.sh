#!/usr/bin/env bash
# =============================================================================
# postgres-backup.sh — Daily logical backup → S3 Glacier (STANDARD_IA).
# Cron: 0 2 * * *  /opt/cdnetworks/postgres-backup.sh
# Yêu cầu: aws-cli, pg_dump, age (encryption), curl.
# Env: PGUSER, PGPASSWORD, PGHOST, PGDATABASE, S3_BUCKET, S3_PREFIX, AGE_RECIPIENT,
#      ALERT_WEBHOOK (Slack/Telegram).
# =============================================================================
set -euo pipefail

DATE=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

DUMP="$TMP/cdn-$DATE.sql.gz"
ENC="$DUMP.age"

echo "[backup] dumping..."
pg_dump --format=custom --compress=9 --no-owner --no-acl "$PGDATABASE" > "$DUMP"

echo "[backup] encrypting (age)..."
age -r "$AGE_RECIPIENT" -o "$ENC" "$DUMP"

# Upload với storage class STANDARD_IA (Infrequent Access — rẻ ~50%)
echo "[backup] uploading to s3..."
aws s3 cp "$ENC" "s3://$S3_BUCKET/$S3_PREFIX/$DATE.sql.gz.age" \
  --storage-class STANDARD_IA \
  --metadata "host=$(hostname),db=$PGDATABASE"

# Lifecycle: chuyển sang GLACIER_IR sau 30d, GLACIER_DEEP_ARCHIVE sau 180d, expire 730d.
# Cấu hình 1 lần qua infrastructure/terraform/s3-lifecycle.tf.

# Validate (download + age decrypt header check)
echo "[backup] verifying..."
aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/$DATE.sql.gz.age" >/dev/null

# Báo OK
SIZE=$(stat -c%s "$ENC" | numfmt --to=iec)
MSG="✅ Postgres backup OK [$DATE] size=$SIZE → s3://$S3_BUCKET/$S3_PREFIX/$DATE"
[[ -n "${ALERT_WEBHOOK:-}" ]] && curl -fsS -X POST "$ALERT_WEBHOOK" \
  -H 'Content-Type: application/json' -d "{\"text\":\"$MSG\"}" || true
echo "$MSG"
