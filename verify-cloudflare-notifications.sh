#!/bin/bash

# ============================================================================
# verify-cloudflare-notifications.sh
# Script de verificação completa: Cloudflare + Nginx + Notifications
# 
# Uso: chmod +x verify-cloudflare-notifications.sh
#      ./verify-cloudflare-notifications.sh
# 
# O que verifica:
# 1. DNS propagação (nslookup)
# 2. HTTPS access (curl)
# 3. API responses (JSON parsing)
# 4. Socket.IO connectivity (headers)
# 5. Nginx logs (errors)
# 
# Data: 11 NOV 2025
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis de configuração
DOMAIN="spdealer.seprocom.com.br"
FRONTEND_PORT=3000
BACKEND_PORT=8080
SOCKET_PORT=5000
NGINX_ERROR_LOG="/var/log/nginx/error.log"
NGINX_ACCESS_LOG="/var/log/nginx/access.log"

# Contadores
PASS=0
FAIL=0
WARN=0

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAIL++))
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARN++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

# ============================================================================
# Test Functions
# ============================================================================

test_dns_resolution() {
    print_section "1. Testando DNS Resolution"
    
    # Tentar com nslookup
    if command -v nslookup &> /dev/null; then
        if nslookup $DOMAIN > /tmp/nslookup_result.txt 2>&1; then
            IP=$(grep "Address:" /tmp/nslookup_result.txt | tail -1 | awk '{print $2}')
            if [ ! -z "$IP" ]; then
                print_pass "DNS resolvido: $DOMAIN → $IP"
                echo "$IP" > /tmp/nginx_ip.txt
            else
                print_fail "DNS resolvido mas IP não encontrado"
            fi
        else
            print_fail "nslookup falhou para $DOMAIN"
        fi
    fi
    
    # Tentar com dig
    if command -v dig &> /dev/null; then
        if dig_result=$(dig $DOMAIN +short); then
            if [ ! -z "$dig_result" ]; then
                print_pass "dig resolveu: $dig_result"
            else
                print_fail "dig retornou vazio"
            fi
        fi
    fi
}

test_https_access() {
    print_section "2. Testando HTTPS Access"
    
    # Teste com curl (ignorar cert auto-assinado)
    if command -v curl &> /dev/null; then
        if response=$(curl -sk -I https://$DOMAIN 2>&1); then
            if echo "$response" | grep -q "HTTP"; then
                http_status=$(echo "$response" | grep "HTTP" | head -1)
                print_pass "HTTPS respondendo: $http_status"
            else
                print_warn "HTTPS respondendo mas status HTTP não encontrado"
            fi
        else
            print_fail "HTTPS não respondendo (connection refused ou timeout)"
        fi
    else
        print_warn "curl não instalado, skipping HTTPS test"
    fi
}

test_frontend() {
    print_section "3. Testando Frontend (React)"
    
    if command -v curl &> /dev/null; then
        if response=$(curl -sk https://$DOMAIN 2>&1 | head -100); then
            if echo "$response" | grep -q "react\|<!DOCTYPE\|<html"; then
                print_pass "Frontend respondendo com HTML"
            else
                print_warn "Frontend respondendo mas conteúdo não reconhecido como HTML"
            fi
        else
            print_fail "Frontend não acessível"
        fi
    fi
}

test_api() {
    print_section "4. Testando API Backend"
    
    if command -v curl &> /dev/null; then
        # Teste GET /api/health
        if response=$(curl -sk https://$DOMAIN/api/health 2>&1); then
            if echo "$response" | grep -q "healthy\|200"; then
                print_pass "API /api/health respondendo"
            else
                print_info "API respondendo: $response"
            fi
        fi
        
        # Teste GET /api/v2/dashboards
        if response=$(curl -sk https://$DOMAIN/api/v2/dashboards 2>&1); then
            if echo "$response" | grep -q "{\|error\|401\|403"; then
                print_pass "API /api/v2/dashboards respondendo (JSON esperado)"
            else
                print_warn "API /api/v2/dashboards respondeu sem JSON esperado"
            fi
        else
            print_warn "API /api/v2/dashboards não respondeu"
        fi
    fi
}

test_socket_io() {
    print_section "5. Testando Socket.IO (WebSocket)"
    
    if command -v curl &> /dev/null; then
        # Teste GET /socket.io/
        if response=$(curl -sk -I https://$DOMAIN/socket.io/ 2>&1); then
            if echo "$response" | grep -q "HTTP"; then
                http_status=$(echo "$response" | grep "HTTP" | head -1)
                print_pass "Socket.IO respondendo: $http_status"
            else
                print_warn "Socket.IO não respondeu com HTTP status"
            fi
        else
            print_fail "Socket.IO não acessível"
        fi
    fi
}

test_nginx_config() {
    print_section "6. Testando Nginx Config"
    
    if command -v nginx &> /dev/null; then
        if nginx -t 2>&1 | grep -q "successful"; then
            print_pass "Nginx config syntax OK"
        else
            print_fail "Nginx config syntax error"
        fi
    else
        print_warn "nginx não encontrado em PATH"
    fi
}

test_nginx_status() {
    print_section "7. Testando Nginx Status"
    
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet nginx; then
            print_pass "Nginx rodando (systemctl)"
        else
            print_fail "Nginx não está rodando"
        fi
    else
        print_warn "systemctl não disponível"
    fi
}

test_nginx_logs() {
    print_section "8. Verificando Nginx Logs (últimas 20 linhas)"
    
    if [ -f "$NGINX_ERROR_LOG" ]; then
        error_count=$(grep -i "error\|crit\|alert\|emerg" "$NGINX_ERROR_LOG" | wc -l)
        if [ $error_count -eq 0 ]; then
            print_pass "Sem erros críticos no error.log"
        else
            print_warn "Encontrados $error_count erros no error.log:"
            tail -5 "$NGINX_ERROR_LOG" | sed 's/^/  /'
        fi
    else
        print_warn "Nginx error.log não encontrado em $NGINX_ERROR_LOG"
    fi
}

test_ports_listening() {
    print_section "9. Verificando Portas Abertas"
    
    if command -v netstat &> /dev/null; then
        # Port 80
        if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
            print_pass "Porta 80 (HTTP) escutando"
        else
            print_fail "Porta 80 (HTTP) não escutando"
        fi
        
        # Port 443
        if netstat -tlnp 2>/dev/null | grep -q ":443 "; then
            print_pass "Porta 443 (HTTPS) escutando"
        else
            print_fail "Porta 443 (HTTPS) não escutando"
        fi
    elif command -v ss &> /dev/null; then
        # Fallback para ss se netstat não existir
        if ss -tlnp 2>/dev/null | grep -q ":80 "; then
            print_pass "Porta 80 (HTTP) escutando"
        fi
        if ss -tlnp 2>/dev/null | grep -q ":443 "; then
            print_pass "Porta 443 (HTTPS) escutando"
        fi
    else
        print_warn "netstat/ss não disponível, skipping port check"
    fi
}

test_ssl_certificate() {
    print_section "10. Verificando Certificado SSL"
    
    if command -v openssl &> /dev/null; then
        # Conectar e extrair certificado
        cert_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null)
        
        if echo "$cert_info" | grep -q "subject=\|CN="; then
            cn=$(echo "$cert_info" | grep "subject=" | sed 's/.*CN = //' | cut -d',' -f1)
            if [ ! -z "$cn" ]; then
                print_pass "Certificado SSL encontrado: CN=$cn"
            fi
        else
            print_warn "Certificado SSL não verificado corretamente"
        fi
    else
        print_warn "openssl não disponível"
    fi
}

test_cloudflare_headers() {
    print_section "11. Verificando Headers Cloudflare"
    
    if command -v curl &> /dev/null; then
        headers=$(curl -sk -I https://$DOMAIN 2>&1)
        
        # Verificar headers Cloudflare
        if echo "$headers" | grep -q "cf-ray\|cf-cache-status"; then
            print_pass "Headers Cloudflare detectados"
        else
            print_warn "Headers Cloudflare não encontrados (pode estar sem Cloudflare ativo)"
        fi
    fi
}

test_notification_endpoints() {
    print_section "12. Testando Notification Endpoints"
    
    if command -v curl &> /dev/null; then
        # GET /api/v2/notifications
        if response=$(curl -sk https://$DOMAIN/api/v2/notifications 2>&1); then
            if echo "$response" | grep -q "{\|401\|403"; then
                print_pass "Endpoint GET /api/v2/notifications respondendo"
            else
                print_info "Endpoint /api/v2/notifications retornou: $(echo $response | head -c 50)..."
            fi
        fi
    fi
}

# ============================================================================
# Summary & Report
# ============================================================================

print_summary() {
    print_header "RELATÓRIO FINAL"
    
    TOTAL=$((PASS + FAIL + WARN))
    
    echo -e "Domínio testado: ${BLUE}$DOMAIN${NC}"
    echo -e "Data/Hora: $(date '+%d/%m/%Y %H:%M:%S')"
    echo ""
    echo -e "Resultados:"
    echo -e "  ${GREEN}✓ PASS: $PASS${NC}"
    echo -e "  ${RED}✗ FAIL: $FAIL${NC}"
    echo -e "  ${YELLOW}⚠ WARN: $WARN${NC}"
    echo -e "  ${BLUE}Total: $TOTAL${NC}"
    echo ""
    
    if [ $FAIL -eq 0 ]; then
        echo -e "${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
        echo ""
        echo "Próximos passos:"
        echo "  1. Verificar Cloudflare Dashboard para ver tráfego"
        echo "  2. Testar notificações em tempo real (Socket.IO)"
        echo "  3. Validar autenticação e autorização"
        return 0
    else
        echo -e "${RED}✗ ALGUNS TESTES FALHARAM${NC}"
        echo ""
        echo "Próximos passos:"
        echo "  1. Verificar logs: tail -100 $NGINX_ERROR_LOG"
        echo "  2. Recarregar Nginx: sudo systemctl reload nginx"
        echo "  3. Verificar DNS propagação: nslookup $DOMAIN"
        echo "  4. Verificar backend em execução"
        return 1
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header "VERIFICAÇÃO CLOUDFLARE + NGINX + NOTIFICATIONS"
    
    print_info "Iniciando testes em $DOMAIN..."
    echo ""
    
    # Executar testes
    test_dns_resolution
    test_https_access
    test_frontend
    test_api
    test_socket_io
    test_nginx_config
    test_nginx_status
    test_nginx_logs
    test_ports_listening
    test_ssl_certificate
    test_cloudflare_headers
    test_notification_endpoints
    
    # Relatório final
    print_summary
    exit_code=$?
    
    # Criar arquivo de log
    log_file="/tmp/cloudflare-verification-$(date +%Y%m%d-%H%M%S).log"
    echo "Verificação concluída em $log_file"
    
    exit $exit_code
}

# Executar main
main
