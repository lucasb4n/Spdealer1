#!/usr/bin/env powershell
<#
.SYNOPSIS
Debug automático para AG-Grid vazio no DashboardBuilder

.DESCRIPTION
Executa verificações em 3 passos:
1. Banco: dashboard_widgets com queries
2. Backend: Executa queries para ver dados
3. Network: Monitora requisições do frontend

.EXAMPLE
.\debug_ag_grid.ps1 -dashboardId 1 -verbose
#>

param(
    [int]$dashboardId = 1,
    [int]$queryId = 5,
    [switch]$verbose
)

$ErrorActionPreference = 'Continue'

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DEBUG AG-GRID VAZIO - DashboardBuilder                          ║" -ForegroundColor Cyan
Write-Host "║  Dashboard ID: $dashboardId | Query ID: $queryId                                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ═════════════════════════════════════════════════════════════════════════════
# PASSO 1: Verificar Banco de Dados
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n📊 PASSO 1: Verificar Banco de Dados" -ForegroundColor Yellow
Write-Host "─" * 70

Write-Host "`n▶ Buscando widgets AG-Grid no dashboard $dashboardId..." -ForegroundColor Gray

$sqlWidgets = @"
SELECT 
  dw.id as widget_id,
  dw.title,
  dw.widget_type,
  JSON_EXTRACT(dw.data_config, '$.query_id') as query_id,
  JSON_EXTRACT(dw.data_config, '$.queryId') as queryId,
  LENGTH(dw.data_config) as config_length
FROM dashboard_widgets dw
WHERE dw.dashboard_id = $dashboardId
AND (dw.widget_type = 'ag-grid' OR dw.title LIKE '%Saldo%' OR dw.title LIKE '%Atrasado%');
"@

$widgetsResult = mysql -h 100.126.166.63 -u root -pk15720 erp -e "$sqlWidgets" 2>&1 | Select-Object -Skip 1

if ($verbose) {
    Write-Host "`n📄 SQL Executada:" -ForegroundColor Gray
    Write-Host $sqlWidgets -ForegroundColor DarkGray
}

Write-Host "`n✅ Resultado:" -ForegroundColor Green
if ($widgetsResult) {
    Write-Host $widgetsResult
    $widgetCount = ($widgetsResult | Measure-Object -Line).Lines
    Write-Host "`n📊 Total de widgets encontrados: $widgetCount" -ForegroundColor Cyan
} else {
    Write-Host "❌ Nenhum widget encontrado!" -ForegroundColor Red
}

# ═════════════════════════════════════════════════════════════════════════════
# PASSO 2: Verificar Dashboard_Queries
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n📊 PASSO 2: Verificar Dashboard_Queries Existentes" -ForegroundColor Yellow
Write-Host "─" * 70

Write-Host "`n▶ Buscando queries no banco..." -ForegroundColor Gray

$sqlQueries = @"
SELECT 
  id as query_id,
  name,
  description,
  LENGTH(sql_query) as sql_length,
  created_at
FROM dashboard_queries
LIMIT 10;
"@

$queriesResult = mysql -h 100.126.166.63 -u root -pk15720 erp -e "$sqlQueries" 2>&1 | Select-Object -Skip 1

Write-Host "`n✅ Queries disponíveis:" -ForegroundColor Green
if ($queriesResult) {
    Write-Host $queriesResult
} else {
    Write-Host "❌ Nenhuma query encontrada!" -ForegroundColor Red
}

# ═════════════════════════════════════════════════════════════════════════════
# PASSO 3: Testar Execução de Query no Backend
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n📊 PASSO 3: Testar Query Execution no Backend" -ForegroundColor Yellow
Write-Host "─" * 70

Write-Host "`n▶ Backend deve estar rodando em http://localhost:8080" -ForegroundColor Gray
Write-Host "▶ Testando Query ID: $queryId" -ForegroundColor Gray

$backendUrl = "http://localhost:8080/api/v1/dashboard-queries/$queryId/execute"
Write-Host "`n📤 URL: $backendUrl" -ForegroundColor DarkGray

Write-Host "`n⏳ Executando POST request..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $backendUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body "{}" `
        -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        
        $data = $response.Content | ConvertFrom-Json
        $rowCount = ($data.rows | Measure-Object).Count
        $colCount = ($data.columns | Measure-Object).Count
        
        Write-Host "`n📊 Resultado da Query:" -ForegroundColor Cyan
        Write-Host "   Linhas: $rowCount" -ForegroundColor Green
        Write-Host "   Colunas: $colCount" -ForegroundColor Green
        
        if ($data.columns) {
            Write-Host "   Campos: $($data.columns -join ', ')" -ForegroundColor Gray
        }
        
        if ($rowCount -gt 0) {
            Write-Host "`n📝 Primeiro registro:" -ForegroundColor Cyan
            $data.rows[0] | ConvertTo-Json | Write-Host -ForegroundColor DarkGray
        } else {
            Write-Host "`n⚠️  Query retornou 0 linhas! Verifique dados no banco." -ForegroundColor Yellow
        }
        
        # Salvar response completo em arquivo para análise
        $jsonFile = "debug_query_response_$queryId.json"
        $response.Content | Set-Content $jsonFile -Force
        Write-Host "`n💾 Response salvo em: $jsonFile" -ForegroundColor DarkGreen
    } else {
        Write-Host "❌ Status: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao conectar com backend!" -ForegroundColor Red
    Write-Host "   Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Verifique se:" -ForegroundColor Yellow
    Write-Host "   • Backend está rodando em http://localhost:8080" -ForegroundColor Gray
    Write-Host "   • Query ID $queryId existe no banco" -ForegroundColor Gray
    Write-Host "   • Rede permite POST para localhost:8080" -ForegroundColor Gray
}

# ═════════════════════════════════════════════════════════════════════════════
# PASSO 4: Verificar Frontend Context
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n📊 PASSO 4: Verificar Frontend (WidgetDataContext)" -ForegroundColor Yellow
Write-Host "─" * 70

Write-Host "`n💡 Para debug do frontend:" -ForegroundColor Cyan
Write-Host "   1. Abra navegador: http://localhost:3000/ferramentas/dashboard-builder" -ForegroundColor Gray
Write-Host "   2. Abra DevTools: F12" -ForegroundColor Gray
Write-Host "   3. Vá para Console" -ForegroundColor Gray
Write-Host "   4. Procure por mensagens:" -ForegroundColor Gray
Write-Host "      • '[WidgetDataProvider] Context atualizado'" -ForegroundColor DarkGray
Write-Host "      • '[AgGridWidget] rowData:'" -ForegroundColor DarkGray
Write-Host "      • Erros em vermelho" -ForegroundColor DarkGray

# ═════════════════════════════════════════════════════════════════════════════
# RESUMO
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RESUMO DO DEBUG                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n✅ Se PASSO 1 passou:" -ForegroundColor Green
Write-Host "   • Widgets existem no banco com query_id" -ForegroundColor Gray

Write-Host "`n✅ Se PASSO 3 passou com rowCount > 0:" -ForegroundColor Green
Write-Host "   • Backend funcionando, problema é no frontend ou contexto" -ForegroundColor Gray

Write-Host "`n✅ Se PASSO 3 passou com rowCount = 0:" -ForegroundColor Yellow
Write-Host "   • Query está correta mas sem dados no banco" -ForegroundColor Gray
Write-Host "   • Verifique: SELECT * FROM receber; -- dados existem?" -ForegroundColor Gray

Write-Host "`n❌ Se PASSO 3 falhou (erro 404/500):" -ForegroundColor Red
Write-Host "   • Query ID não existe ou endpoint quebrado" -ForegroundColor Gray
Write-Host "   • Check: backend logs, endpoint URL" -ForegroundColor Gray

Write-Host "`n📋 Próximo passo:" -ForegroundColor Cyan
Write-Host "   Compartilhe os resultados dos PASSOs acima para diagnóstico completo" -ForegroundColor Gray

Write-Host "`n" -ForegroundColor Cyan
