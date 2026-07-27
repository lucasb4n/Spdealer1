#!/usr/bin/env powershell
# start_backend_only.ps1 - Inicia APENAS o backend em janela separada

Write-Host "SPDealer - Backend Only (Modo Desenvolvimento)" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

function Write-Log([string]$m) { 
    $t = (Get-Date).ToString('HH:mm:ss')
    Write-Host "[$t] $m" 
}

# Criar wrapper script para o backend
$backendScript = Join-Path $scriptDir '.backend_run.ps1'
$backendContent = @'
Set-Location '__SCRIPT_DIR__'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend SPDealer - Modo Desenvolvimento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos Java anteriores
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Tentar Maven primeiro
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "✓ Maven encontrado. Compilando e iniciando..." -ForegroundColor Green
    Write-Host ""
    [Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE','dev','Process')
    mvn clean package -DskipTests
    mvn spring-boot:run
} else {
    Write-Host "✗ Maven não encontrado. Procurando JAR em target/..." -ForegroundColor Yellow
    $jar = Get-ChildItem -Path '__SCRIPT_DIR__\target' -Filter 'spdealer*.jar' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($jar) { 
        Write-Host "✓ JAR encontrado: $($jar.Name)" -ForegroundColor Green
        Write-Host ""
        java -jar $jar.FullName --server.port=8080
    } else { 
        Write-Host "✗ Nenhum JAR encontrado. Execute: mvn clean package -DskipTests" -ForegroundColor Red
        exit 1 
    }
}
'@

$backendContent = $backendContent -replace '__SCRIPT_DIR__', ($scriptDir -replace "'", "''")
$backendContent | Out-File -FilePath $backendScript -Encoding UTF8 -Force

# Abrir janela separada para backend
Write-Log "Abrindo backend em janela separada..."
Start-Process -FilePath 'powershell' `
    -ArgumentList '-NoExit', '-File', $backendScript `
    -WorkingDirectory $scriptDir `
    -WindowStyle Normal

Write-Host ""
Write-Host "✅ Backend iniciado em janela separada!" -ForegroundColor Green
Write-Host ""
Write-Host "Monitoramento:" -ForegroundColor Cyan
Write-Host "  - Verifique a janela do PowerShell que abriu" -ForegroundColor Gray
Write-Host "  - Backend estará pronto em http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "Próxima etapa:" -ForegroundColor Cyan
Write-Host "  1. Aguarde a compilação (será rápida se JAR existe)" -ForegroundColor Gray
Write-Host "  2. Veja a mensagem 'Started DashboardApplication' na janela" -ForegroundColor Gray
Write-Host "  3. Então rode os testes em outro terminal" -ForegroundColor Gray
Write-Host ""
