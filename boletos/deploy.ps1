# ==============================================================================
# deploy.ps1 -- Script de Deploy para o projeto Boleto (boleto.war)
# Servidor Alvo: 192.168.10.70
# Destino: /usr/local/tomcat10/webapps/boleto.war
# Credenciais: root / k15720
# ==============================================================================

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$serverIp = "192.168.10.70"
$serverUser = "root"
$serverPass = "k15720"
$destPath = "/usr/local/tomcat10/webapps"
$warName = "boleto.war"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "=== Iniciando Deploy do $warName ===" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Compilar Frontend
$frontendDir = Join-Path $scriptDir "frontend"
if (Test-Path $frontendDir) {
    Write-Host "[1/3] Compilando Frontend (React)..." -ForegroundColor Yellow
    Push-Location $frontendDir
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    npm run build
    Pop-Location
}

# 2. Compilar WAR com Maven
Write-Host "[2/3] Compilando Backend Java com Maven (gerando $warName)..." -ForegroundColor Yellow
Push-Location $scriptDir
mvn clean package -DskipTests
Pop-Location

$warFile = Join-Path $scriptDir "target\$warName"
if (-not (Test-Path $warFile)) {
    Write-Error "Arquivo $warFile nao encontrado!"
    exit 1
}

# 3. Transferir WAR via SCP/SSH
Write-Host "[3/3] Enviando $warName para ${serverUser}@${serverIp}:${destPath}..." -ForegroundColor Yellow

if (Get-Command "pscp" -ErrorAction SilentlyContinue) {
    echo y | pscp -pw $serverPass $warFile "${serverUser}@${serverIp}:${destPath}/${warName}"
} else {
    $pythonCmd = "import pexpect, sys; cmd = 'scp -o StrictHostKeyChecking=no ""$warFile"" ${serverUser}@${serverIp}:${destPath}/${warName}'; child = pexpect.spawn(cmd, encoding='utf-8', timeout=120); idx = child.expect(['[pP]assword:', pexpect.EOF, pexpect.TIMEOUT]); child.sendline('$serverPass'); child.expect(pexpect.EOF)"
    python -c $pythonCmd
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host " OK: Deploy concluido com sucesso em ${serverIp}:${destPath}/${warName}" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
