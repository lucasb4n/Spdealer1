#!/usr/bin/env powershell
# start_system_dev.ps1 - Versao melhorada para desenvolvimento
# 1. Compila WAR com mvn clean package -DskipTests
# 2. Inicia backend com java -jar target/spdealer-1.0.0.war
# 3. Inicia frontend com npm start

Write-Host "SPDealer - start_system_dev.ps1 (modo dev com BUILD completo)" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Garantir que o Maven local esteja no PATH para a sessao
$localMvnBin = Join-Path $scriptDir 'maven\apache-maven-3.9.6\bin'
if (Test-Path $localMvnBin) {
    $env:PATH = "$localMvnBin;$env:PATH"
}

function Write-Log([string]$m) { $t=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); Write-Host "[$t] $m" }

# ETAPA 1: COMPILAR WAR
Write-Log "ETAPA 1: Compilando WAR com Maven (mvn clean package -DskipTests)..."
Write-Host "========================================" -ForegroundColor Yellow
mvn clean package -DskipTests
$buildStatus = $LASTEXITCODE
if ($buildStatus -ne 0) {
  Write-Host "[ERRO] Build Maven falhou com codigo: $buildStatus" -ForegroundColor Red
  exit $buildStatus
}
Write-Log "[OK] Build Maven concluido com sucesso!"
Write-Host ""

function Create-BackendWrapper([string]$outFile) {
  $template = @'
Set-Location '__SCRIPT_DIR__'
Write-Host '>>> Backend: iniciando com WAR compilado (logs em server.log/server.err)' -ForegroundColor Green
Write-Host '>>> Parando qualquer processo Java anterior...'
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$logPath = '__SCRIPT_DIR__\server.log'
$errPath = '__SCRIPT_DIR__\server.err'

# Garantir que os arquivos de log existam e sejam truncados
'' | Out-File -FilePath $logPath -Encoding UTF8 -Force
'' | Out-File -FilePath $errPath -Encoding UTF8 -Force

Write-Host ">>> Logs: $logPath (stdout), $errPath (stderr)" -ForegroundColor DarkGray

if (Test-Path '__SCRIPT_DIR__\target\spdealer-1.0.0.war') {
  Write-Host 'Executando: java -jar target/spdealer-1.0.0.war --server.port=8080' -ForegroundColor Cyan
  # Iniciar processo Java redirecionando stdout/stderr para arquivos de log
  Start-Process -FilePath 'java' -ArgumentList '-jar','target\spdealer-1.0.0.war','--spring.profiles.active=dev','--server.port=8080' -RedirectStandardOutput $logPath -RedirectStandardError $errPath -NoNewWindow -Wait
} else {
  Write-Host 'WAR nao encontrado em target/spdealer-1.0.0.war' -ForegroundColor Red
  exit 1
}
'@
  $content = $template -replace '__SCRIPT_DIR__', $scriptDir
  $content | Out-File -FilePath $outFile -Encoding UTF8 -Force
}

function Create-FrontendWrapper([string]$outFile) {
  $template = @'
Set-Location '__SCRIPT_DIR__'
Write-Host '>>> Frontend: definindo REACT_APP_* e iniciando (npm start)'
[Environment]::SetEnvironmentVariable('REACT_APP_API_BASE_URL','http://localhost:8080','Process')
[Environment]::SetEnvironmentVariable('REACT_APP_API_URL','http://localhost:8080/api','Process')
[Environment]::SetEnvironmentVariable('PUBLIC_URL','/','Process')
[Environment]::SetEnvironmentVariable('PORT','3000','Process')
[Environment]::SetEnvironmentVariable('HOST','localhost','Process')
[Environment]::SetEnvironmentVariable('DANGEROUSLY_DISABLE_HOST_CHECK','true','Process')
cd '__SCRIPT_DIR__'
if (Test-Path package.json) { npm start } else { Write-Host 'package.json nao encontrado'; exit 1 }
'@
  $content = $template -replace '__SCRIPT_DIR__', $scriptDir
  $content | Out-File -FilePath $outFile -Encoding UTF8 -Force
}

Write-Log 'Criando scripts temporarios e abrindo janelas separadas para backend e frontend'
$backend = Join-Path $scriptDir '.dev_backend_run.ps1'
$frontend = Join-Path $scriptDir '.dev_frontend_run.ps1'
Create-BackendWrapper -outFile $backend
Create-FrontendWrapper -outFile $frontend

Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-File',$backend -WorkingDirectory $scriptDir -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-File',$frontend -WorkingDirectory $scriptDir -WindowStyle Normal

Write-Log 'Comandos disparados: verifique as janelas do PowerShell abertas para logs.'
