#!/bin/bash
#
# Script de Verificação Pré-Deployment SPDealer
# Ambiente: OpenSUSE 15.X + MariaDB 10.8 + Tomcat 9
# Data: 11 NOV 2025
#

set -e

VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
NORMAL='\033[0m'

echo -e "\n${AMARELO}╔════════════════════════════════════════════════════════════════╗${NORMAL}"
echo -e "${AMARELO}║   VERIFICAÇÃO PRÉ-DEPLOYMENT SPDEALER                         ║${NORMAL}"
echo -e "${AMARELO}║   OpenSUSE 15.X + MariaDB 10.8 + Tomcat 9                     ║${NORMAL}"
echo -e "${AMARELO}╚════════════════════════════════════════════════════════════════╝${NORMAL}\n"

# Contador de erros
ERROS=0
AVISOS=0

# ===== FUNÇÃO AUXILIAR =====
check_command() {
    local cmd=$1
    local desc=$2
    
    if command -v $cmd &> /dev/null; then
        echo -e "${VERDE}✓${NORMAL} $desc"
        return 0
    else
        echo -e "${VERMELHO}✗${NORMAL} $desc - NÃO INSTALADO"
        ((ERROS++))
        return 1
    fi
}

check_file() {
    local file=$1
    local desc=$2
    
    if [ -f "$file" ]; then
        echo -e "${VERDE}✓${NORMAL} $desc"
        return 0
    else
        echo -e "${VERMELHO}✗${NORMAL} $desc - ARQUIVO NÃO ENCONTRADO: $file"
        ((ERROS++))
        return 1
    fi
}

check_dir() {
    local dir=$1
    local desc=$2
    
    if [ -d "$dir" ]; then
        echo -e "${VERDE}✓${NORMAL} $desc"
        return 0
    else
        echo -e "${VERMELHO}✗${NORMAL} $desc - DIRETÓRIO NÃO ENCONTRADO: $dir"
        ((ERROS++))
        return 1
    fi
}

check_service() {
    local service=$1
    local desc=$2
    
    if systemctl is-active --quiet $service; then
        echo -e "${VERDE}✓${NORMAL} $desc (rodando)"
        return 0
    else
        echo -e "${AMARELO}⚠${NORMAL} $desc (parado)"
        ((AVISOS++))
        return 1
    fi
}

# ===== 1. VERIFICAR JAVA =====
echo -e "${AMARELO}[1] JAVA E JDK${NORMAL}"
if check_command "java" "Java instalado"; then
    JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[^"]+' | head -1)
    JAVA_MAJOR=$(echo $JAVA_VERSION | cut -d. -f1)
    
    echo "    Versão: $JAVA_VERSION"
    
    if [ "$JAVA_MAJOR" -ge 17 ]; then
        echo -e "${VERDE}✓${NORMAL}    Versão compatível (17+) com Spring Boot 3.1.4"
    else
        echo -e "${VERMELHO}✗${NORMAL}    Versão INCOMPATÍVEL! Requer Java 17+, tem: $JAVA_MAJOR"
        ((ERROS++))
    fi
fi

check_command "javac" "Javac (compilador)"

# JAVA_HOME
if [ -n "$JAVA_HOME" ]; then
    echo -e "${VERDE}✓${NORMAL} JAVA_HOME definido: $JAVA_HOME"
else
    echo -e "${AMARELO}⚠${NORMAL} JAVA_HOME não definido - será usado default"
    ((AVISOS++))
fi

echo ""

# ===== 2. VERIFICAR MARIADB =====
echo -e "${AMARELO}[2] MARIADB E BANCO DE DADOS${NORMAL}"
check_command "mysql" "MySQL client instalado"

# Testar conexão
if mysql -h localhost -u root -e "SELECT 1;" &> /dev/null; then
    echo -e "${VERDE}✓${NORMAL} Conexão MySQL (root) OK"
    MYSQL_VERSION=$(mysql -h localhost -u root -e "SELECT VERSION();" 2>/dev/null | tail -1)
    echo "    Versão: $MYSQL_VERSION"
else
    echo -e "${VERMELHO}✗${NORMAL} Não conseguiu conectar a MySQL com root"
    ((ERROS++))
fi

# Testar banco erp
if mysql -h localhost -u root -e "USE erp;" &> /dev/null; then
    echo -e "${VERDE}✓${NORMAL} Banco de dados 'erp' existe"
else
    echo -e "${AMARELO}⚠${NORMAL} Banco de dados 'erp' não encontrado - será criado durante deployment"
    ((AVISOS++))
fi

# Testar usuário spdealer
if mysql -h localhost -u spdealer -p${SPDEALER_DB_PASS:-"sua_senha"} -e "SELECT 1;" &> /dev/null 2>&1; then
    echo -e "${VERDE}✓${NORMAL} Usuário 'spdealer' existe e acessível"
else
    echo -e "${AMARELO}⚠${NORMAL} Usuário 'spdealer' não acessível com senha padrão"
    ((AVISOS++))
fi

check_service "mariadb" "MariaDB service"
echo ""

# ===== 3. VERIFICAR TOMCAT =====
echo -e "${AMARELO}[3] TOMCAT 9${NORMAL}"

TOMCAT_PATHS=("/opt/tomcat" "/usr/local/tomcat" "/var/lib/tomcat" "/home/tomcat")
TOMCAT_FOUND=0

for path in "${TOMCAT_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo -e "${VERDE}✓${NORMAL} Tomcat encontrado em: $path"
        TOMCAT_HOME=$path
        TOMCAT_FOUND=1
        break
    fi
done

if [ $TOMCAT_FOUND -eq 0 ]; then
    echo -e "${VERMELHO}✗${NORMAL} Tomcat não encontrado em nenhum dos caminhos padrão"
    ((ERROS++))
else
    # Verificar estrutura
    check_dir "$TOMCAT_HOME/bin" "  - Diretório bin"
    check_dir "$TOMCAT_HOME/conf" "  - Diretório conf"
    check_dir "$TOMCAT_HOME/webapps" "  - Diretório webapps"
    check_dir "$TOMCAT_HOME/logs" "  - Diretório logs"
    
    # Testar startup.sh
    if [ -x "$TOMCAT_HOME/bin/startup.sh" ]; then
        echo -e "${VERDE}✓${NORMAL}   startup.sh é executável"
    else
        echo -e "${VERMELHO}✗${NORMAL}   startup.sh não é executável"
        ((ERROS++))
    fi
fi

check_service "tomcat" "Tomcat service"
echo ""

# ===== 4. VERIFICAR OPENSUSE =====
echo -e "${AMARELO}[4] SISTEMA OPERACIONAL${NORMAL}"

if [ -f /etc/os-release ]; then
    OS_NAME=$(grep "^NAME=" /etc/os-release | cut -d= -f2 | tr -d '"')
    OS_VERSION=$(grep "^VERSION_ID=" /etc/os-release | cut -d= -f2 | tr -d '"')
    echo -e "${VERDE}✓${NORMAL} OpenSUSE: $OS_NAME $OS_VERSION"
else
    echo -e "${VERMELHO}✗${NORMAL} Não é OpenSUSE ou arquivo /etc/os-release não encontrado"
    ((ERROS++))
fi

# Verificar espaço em disco
DISK_USAGE=$(df /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${VERDE}✓${NORMAL} Espaço em disco: $(df -h /opt | awk 'NR==2 {print $4}' | tr -d '\n') disponível"
else
    echo -e "${AMARELO}⚠${NORMAL} Espaço em disco baixo: ${DISK_USAGE}% usado"
    ((AVISOS++))
fi

# Verificar memória
MEM_TOTAL=$(free -h | grep "^Mem:" | awk '{print $2}')
MEM_AVAILABLE=$(free -h | grep "^Mem:" | awk '{print $7}')
echo "    Memória total: $MEM_TOTAL, Disponível: $MEM_AVAILABLE"

echo ""

# ===== 5. VERIFICAR REDE =====
echo -e "${AMARELO}[5] REDE E CONECTIVIDADE${NORMAL}"

if ping -c 1 8.8.8.8 &> /dev/null; then
    echo -e "${VERDE}✓${NORMAL} Acesso à internet OK"
else
    echo -e "${VERMELHO}✗${NORMAL} Sem acesso à internet"
    ((ERROS++))
fi

# Verificar porta 8080
if ss -tlnp 2>/dev/null | grep -q ":8080 "; then
    PROC=$(ss -tlnp 2>/dev/null | grep ":8080 " | awk '{print $NF}')
    echo -e "${AMARELO}⚠${NORMAL} Porta 8080 está em uso: $PROC"
    ((AVISOS++))
else
    echo -e "${VERDE}✓${NORMAL} Porta 8080 disponível"
fi

# Verificar firewall
if command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --list-ports 2>/dev/null | grep -q "8080/tcp"; then
        echo -e "${VERDE}✓${NORMAL} Porta 8080 aberta no firewall"
    else
        echo -e "${AMARELO}⚠${NORMAL} Porta 8080 não está aberta no firewall"
        ((AVISOS++))
    fi
fi

echo ""

# ===== 6. VERIFICAR PERMISSÕES =====
echo -e "${AMARELO}[6] PERMISSÕES E USUÁRIOS${NORMAL}"

if id tomcat &> /dev/null; then
    echo -e "${VERDE}✓${NORMAL} Usuário 'tomcat' existe"
    
    # Verificar propriedade de diretórios
    if [ -d "$TOMCAT_HOME" ]; then
        OWNER=$(ls -ld "$TOMCAT_HOME" | awk '{print $3}')
        if [ "$OWNER" = "tomcat" ] || [ "$OWNER" = "root" ]; then
            echo -e "${VERDE}✓${NORMAL}   $TOMCAT_HOME propriedade OK (proprietário: $OWNER)"
        else
            echo -e "${AMARELO}⚠${NORMAL}   $TOMCAT_HOME propriedade estranha (proprietário: $OWNER)"
            ((AVISOS++))
        fi
    fi
else
    echo -e "${VERMELHO}✗${NORMAL} Usuário 'tomcat' não existe"
    ((ERROS++))
fi

echo ""

# ===== 7. VERIFICAR MAVEN (OPCIONAL) =====
echo -e "${AMARELO}[7] MAVEN (OPCIONAL)${NORMAL}"

if check_command "mvn" "Maven instalado"; then
    MVN_VERSION=$(mvn -version 2>&1 | head -1)
    echo "    $MVN_VERSION"
fi

echo ""

# ===== RESUMO =====
echo -e "${AMARELO}╔════════════════════════════════════════════════════════════════╗${NORMAL}"
echo -e "${AMARELO}║   RESUMO DA VERIFICAÇÃO                                        ║${NORMAL}"
echo -e "${AMARELO}╚════════════════════════════════════════════════════════════════╝${NORMAL}"

if [ $ERROS -eq 0 ]; then
    echo -e "${VERDE}✓ Nenhum erro crítico encontrado${NORMAL}"
else
    echo -e "${VERMELHO}✗ $ERROS ERRO(S) encontrado(s) - deployment pode falhar${NORMAL}"
fi

if [ $AVISOS -gt 0 ]; then
    echo -e "${AMARELO}⚠ $AVISOS aviso(s) - verifique antes de fazer deploy${NORMAL}"
fi

echo ""

if [ $ERROS -eq 0 ] && [ $AVISOS -eq 0 ]; then
    echo -e "${VERDE}🎉 AMBIENTE PRONTO PARA DEPLOYMENT!${NORMAL}"
    exit 0
elif [ $ERROS -eq 0 ]; then
    echo -e "${AMARELO}⚠️  Deployment possível, mas com ressalvas${NORMAL}"
    exit 1
else
    echo -e "${VERMELHO}❌ Corrija os erros antes de fazer deployment${NORMAL}"
    exit 2
fi
