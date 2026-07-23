#!/bin/bash

################################################################################
# SCRIPT DE DIAGNÓSTICO - AMBIENTE DE PRODUÇÃO SPDealer
# Data: 11 NOV 2025
# Status: Validação completa de IPs, versões e serviços
################################################################################

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     DIAGNÓSTICO DE PRODUÇÃO - SPDealer${NC}"
echo -e "${BLUE}     Data: $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# 1. VERIFICAÇÃO DE CONECTIVIDADE - IPs CRÍTICOS
# ============================================================================
echo -e "${YELLOW}[1/9] VERIFICANDO CONECTIVIDADE - IPs CRÍTICOS${NC}"
echo ""

# APP Server (Frontend/Backend)
echo "  → Testando APP Server (192.168.10.70)..."
if ping -c 1 -W 2 192.168.10.70 > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ PASS${NC}: 192.168.10.70 respondendo"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: 192.168.10.70 NÃO respondendo (timeout)"
    ((FAIL++))
fi

# Database Server
echo "  → Testando Database Server (100.126.166.63)..."
if ping -c 1 -W 2 100.126.166.63 > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ PASS${NC}: 100.126.166.63 respondendo"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: 100.126.166.63 NÃO respondendo (timeout)"
    ((FAIL++))
fi

# Edge Server (Nginx/Socket.IO)
echo "  → Testando Edge Server (192.168.10.30)..."
if ping -c 1 -W 2 192.168.10.30 > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ PASS${NC}: 192.168.10.30 respondendo"
    ((PASS++))
else
    echo -e "    ${YELLOW}⚠ WARN${NC}: 192.168.10.30 NÃO respondendo (pode estar offline)"
    ((WARN++))
fi

echo ""

# ============================================================================
# 2. VERIFICAÇÃO DE PORTAS - SERVIÇOS CRÍTICOS
# ============================================================================
echo -e "${YELLOW}[2/9] VERIFICANDO PORTAS - SERVIÇOS CRÍTICOS${NC}"
echo ""

# Frontend Port
echo "  → Testando Frontend (port 3000)..."
if timeout 2 bash -c </dev/null >& /dev/tcp/192.168.10.70/3000; then
    echo -e "    ${GREEN}✓ PASS${NC}: Port 3000 (Frontend React) aberta"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Port 3000 NÃO respondendo"
    ((FAIL++))
fi

# Backend Port
echo "  → Testando Backend (port 8080)..."
if timeout 2 bash -c </dev/null >& /dev/tcp/192.168.10.70/8080; then
    echo -e "    ${GREEN}✓ PASS${NC}: Port 8080 (Spring Boot) aberta"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Port 8080 NÃO respondendo"
    ((FAIL++))
fi

# Database Port
echo "  → Testando Database (port 3306)..."
if timeout 2 bash -c </dev/null >& /dev/tcp/100.126.166.63/3306; then
    echo -e "    ${GREEN}✓ PASS${NC}: Port 3306 (MariaDB) aberta"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Port 3306 NÃO respondendo"
    ((FAIL++))
fi

# Nginx Port
echo "  → Testando Nginx (port 80/443)..."
if timeout 2 bash -c </dev/null >& /dev/tcp/192.168.10.30/80 || timeout 2 bash -c </dev/null >& /dev/tcp/192.168.10.30/443; then
    echo -e "    ${GREEN}✓ PASS${NC}: Port 80 ou 443 (Nginx) aberta"
    ((PASS++))
else
    echo -e "    ${YELLOW}⚠ WARN${NC}: Nginx ports não respondendo (servidor pode estar offline)"
    ((WARN++))
fi

echo ""

# ============================================================================
# 3. VERIFICAÇÃO DE VERSÕES - JAVA
# ============================================================================
echo -e "${YELLOW}[3/9] VERIFICANDO VERSÕES - JAVA${NC}"
echo ""

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | grep -i version | head -n1)
    echo -e "    ${GREEN}✓ PASS${NC}: Java instalado"
    echo "      Versão: $JAVA_VERSION"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Java NÃO encontrado"
    ((FAIL++))
fi

echo ""

# ============================================================================
# 4. VERIFICAÇÃO DE VERSÕES - NODE.JS / npm
# ============================================================================
echo -e "${YELLOW}[4/9] VERIFICANDO VERSÕES - NODE.js${NC}"
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "    ${GREEN}✓ PASS${NC}: Node.js instalado"
    echo "      Node: $NODE_VERSION"
    echo "      npm: $NPM_VERSION"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Node.js NÃO encontrado"
    ((FAIL++))
fi

echo ""

# ============================================================================
# 5. VERIFICAÇÃO DE VERSÕES - MAVEN
# ============================================================================
echo -e "${YELLOW}[5/9] VERIFICANDO VERSÕES - MAVEN${NC}"
echo ""

if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn --version | head -n1)
    echo -e "    ${GREEN}✓ PASS${NC}: Maven instalado"
    echo "      Versão: $MVN_VERSION"
    ((PASS++))
else
    echo -e "    ${YELLOW}⚠ WARN${NC}: Maven NÃO encontrado (pode estar ausente em servidor)"
    ((WARN++))
fi

echo ""

# ============================================================================
# 6. VERIFICAÇÃO DE VERSÕES - MYSQL CLIENT
# ============================================================================
echo -e "${YELLOW}[6/9] VERIFICANDO VERSÕES - MYSQL CLIENT${NC}"
echo ""

if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo -e "    ${GREEN}✓ PASS${NC}: MySQL client instalado"
    echo "      Versão: $MYSQL_VERSION"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: MySQL client NÃO encontrado"
    ((FAIL++))
fi

echo ""

# ============================================================================
# 7. VERIFICAÇÃO DE CONECTIVIDADE - BANCO DE DADOS
# ============================================================================
echo -e "${YELLOW}[7/9] VERIFICANDO CONECTIVIDADE - BANCO DE DADOS${NC}"
echo ""

if command -v mysql &> /dev/null; then
    echo "  → Testando conexão com MariaDB (100.126.166.63)..."
    if mysql -h 100.126.166.63 -u root -pk15720 -e "SELECT 1;" > /dev/null 2>&1; then
        echo -e "    ${GREEN}✓ PASS${NC}: Conexão com banco de dados OK"
        
        # Obter versão do MariaDB
        DB_VERSION=$(mysql -h 100.126.166.63 -u root -pk15720 -e "SELECT VERSION();" 2>/dev/null | tail -n1)
        echo "      MariaDB Version: $DB_VERSION"
        
        # Contar tabelas no banco
        TABLE_COUNT=$(mysql -h 100.126.166.63 -u root -pk15720 erp -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='erp';" 2>/dev/null | tail -n1)
        echo "      Tables in 'erp': $TABLE_COUNT"
        
        ((PASS++))
    else
        echo -e "    ${RED}✗ FAIL${NC}: Conexão com banco de dados FALHOU"
        echo "      Verificar: IP, porta, credenciais"
        ((FAIL++))
    fi
else
    echo -e "    ${YELLOW}⚠ WARN${NC}: MySQL client não disponível para teste"
    ((WARN++))
fi

echo ""

# ============================================================================
# 8. VERIFICAÇÃO DE CONECTIVIDADE - SERVIÇOS HTTP
# ============================================================================
echo -e "${YELLOW}[8/9] VERIFICANDO CONECTIVIDADE - SERVIÇOS HTTP${NC}"
echo ""

echo "  → Testando Frontend (http://192.168.10.70:3000)..."
if curl -s -m 5 http://192.168.10.70:3000 > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ PASS${NC}: Frontend HTTP respondendo"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Frontend HTTP não respondendo"
    ((FAIL++))
fi

echo "  → Testando Backend (http://192.168.10.70:8080/api/filiais)..."
if curl -s -m 5 http://192.168.10.70:8080/api/filiais > /dev/null 2>&1; then
    echo -e "    ${GREEN}✓ PASS${NC}: Backend API respondendo"
    ((PASS++))
else
    echo -e "    ${RED}✗ FAIL${NC}: Backend API não respondendo"
    ((FAIL++))
fi

echo ""

# ============================================================================
# 9. VERIFICAÇÃO DE DISK/MEMORY - SERVIDOR APP
# ============================================================================
echo -e "${YELLOW}[9/9] VERIFICANDO RECURSOS - SERVIDOR APP${NC}"
echo ""

echo "  → Espaço em disco:"
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | tail -n1 | awk '{print $5}')
    DISK_AVAILABLE=$(df -h / | tail -n1 | awk '{print $4}')
    echo "      Uso: $DISK_USAGE | Disponível: $DISK_AVAILABLE"
    ((PASS++))
else
    echo "      Não disponível"
fi

echo "  → Memória disponível:"
if command -v free &> /dev/null; then
    MEM_AVAILABLE=$(free -h | grep Mem | awk '{print $7}')
    echo "      Disponível: $MEM_AVAILABLE"
    ((PASS++))
else
    echo "      Não disponível"
fi

echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}RESUMO FINAL${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✓ PASS: $PASS${NC}"
echo -e "  ${RED}✗ FAIL: $FAIL${NC}"
echo -e "  ${YELLOW}⚠ WARN: $WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ SISTEMA PRONTO PARA PRODUÇÃO${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Revisar warnings acima"
    echo "  2. Implementar Cloudflare + Nginx no servidor 192.168.10.30"
    echo "  3. Executar migration das tabelas (notifications, etc)"
    echo "  4. Deploy do JAR em produção"
    echo "  5. Testes end-to-end com sistema completo"
else
    echo -e "${RED}✗ PROBLEMAS IDENTIFICADOS - REVISAR ACIMA${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
