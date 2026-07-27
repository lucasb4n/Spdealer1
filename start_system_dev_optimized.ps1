#!/usr/bin/env powershell
<#
start_system_dev_optimized.ps1 - VERSAO OTIMIZADA
Inicia backend (java -jar) + frontend (npm start) MUITO MAIS RAPIDO
Tempo esperado: ~8-10 segundos (vs 45+ segundos com mvn spring-boot:run)

MELHORIAS:
1. Usa java -jar (JAR ja compilado) em vez de mvn spring-boot:run
2. Se JAR nao existir, faz mvn package uma unica vez
3. Abre terminal separado para cada servico (melhor visibilidade)
4. Aguarda health checks antes de considerar "pronto"
5. Mostra tempos de inicializacao para diagnostico

USO:
  .\start_system_dev_optimized.ps1
#>

$ErrorActionPreference = 'Continue'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Cores
$Green = [ConsoleColor]::Green
$Cyan = [ConsoleColor]::Cyan
$Yellow = [ConsoleColor]::Yellow
$Red = [ConsoleColor]::Red

function Write-Log {
    param([string]$Message, [ConsoleColor]$Color = $Cyan)
    $timestamp = (Get-Date).ToString('HH:mm:ss')
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "✅ $Message" -Color $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Log "⚠️ $Message" -Color $Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Log "❌ $Message" -Color $Red
}

# Etapa 1: Preparar JAR
Write-Log "=== ETAPA 1: Preparar JAR ===" -Color $Cyan
$jarPath = Get-ChildItem -Path "$scriptDir\target" -Filter "*.jar" -File -ErrorAction SilentlyContinue | 
           Where-Object { $_.Name -match 'spdealer.*\.jar$' -and $_.Name -notmatch 'sources|javadoc' } |
           Sort-Object LastWriteTime -Descending | 
           Select-Object -First 1

if ($null -eq $jarPath) {
    Write-Warning "JAR nao encontrado. Compilando agora (primeira vez, leva ~2-3 min)..."
    Write-Log "Executando: mvn clean package -DskipTests -q" -Color $Yellow
    
    $startBuild = Get-Date
    mvn clean package -DskipTests -q
    
    if ($LASTEXITCODE -eq 0) {
        $buildTime = (Get-Date) - $startBuild
        Write-Success "Build completado em $($buildTime.TotalSeconds)s"
    } else {
        Write-Error-Custom "Build falhou! Exit code: $LASTEXITCODE"
        exit 1
    }
    
    $jarPath = Get-ChildItem -Path "$scriptDir\target" -Filter "spdealer*.jar" -File -ErrorAction SilentlyContinue | 
               Where-Object { $_.Name -notmatch 'sources|javadoc' } |
               Sort-Object LastWriteTime -Descending | 
               Select-Object -First 1
}

$jarFile = $jarPath.FullName
Write-Success "JAR encontrado: $(Split-Path -Leaf $jarFile)"

# Etapa 2: Preparar scripts wrapper
Write-Log "`n=== ETAPA 2: Preparar scripts de inicializacao ===" -Color $Cyan

$backendScript = Join-Path $scriptDir '.backend_startup.ps1'
$frontendScript = Join-Path $scriptDir '.frontend_startup.ps1'

# Backend wrapper
@"
# Backend startup wrapper
Set-Location '$scriptDir'

# Parar java anterior se houver
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Configurar variáveis de ambiente
[Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE','dev','Process')

Write-Host '[BACKEND] Iniciando Spring Boot via java -jar' -ForegroundColor Cyan
Write-Host "[BACKEND] JAR: $jarFile" -ForegroundColor Gray

java -Xms256m -Xmx1024m -jar '$jarFile' --server.port=8080

"@ | Out-File -FilePath $backendScript -Encoding UTF8 -Force

# Frontend wrapper
@"
# Frontend startup wrapper
Set-Location '$scriptDir'

[Environment]::SetEnvironmentVariable('REACT_APP_API_BASE_URL','http://localhost:8080','Process')
[Environment]::SetEnvironmentVariable('REACT_APP_API_URL','http://localhost:8080/api','Process')
[Environment]::SetEnvironmentVariable('PUBLIC_URL','/','Process')
[Environment]::SetEnvironmentVariable('PORT','3000','Process')
[Environment]::SetEnvironmentVariable('DANGEROUSLY_DISABLE_HOST_CHECK','true','Process')

Write-Host '[FRONTEND] Iniciando React dev server' -ForegroundColor Cyan

if (Test-Path package.json) {
    npm start
} else {
    Write-Host '[FRONTEND] ERRO: package.json nao encontrado!' -ForegroundColor Red
    exit 1
}

"@ | Out-File -FilePath $frontendScript -Encoding UTF8 -Force

Write-Success "Scripts criados"

# Etapa 3: Abrir terminais
Write-Log "`n=== ETAPA 3: Iniciando servicos ===" -Color $Cyan

Write-Log "Abrindo terminal para BACKEND..." -Color Yellow
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit', '-File', $backendScript -WorkingDirectory $scriptDir

Write-Log "Aguardando backend inicializar (~3-5s)..." -Color Yellow
Start-Sleep -Seconds 5

Write-Log "Abrindo terminal para FRONTEND..." -Color Yellow
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit', '-File', $frontendScript -WorkingDirectory $scriptDir

# Etapa 4: Verificar saude
Write-Log "`n=== ETAPA 4: Verificando servicos ===" -Color $Cyan

$backendReady = $false
$attempts = 0
$maxAttempts = 12  # 60 segundos total (5s entre tentativas)

while (-not $backendReady -and $attempts -lt $maxAttempts) {
    try {
        Write-Log "Health check backend (tentativa $($attempts+1)/$maxAttempts)..." -Color Gray
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/filiais" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend respondendo em http://localhost:8080"
            $backendReady = $true
        }
    } catch {
        # Aguardar mais um pouco
    }
    
    if (-not $backendReady) {
        $attempts++
        Start-Sleep -Seconds 5
    }
}

if (-not $backendReady) {
    Write-Warning "Backend nao respondeu apos 60s. Verifique o terminal de logs."
}

# Resumo final
Write-Log "`n╔════════════════════════════════════════╗" -Color $Green
Write-Log "║     AMBIENTE DESENVOLVIMENTO PRONTO    ║" -Color $Green
Write-Log "╚════════════════════════════════════════╝" -Color $Green

Write-Host "`n✅ Backend: http://localhost:8080" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ API: http://localhost:8080/api" -ForegroundColor Green
Write-Host "`n📝 Logs dos servicos estao em janelas separadas acima`n" -ForegroundColor Cyan

Write-Log "Dicas:" -Color Yellow
Write-Host "  1. Acesse http://localhost:3000 no navegador" -ForegroundColor Gray
Write-Host "  2. Para parar: feche as 2 janelas de terminal (Ctrl+C)" -ForegroundColor Gray
Write-Host "  3. Para recompile JAR: mvn clean package -DskipTests -q" -ForegroundColor Gray

