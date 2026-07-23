#!/usr/bin/env powershell
<#
Script para iniciar Frontend em DESENVOLVIMENTO LOCAL
com Backend remoto (Produção - 100.126.166.63:8080)

Uso:
  .\start_frontend_dev.ps1
#>

Write-Host "=== SPDealer - Frontend DEV Local ===" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "📍 Configuração:" -ForegroundColor Yellow
Write-Host "  Frontend (Local):    http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend (Remoto):    http://100.126.166.63:8080" -ForegroundColor Green
Write-Host "  Banco (Remoto):      100.126.166.63:3306/erp" -ForegroundColor Green
Write-Host ""

# Definir variáveis de ambiente para DEV com backend remoto
$env:PORT = '3000'
$env:REACT_APP_API_BASE_URL = 'http://100.126.166.63:8080'
$env:REACT_APP_API_URL = 'http://100.126.166.63:8080/api'
$env:REACT_APP_ENV = 'development'
$env:BROWSER = 'none'
$env:DANGEROUSLY_DISABLE_HOST_CHECK = 'true'
$env:SKIP_PREFLIGHT_CHECK = 'true'

Write-Host "🔧 Variáveis de Ambiente:" -ForegroundColor Yellow
Write-Host "  REACT_APP_API_BASE_URL = $env:REACT_APP_API_BASE_URL" -ForegroundColor Gray
Write-Host "  REACT_APP_API_URL = $env:REACT_APP_API_URL" -ForegroundColor Gray
Write-Host "  PORT = $env:PORT" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Iniciando Frontend (npm start)..." -ForegroundColor Green
Write-Host "   Aguarde 2-3 minutos para que o servidor inicie..." -ForegroundColor Gray
Write-Host ""

# Executar npm start
npm start
