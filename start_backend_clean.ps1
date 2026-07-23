#Requires -Version 5.0
<#
.DESCRIPTION
Script para iniciar backend SPDealer de forma limpa e robusta
#>

$ErrorActionPreference = 'Continue'
$scriptDir = "C:\Desenvolvimento\Seprocom\spdealer"
Set-Location $scriptDir

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SPDealer Backend - Start Clean        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# PASSO 1: Parar Java anterior
Write-Host "[1/4] Parando processo Java anterior..." -ForegroundColor Yellow
$javaProcesses = Get-Process java -ErrorAction SilentlyContinue
if ($javaProcesses) {
  Write-Host "     Encontrados $($javaProcesses.Count) processo(s) Java" -ForegroundColor Yellow
  $javaProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
  Write-Host "     ✅ Processo(s) parado(s)" -ForegroundColor Green
  Start-Sleep -Seconds 3
} else {
  Write-Host "     Nenhum processo Java rodando" -ForegroundColor Gray
}
Write-Host ""

# PASSO 2: Verificar WAR file
Write-Host "[2/4] Verificando arquivo WAR..." -ForegroundColor Yellow
$warFile = Join-Path $scriptDir "target\spdealer-1.0.0-exec.war"
if (Test-Path $warFile) {
  $size = [Math]::Round((Get-Item $warFile).Length / 1MB, 2)
  Write-Host "     ✅ Arquivo encontrado: $warFile" -ForegroundColor Green
  Write-Host "     📊 Tamanho: $size MB" -ForegroundColor Gray
} else {
  Write-Host "     ❌ ERRO: Arquivo não encontrado em $warFile" -ForegroundColor Red
  Write-Host "     Execute: mvn clean package -DskipTests" -ForegroundColor Yellow
  exit 1
}
Write-Host ""

# PASSO 3: Verificar porta
Write-Host "[3/4] Verificando porta 8080..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($portTest.TcpTestSucceeded) {
  Write-Host "     ⚠️  Porta 8080 ainda em uso!" -ForegroundColor Yellow
  Write-Host "     Aguardando liberação..." -ForegroundColor Gray
  Start-Sleep -Seconds 3
} else {
  Write-Host "     ✅ Porta 8080 disponível" -ForegroundColor Green
}
Write-Host ""

# PASSO 4: Iniciar backend
Write-Host "[4/4] Iniciando backend..." -ForegroundColor Yellow
Write-Host ""

$javaCmd = "java -jar `"$warFile`" --server.port=8080"
Write-Host "Executando: $javaCmd" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "LOGS DO BACKEND:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Iniciar backend
Invoke-Expression $javaCmd
