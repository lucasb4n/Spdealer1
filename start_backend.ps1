#!/usr/bin/env powershell
# Script para iniciar Backend via JAR com profile PROD

Write-Host "=== INICIANDO BACKEND SPDEALER ===" -ForegroundColor Cyan
Write-Host ""

cd c:\Desenvolvimento\Seprocom\spdealer

# Procurar JAR mais recente
$jar = Get-ChildItem "target" -Filter "spdealer*-exec.jar" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $jar) {
    Write-Host "[✗] JAR não encontrado! Execute primeiro: mvn clean package -DskipTests" -ForegroundColor Red
    exit 1
}

Write-Host "[✓] JAR encontrado: $($jar.Name)" -ForegroundColor Green
Write-Host "[✓] Tamanho: $([math]::Round($jar.Length / 1MB, 2)) MB" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando Backend..." -ForegroundColor Yellow
Write-Host "  Porta: 8080" -ForegroundColor Yellow
Write-Host "  Profile: prod" -ForegroundColor Yellow
Write-Host "  Banco: 100.126.166.63:3306/erp" -ForegroundColor Yellow
Write-Host ""

# Usar ambiente variável para forçar o profile PROD
$env:SPRING_PROFILES_ACTIVE = 'prod'

# Iniciar Java
java -jar $jar.FullName --server.port=8080
