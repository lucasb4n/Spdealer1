#!/bin/bash
# ==============================================================================
# Script de Deploy Automático para o projeto Boleto (boleto.war)
# Servidor Alvo: 192.168.10.70
# Destino: /usr/local/tomcat10/webapps/boleto.war
# Credenciais: root / k15720
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_IP="192.168.10.70"
SERVER_USER="root"
SERVER_PASS="k15720"
DEST_PATH="/usr/local/tomcat10/webapps"
WAR_NAME="boleto.war"

echo "=================================================="
echo "=== Iniciando Deploy do ${WAR_NAME} ==="
echo "=================================================="

# Configura variáveis de ambiente caso instaladas localmente
if [ -d "$HOME/.local/tools/jdk-17.0.12+7" ]; then
    export JAVA_HOME="$HOME/.local/tools/jdk-17.0.12+7"
fi
if [ -d "$HOME/.local/tools/apache-maven-3.9.9" ]; then
    export PATH="$HOME/.local/tools/apache-maven-3.9.9/bin:$PATH"
fi
if [ -d "$HOME/.local/tools/node-v20.18.0-linux-x64" ]; then
    export PATH="$HOME/.local/tools/node-v20.18.0-linux-x64/bin:$PATH"
fi
export PATH="$JAVA_HOME/bin:$HOME/.local/bin:$PATH"

echo "[1/3] Compilando Frontend (React)..."
if [ -d "$SCRIPT_DIR/frontend" ]; then
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
fi

echo "[2/3] Compilando Backend Java com Maven (gerando ${WAR_NAME})..."
cd "$SCRIPT_DIR"
mvn clean package -DskipTests

WAR_FILE="$SCRIPT_DIR/target/${WAR_NAME}"

if [ ! -f "$WAR_FILE" ]; then
    echo "ERRO: Arquivo $WAR_FILE não encontrado!"
    exit 1
fi

echo "[3/3] Enviando ${WAR_NAME} para ${SERVER_USER}@${SERVER_IP}:${DEST_PATH}..."

if command -v sshpass &> /dev/null; then
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no "$WAR_FILE" "${SERVER_USER}@${SERVER_IP}:${DEST_PATH}/${WAR_NAME}"
else
    python3 -c "
import pexpect, sys
cmd = 'scp -o StrictHostKeyChecking=no \"${WAR_FILE}\" ${SERVER_USER}@${SERVER_IP}:${DEST_PATH}/${WAR_NAME}'
child = pexpect.spawn(cmd, encoding='utf-8', timeout=120)
child.logfile = sys.stdout
idx = child.expect(['[pP]assword:', pexpect.EOF, pexpect.TIMEOUT])
if idx == 0:
    child.sendline('${SERVER_PASS}')
    child.expect(pexpect.EOF)
" 2>/dev/null || scp -o StrictHostKeyChecking=no "$WAR_FILE" "${SERVER_USER}@${SERVER_IP}:${DEST_PATH}/${WAR_NAME}"
fi

echo "=================================================="
echo " OK: Deploy concluído com sucesso em ${SERVER_IP}:${DEST_PATH}/${WAR_NAME}"
echo "=================================================="
