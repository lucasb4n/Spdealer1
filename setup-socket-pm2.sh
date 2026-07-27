#!/bin/bash
# ============================================================================
# CONFIGURAR E INICIAR SERVIÇO SOCKET COM PM2
# Servidor: 192.168.10.30 (root)
# ============================================================================

set -e

echo "=========================================================================="
echo "  CONFIGURAR E INICIAR SERVIÇO SOCKET COM PM2"
echo "=========================================================================="

# ============================================================================
# 1. Verificar se PM2 está instalado
# ============================================================================

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado!"
    echo "   Execute primeiro: npm install -g pm2"
    exit 1
fi

echo "✅ PM2 encontrado: $(pm2 -v)"

# ============================================================================
# 2. Verificar estrutura de diretórios
# ============================================================================

echo ""
echo "📁 Verificando estrutura de diretórios..."

if [ ! -d "/root/Servidor" ]; then
    echo "❌ Diretório /root/Servidor não existe!"
    exit 1
fi

if [ ! -d "/root/Servidor/src" ]; then
    echo "❌ Diretório /root/Servidor/src não existe!"
    echo "   Clone o repositório primeiro:"
    echo "   cd /root/Servidor && git clone <repo-url> src"
    exit 1
fi

echo "✅ Estrutura de diretórios OK"
ls -la /root/Servidor/

# ============================================================================
# 3. Verificar arquivo index.js
# ============================================================================

echo ""
echo "📝 Verificando arquivo principal..."

if [ ! -f "/root/Servidor/src/index.js" ]; then
    echo "❌ Arquivo /root/Servidor/src/index.js não encontrado!"
    echo "   Verifique o repositório clonado"
    exit 1
fi

echo "✅ Arquivo index.js encontrado"
head -10 /root/Servidor/src/index.js

# ============================================================================
# 4. Instalar dependências npm
# ============================================================================

echo ""
echo "📦 Instalando dependências do projeto..."

cd /root/Servidor/src

if [ -f "package.json" ]; then
    npm install
    echo "✅ Dependências instaladas"
else
    echo "⚠️  Arquivo package.json não encontrado, pulando instalação de dependências"
fi

# ============================================================================
# 5. Parar instância anterior (se existir)
# ============================================================================

echo ""
echo "🛑 Parando instância anterior (se existir)..."

pm2 stop socket || true
pm2 delete socket || true

echo "✅ Instância anterior parada"

# ============================================================================
# 6. Iniciar serviço com PM2
# ============================================================================

echo ""
echo "🚀 Iniciando serviço Socket com PM2..."

pm2 start /root/Servidor/src/index.js \
  --name "socket" \
  --instances 1 \
  --exec-mode "cluster" \
  --env "NODE_ENV=production" \
  --env "PORT=5000" \
  --env "HOST=0.0.0.0" \
  --output "/root/Servidor/logs/pm2-out.log" \
  --error "/root/Servidor/logs/pm2-err.log" \
  --log-date-format "YYYY-MM-DD HH:mm:ss Z"

echo "✅ Serviço iniciado"

# ============================================================================
# 7. Salvar configuração PM2
# ============================================================================

echo ""
echo "💾 Salvando configuração PM2..."

pm2 save

echo "✅ Configuração salva"

# ============================================================================
# 8. Listar processos PM2
# ============================================================================

echo ""
echo "=========================================================================="
echo "  STATUS DOS PROCESSOS PM2"
echo "=========================================================================="
pm2 ls

# ============================================================================
# 9. Mostrar logs
# ============================================================================

echo ""
echo "=========================================================================="
echo "  LOGS DO SERVIÇO (Últimas 20 linhas)"
echo "=========================================================================="

pm2 logs socket --lines 20 --nostream || echo "Sem logs ainda"

# ============================================================================
# 10. Informações de restart automático
# ============================================================================

echo ""
echo "=========================================================================="
echo "  ✅ SERVIÇO CONFIGURADO!"
echo "=========================================================================="
echo ""
echo "📌 INFORMAÇÕES IMPORTANTES:"
echo ""
echo "Serviço: socket (Node.js)"
echo "Porta: 5000"
echo "Diretório: /root/Servidor/src"
echo "Arquivo Principal: index.js"
echo "Status: $(pm2 describe socket 2>/dev/null | grep 'status' || echo 'online')"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo ""
echo "  Verificar status:"
echo "    pm2 ls"
echo ""
echo "  Ver logs em tempo real:"
echo "    pm2 logs socket"
echo ""
echo "  Parar serviço:"
echo "    pm2 stop socket"
echo ""
echo "  Reiniciar serviço:"
echo "    pm2 restart socket"
echo ""
echo "  Deletar serviço:"
echo "    pm2 delete socket"
echo ""
echo "  Reload (sem downtime):"
echo "    pm2 reload socket"
echo ""
echo "  Monitorar em tempo real:"
echo "    pm2 monit"
echo ""
echo "=========================================================================="
