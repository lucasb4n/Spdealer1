#!/usr/bin/env bash
set -euo pipefail

CANDIDATE="${1:-/root/nginx.conf.new.20251113011045}"
TS=$(date +%Y%m%d%H%M%S)
LOG="/root/nginx-tune-apply.${TS}.log"

echo "[$(date)] nginx-tune-remote start" > "$LOG"
echo "candidate: $CANDIDATE" >> "$LOG"

if [ ! -f "$CANDIDATE" ]; then
  echo "[$(date)] ERROR: candidate not found: $CANDIDATE" | tee -a "$LOG"
  exit 2
fi

cp -p /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.${TS}
echo "[$(date)] backed up /etc/nginx/nginx.conf -> /etc/nginx/nginx.conf.backup.${TS}" | tee -a "$LOG"

sed -i 's|include[[:space:]]\+mime.types;|include /etc/nginx/mime.types;|' "$CANDIDATE"

perl -ne '
  if (/^\s*(sendfile|tcp_nopush|tcp_nodelay|keepalive_timeout|keepalive_requests|client_body_timeout|client_header_timeout|proxy_read_timeout|proxy_connect_timeout|proxy_send_timeout)\b/) {
    $d = $1;
    next if $seen{$d}++;
  }
  print;
' "$CANDIDATE" > "${CANDIDATE}.dedup.tmp" && mv "${CANDIDATE}.dedup.tmp" "$CANDIDATE"
echo "[$(date)] dedupe done" | tee -a "$LOG"

echo "[$(date)] Testing candidate with prefix /etc/nginx" | tee -a "$LOG"
if nginx -t -c "$CANDIDATE" -p /etc/nginx >> "$LOG" 2>&1; then
  echo "[$(date)] candidate test OK" | tee -a "$LOG"
else
  echo "[$(date)] candidate test FAILED (see $LOG). Candidate preserved at $CANDIDATE" | tee -a "$LOG"
  exit 3
fi

cp -p /etc/nginx/nginx.conf /etc/nginx/nginx.conf.pre-tune.${TS}
cp -p "$CANDIDATE" /etc/nginx/nginx.conf
echo "[$(date)] candidate copied to /etc/nginx/nginx.conf" | tee -a "$LOG"

if nginx -t >> "$LOG" 2>&1; then
  systemctl reload nginx
  echo "[$(date)] nginx reloaded successfully; backup: /etc/nginx/nginx.conf.pre-tune.${TS}" | tee -a "$LOG"
  echo "PROMOTED_OK"
  exit 0
else
  echo "[$(date)] Promotion failed: nginx -t failed after copying. Rolling back." | tee -a "$LOG"
  cp -p /etc/nginx/nginx.conf.pre-tune.${TS} /etc/nginx/nginx.conf
  systemctl reload nginx || true
  echo "[$(date)] Rolled back to /etc/nginx/nginx.conf.pre-tune.${TS}" | tee -a "$LOG"
  exit 4
fi