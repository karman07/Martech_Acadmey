#!/usr/bin/env bash
# Runs on the server (see martech-domain-certs.timer/.service) every few minutes.
# Asks the backend which teacher custom domains are DNS-verified but don't have a
# TLS cert yet, gives each one an nginx server block if it doesn't have one, runs
# certbot against it, and reports success back so the backend stops listing it as
# pending. Idempotent — safe to run repeatedly; already-certified domains are never
# returned by /internal/domains/pending-certs.
set -euo pipefail

API_BASE="${MARTECH_API_BASE:-https://martech-backend.karmansingharora.com}"
INTERNAL_SECRET="${MARTECH_INTERNAL_SECRET:?MARTECH_INTERNAL_SECRET env var is required}"
FRONTEND_PORT="${MARTECH_FRONTEND_PORT:-4021}"
CERTBOT_EMAIL="${MARTECH_CERTBOT_EMAIL:-karmansingharora01@gmail.com}"
NGINX_SITE_DIR=/etc/nginx/sites-available
NGINX_ENABLED_DIR=/etc/nginx/sites-enabled

log() { echo "[$(date -u +%FT%TZ)] $*"; }

pending=$(curl -sf -H "X-Internal-Secret: $INTERNAL_SECRET" "$API_BASE/internal/domains/pending-certs" \
  | node -e 'process.stdin.on("data",d=>process.stdout.write(JSON.parse(d).domains.join("\n")))')

if [ -z "$pending" ]; then
  log "no domains pending a certificate"
  exit 0
fi

reloaded=0
while IFS= read -r domain; do
  [ -z "$domain" ] && continue
  log "processing $domain"

  conf="$NGINX_SITE_DIR/teacher-domain-$domain.conf"
  if [ ! -f "$conf" ]; then
    log "  writing nginx server block"
    cat > "$conf" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $domain;

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    ln -sf "$conf" "$NGINX_ENABLED_DIR/teacher-domain-$domain.conf"
    reloaded=1
  fi

  if [ "$reloaded" = "1" ]; then
    nginx -t && systemctl reload nginx
    reloaded=0
  fi

  if certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect -d "$domain"; then
    log "  cert issued, notifying backend"
    curl -sf -X POST -H "X-Internal-Secret: $INTERNAL_SECRET" -H "Content-Type: application/json" \
      -d "{\"domain\":\"$domain\"}" "$API_BASE/internal/domains/mark-certified" > /dev/null
  else
    log "  certbot failed for $domain — will retry next run (DNS may not have propagated yet)"
  fi
done <<< "$pending"
