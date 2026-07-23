# Script para debugar endpoints de menu do backend
# Teste dos endpoints da API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEBUGANDO ENDPOINTS DE MENU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Testa se o backend está online
Write-Host "`n[1] Verificando se backend está online..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/menu-groups" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend respondendo em http://localhost:8080" -ForegroundColor Green
    Write-Host "Todos os menu-groups: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend NÃO está respondendo!" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Tenta com userId = 1
Write-Host "`n[2] Buscando menu-groups para userId=1..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/menu-groups/1" -Method Get -ErrorAction Stop
    Write-Host "✅ Menu recebido para userId=1" -ForegroundColor Green
    Write-Host "Resposta:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao buscar menu para userId=1" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Tenta buscar permissões
Write-Host "`n[3] Buscando permissões para userId=1..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/menus/permissions/1" -Method Get -ErrorAction Stop
    Write-Host "✅ Permissões recebidas para userId=1" -ForegroundColor Green
    Write-Host "Resposta:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao buscar permissões para userId=1" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FIM DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
