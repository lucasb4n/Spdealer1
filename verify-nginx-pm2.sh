#!/bin/bash
# ============================================================================
# VERIFICAR STATUS NGINX + PM2
# Servidor: 192.168.10.30
# ============================================================================

echo "=========================================================================="
echo "  VERIFICAÇÃO COMPLETA - NGINX + PM2"
echo "=========================================================================="
echo ""

# ============================================================================
# 1. Verificar Nginx
# ============================================================================

echo "🔍 VERIFICAÇÃO NGINX"
echo "------------------------------------------------------------------------"

# Teste de sintaxe
echo ""
echo "Testando sintaxe do nginx..."
if nginx -t 2>&1; then
    echo "✅ Sintaxe do nginx OK"
else
    echo "❌ Erro na sintaxe do nginx!"
    nginx -t
    exit 1
fi

# Status do serviço
echo ""
echo "Status do serviço nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx rodando"
else
    echo "❌ Nginx não está rodando"
    echo "   Iniciando nginx..."
    systemctl start nginx
    sleep 2
fi

# Informações do processo
echo ""
echo "Processos nginx:"
ps aux | grep -E "nginx: master|nginx: worker" | grep -v grep || echo "Nenhum processo encontrado"

# Verificar portas
echo ""
echo "Portas nginx ativas:"
ss -tlnp | grep -E ":(80|443)" || echo "Nenhuma porta ativa"

# Testar conectividade
echo ""
echo "Testando conectividade HTTP/HTTPS:"
echo "  HTTP (80)..."
curl -I http://localhost/ 2>/dev/null | head -1 || echo "❌ Timeout ou erro"
echo "  HTTPS (443)..."
curl -I https://localhost/ -k 2>/dev/null | head -1 || echo "❌ Timeout ou erro"

# ============================================================================
# 2. Verificar PM2
# ============================================================================

echo ""
echo ""
echo "🔍 VERIFICAÇÃO PM2"
echo "------------------------------------------------------------------------"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado!"
    exit 1
fi

echo "✅ PM2 encontrado"

# Lista de processos
echo ""
echo "Processos PM2:"
pm2 ls

# Status detalhado
echo ""
echo "Status detalhado:"
pm2 describe socket 2>/dev/null || echo "Processo 'socket' não encontrado"

# Verificar porta 5000
echo ""
echo "Porta 5000 (Socket):"
ss -tlnp | grep 5000 || echo "Porta 5000 não está em escuta"

# ============================================================================
# 3. Verificar certificados SSL
# ============================================================================

echo ""
echo ""
echo "🔍 VERIFICAÇÃO CERTIFICADOS SSL"
echo "------------------------------------------------------------------------"

if [ -f "/root/Servidor/certificado/spdealer.crt" ]; then
    echo "✅ Certificado encontrado: /root/Servidor/certificado/spdealer.crt"
    openssl x509 -in /root/Servidor/certificado/spdealer.crt -noout -dates 2>/dev/null || echo "⚠️  Não foi possível ler datas do certificado"
else
    echo "❌ Certificado não encontrado: /root/Servidor/certificado/spdealer.crt"
fi

if [ -f "/root/Servidor/certificado/spdealer.key" ]; then
    echo "✅ Chave privada encontrada"
else
    echo "❌ Chave privada não encontrada: /root/Servidor/certificado/spdealer.key"
fi

# ============================================================================
# 4. Verificar conectividade com backends
# ============================================================================

echo ""
echo ""
echo "🔍 VERIFICAÇÃO CONECTIVIDADE BACKENDS"
echo "------------------------------------------------------------------------"

echo ""
echo "Backend Spring Boot (192.168.10.70:8080):"
if nc -z -w 3 192.168.10.70 8080 2>/dev/null; then
    echo "✅ Backend acessível"
    curl -s -m 3 http://192.168.10.70:8080/health | head -c 50 && echo "..." || echo "⚠️  Sem resposta do health check"
else
    echo "❌ Backend não acessível (verificar conectividade)"
fi

echo ""
echo "Frontend React (192.168.10.70:3000):"
if nc -z -w 3 192.168.10.70 3000 2>/dev/null; then
    echo "✅ Frontend acessível"
else
    echo "❌ Frontend não acessível (verificar conectividade)"
fi

echo ""
echo "Socket Node.js (localhost:5000):"
if nc -z -w 3 localhost 5000 2>/dev/null; then
    echo "✅ Socket acessível"
else
    echo "❌ Socket não acessível"
fi

# ============================================================================
# 5. Verificar logs
# ============================================================================

echo ""
echo ""
echo "🔍 VERIFICAÇÃO LOGS"
echo "------------------------------------------------------------------------"

echo ""
echo "Logs Nginx (últimas 5 linhas):"
tail -5 /var/log/nginx/spdealer_error.log 2>/dev/null || echo "Nenhum log encontrado"

echo ""
echo "Logs PM2 (últimas 5 linhas):"
pm2 logs socket --lines 5 --nostream 2>/dev/null || echo "Nenhum log disponível"

# ============================================================================
# 6. Verificar estrutura de diretórios
# ============================================================================

echo ""
echo ""
echo "🔍 VERIFICAÇÃO ESTRUTURA DIRETÓRIOS"
echo "------------------------------------------------------------------------"

echo ""
echo "/root/Servidor:"
if [ -d "/root/Servidor" ]; then
    ls -lah /root/Servidor/ | tail -10
    echo "✅ Diretório existe"
else
    echo "❌ Diretório não existe"
fi

echo ""
echo "Certificados:"
ls -lah /root/Servidor/certificado/ 2>/dev/null || echo "Diretório não existe"

echo ""
echo "Config:"
ls -lah /root/Servidor/config/ 2>/dev/null || echo "Diretório não existe"

echo ""
echo "Logs:"
ls -lah /root/Servidor/logs/ 2>/dev/null || echo "Diretório não existe"

# ============================================================================
# 7. Resumo Final
# ============================================================================

echo ""
echo ""
echo "=========================================================================="
echo "  RESUMO DA VERIFICAÇÃO"
echo "=========================================================================="

NGINX_OK=0
PM2_OK=0
BACKEND_OK=0
SOCKET_OK=0

# Verificações
nginx -t &>/dev/null && NGINX_OK=1
pm2 ls &>/dev/null && PM2_OK=1
nc -z -w 2 192.168.10.70 8080 2>/dev/null && BACKEND_OK=1
nc -z -w 2 localhost 5000 2>/dev/null && SOCKET_OK=1

echo ""
[ $NGINX_OK -eq 1 ] && echo "✅ Nginx: OK" || echo "❌ Nginx: PROBLEMA"
[ $PM2_OK -eq 1 ] && echo "✅ PM2: OK" || echo "❌ PM2: PROBLEMA"
[ $BACKEND_OK -eq 1 ] && echo "✅ Backend: OK" || echo "❌ Backend: PROBLEMA"
[ $SOCKET_OK -eq 1 ] && echo "✅ Socket: OK" || echo "❌ Socket: PROBLEMA"

echo ""
echo "=========================================================================="

# Retornar status
if [ $NGINX_OK -eq 1 ] && [ $PM2_OK -eq 1 ] && [ $BACKEND_OK -eq 1 ] && [ $SOCKET_OK -eq 1 ]; then
    echo "✅ TODOS OS SERVIÇOS OPERACIONAIS"
    exit 0
else
    echo "⚠️  ALGUNS SERVIÇOS REQUEREM ATENÇÃO"
    exit 1
fi
