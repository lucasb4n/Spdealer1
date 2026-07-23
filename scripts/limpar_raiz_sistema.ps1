#!/usr/bin/env pwsh
# Limpar raiz - Mover .md e .sql desnecessarios para docs/Depreciados

$raiz = Get-Location
$depreciadosPath = "$raiz\docs\Depreciados"

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LIMPEZA DA RAIZ - Mover Desnecessários" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Criar pasta
if (-not (Test-Path $depreciadosPath)) {
    New-Item -ItemType Directory -Path $depreciadosPath -Force | Out-Null
    Write-Host "✓ Pasta docs/Depreciados criada" -ForegroundColor Green
}

# Arquivos essenciais que NUNCA movem
$essenciais = @("README.txt", "package.json", "pom.xml", "tsconfig.json", ".env", ".gitignore")

# Buscar arquivos a mover
$arquivos = @()
Get-ChildItem -Path $raiz -Filter "*.md" -File | Where-Object { $_.Name -notin $essenciais } | ForEach-Object { $arquivos += $_ }
Get-ChildItem -Path $raiz -Filter "*.sql" -File | Where-Object { $_.Name -notin $essenciais } | ForEach-Object { $arquivos += $_ }
Get-ChildItem -Path $raiz -Filter "*.py" -File | ForEach-Object { $arquivos += $_ }
Get-ChildItem -Path $raiz -Filter "*.log" -File | ForEach-Object { $arquivos += $_ }

Write-Host "Arquivos encontrados: $($arquivos.Count)`n" -ForegroundColor Cyan

# Mover
$count = 0
foreach ($arquivo in $arquivos) {
    $dest = Join-Path $depreciadosPath $arquivo.Name
    Move-Item -Path $arquivo.FullName -Destination $dest -Force -ErrorAction SilentlyContinue
    if (Test-Path $dest) {
        Write-Host "  ✓ $($arquivo.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ $count arquivos movidos para docs/Depreciados" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Green
