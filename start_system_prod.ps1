#!/usr/bin/env powershell
# start_system_prod.ps1 - Build e deployment para produção
# Executa npm run build + mvn clean package para gerar WAR

Write-Host "SPDealer - start_system_prod.ps1 (modo produção)" -ForegroundColor Green

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

function Write-Log([string]$m) { $t=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); Write-Host "[$t] $m" }

Write-Log "Configurando para PRODUCAO (https://spdealer.seprocom.com.br)"

# Setar variáveis para build de produção
Write-Log "Definindo variáveis de ambiente para produção..."
[Environment]::SetEnvironmentVariable('REACT_APP_API_BASE_URL','https://spdealer.seprocom.com.br','Process')
[Environment]::SetEnvironmentVariable('REACT_APP_API_URL','https://spdealer.seprocom.com.br/api','Process')
[Environment]::SetEnvironmentVariable('PUBLIC_URL','/spdealer/','Process')

Write-Log "Iniciando build do frontend (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: npm run build falhou" -ForegroundColor Red
    exit 1
}

Write-Log "Build frontend completo!"
Write-Log "Iniciando build do backend (mvn clean package)..."
mvn clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: mvn clean package falhou" -ForegroundColor Red
    exit 1
}

Write-Log "Compilação concluída com sucesso!"
Write-Host "`n[OK] WAR gerado em target/spdealer-1.0.0.war" -ForegroundColor Green
Write-Host "[OK] Pronto para deploy!" -ForegroundColor Green
Write-Host "`nProximas etapas:" -ForegroundColor Cyan
Write-Host "  1. ./deploy-spdealer.ps1  (deploy para 192.168.10.70)" -ForegroundColor Gray
