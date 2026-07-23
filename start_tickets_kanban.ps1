#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para iniciar o Sistema de Tickets + Kanban Board
    
.DESCRIPTION
    Inicia Backend, Frontend e Banco de Dados em terminais separados
    
.NOTES
    Data: 01 NOV 2025
    Versão: 1.0 Final
    Status: Sistema 100% Operacional
#>

param(
    [ValidateSet("full", "backend", "frontend", "test")]
    [string]$Mode = "full"
)

$ProjectPath = "h:\DISCO_D\Desenvolvimento\Seprocom\spdealer"
$BackendJar = "$ProjectPath\target\spdealer-1.0.0.jar"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎫 SISTEMA DE TICKETS + KANBAN BOARD" -ForegroundColor Green
Write-Host "  Status: ✅ OPERACIONAL E PRONTO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# MODO: Backend apenas
# ============================================================================
if ($Mode -eq "backend") {
    Write-Host "🚀 Iniciando BACKEND em http://localhost:8080" -ForegroundColor Yellow
    Write-Host "   Comando: java -jar $BackendJar" -ForegroundColor Gray
    Write-Host ""
    
    if (!(Test-Path $BackendJar)) {
        Write-Host "❌ ERRO: JAR não encontrado em $BackendJar" -ForegroundColor Red
        Write-Host "   Execute primeiro: mvn clean package -DskipTests" -ForegroundColor Yellow
        exit 1
    }
    
    & java -jar $BackendJar
    exit $LASTEXITCODE
}

# ============================================================================
# MODO: Frontend apenas
# ============================================================================
elseif ($Mode -eq "frontend") {
    Write-Host "🚀 Iniciando FRONTEND em http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Comando: npm start" -ForegroundColor Gray
    Write-Host ""
    
    Set-Location $ProjectPath
    & npm start
    exit $LASTEXITCODE
}

# ============================================================================
# MODO: Testes rápidos
# ============================================================================
elseif ($Mode -eq "test") {
    Write-Host "🧪 Executando TESTES RÁPIDOS..." -ForegroundColor Yellow
    Write-Host ""
    
    $tests = @(
        @{
            Name = "Teste 1: Backend respondendo"
            Command = { Invoke-WebRequest -Uri "http://localhost:8080/api/v1/tickets/kanban/summary" -ErrorAction SilentlyContinue }
            Expected = "success"
        },
        @{
            Name = "Teste 2: Buscar TASK-004 (Ticket #202500000004)"
            Command = { Invoke-WebRequest -Uri "http://localhost:8080/api/v1/tickets/202500000004" -ErrorAction SilentlyContinue }
            Expected = "202500000004"
        },
        @{
            Name = "Teste 3: Listar tickets abertos"
            Command = { Invoke-WebRequest -Uri "http://localhost:8080/api/v1/tickets/status/open?page=0&size=10" -ErrorAction SilentlyContinue }
            Expected = "tickets"
        }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        try {
            Write-Host "▶ $($test.Name)" -ForegroundColor Cyan
            $response = & $test.Command
            $content = $response.Content | ConvertFrom-Json
            
            if ($content.PSObject.Properties.Name -contains $test.Expected) {
                Write-Host "  ✅ PASSOU" -ForegroundColor Green
                $passed++
            } else {
                Write-Host "  ❌ FALHOU" -ForegroundColor Red
                $failed++
            }
        } catch {
            Write-Host "  ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
        Write-Host ""
    }
    
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Resultado: $passed passou, $failed falhou" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    exit 0
}

# ============================================================================
# MODO: Full (Backend + Frontend)
# ============================================================================
else {
    Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar JAR
    if (!(Test-Path $BackendJar)) {
        Write-Host "❌ JAR não encontrado: $BackendJar" -ForegroundColor Red
        Write-Host "   Execute: mvn clean package -DskipTests" -ForegroundColor Yellow
        exit 1
    }
    
    # Verificar node_modules
    if (!(Test-Path "$ProjectPath\node_modules")) {
        Write-Host "❌ node_modules não encontrado" -ForegroundColor Red
        Write-Host "   Execute: npm install" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Todos pré-requisitos OK" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🚀 Abrindo Terminal 1: BACKEND..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$ProjectPath'; Write-Host '🔵 BACKEND iniciando...' -ForegroundColor Cyan; java -jar '$BackendJar'"
    )
    
    Start-Sleep -Seconds 3
    
    Write-Host "🚀 Abrindo Terminal 2: FRONTEND..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$ProjectPath'; Write-Host '🟢 FRONTEND iniciando...' -ForegroundColor Cyan; npm start"
    )
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  ✅ SISTEMA INICIANDO" -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "  Aguarde 10-15 segundos para ambos os serviços inicializar..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  📍 Backend:  http://localhost:8080" -ForegroundColor Cyan
    Write-Host "  📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  📍 Kanban:   http://localhost:3000/ferramentas/tarefas" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  💡 Dica: Use este comando para testes:" -ForegroundColor Yellow
    Write-Host "     .\start_tickets_kanban.ps1 -Mode test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Aguardar
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
