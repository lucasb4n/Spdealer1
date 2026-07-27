#!/usr/bin/env bash
# Script para criar/atualizar snippet 'spdealer_upstream_map' e recarregar nginx
# Uso: editar as variaveis abaixo e executar no host Nginx (Linux)

set -euo pipefail

NGINX_SNIPPET_PATH="/etc/nginx/conf.d/spdealer_upstream_map.conf"
BACKUP_DIR="/var/backups/nginx_spdealer"
UPSTREAM_NAME="spdealer_backend"
BACKEND_HOSTS=("192.168.10.70:8080")

mkdir -p "$BACKUP_DIR"

echo "Fazendo backup de snippet anterior (se existir)" 
if [ -f "$NGINX_SNIPPET_PATH" ]; then
  cp "$NGINX_SNIPPET_PATH" "$BACKUP_DIR/spdealer_upstream_map.conf.$(date +%Y%m%d%H%M%S)"
fi

echo "Escrevendo novo snippet em $NGINX_SNIPPET_PATH"
sudo tee "$NGINX_SNIPPET_PATH" > /dev/null <<'EOF'
# spdealer upstream + map para websocket upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream spdealer_backend {
    # lista de backends (adicione mais linhas se precisar de load-balancing)
    server 192.168.10.70:8080 max_fails=3 fail_timeout=5s;
}

EOF

echo "Testando configuração do nginx"
sudo nginx -t
echo "Recarregando nginx"
sudo systemctl reload nginx
echo "OK - nginx recarregado. Verifique logs se houver erro." 
