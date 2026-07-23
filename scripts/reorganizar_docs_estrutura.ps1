#!/usr/bin/env pwsh
# ============================================================================
# Script: Reorganizar Documentacao - Mover para docs/Outros/
# Data: 31 de Outubro de 2025
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$docsPath = "$(pwd)\docs"
$outrosPath = "$docsPath\Outros"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Reorganizar Documentacao SPDealer" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar pastas
if (-not (Test-Path $docsPath)) {
    Write-Host "ERRO: Pasta 'docs' nao encontrada!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $outrosPath)) {
    Write-Host "Criando pasta docs/Outros..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $outrosPath -Force | Out-Null
}

Write-Host "Pasta docs verificada: OK" -ForegroundColor Green

# Documentos que DEVEM ficar em docs/
$docsEssenciais = @(
    "README_ESTRUTURA_DOCS.md",
    "ROTEIRO_MODULOS_TAREFAS.md",
    "CONTEXTO_ATUAL_PROJETO_31OUT.md"
)

# Listar arquivos a mover
$filesToMove = Get-ChildItem -Path $docsPath -Filter "*.md" -Depth 0 | 
    Where-Object { $_.Name -notin $docsEssenciais }

$fileCount = ($filesToMove | Measure-Object).Count

Write-Host ""
Write-Host "Arquivos encontrados: $fileCount" -ForegroundColor Cyan
Write-Host "Arquivos essenciais (ficarao em docs/): $($docsEssenciais.Count)" -ForegroundColor Green
Write-Host ""

# Mostrar preview
if ($fileCount -gt 0) {
    Write-Host "Arquivos a mover:" -ForegroundColor Yellow
    $filesToMove | ForEach-Object {
        Write-Host "  >> $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "Nenhum arquivo para mover." -ForegroundColor Green
    exit 0
}

# Modo simulacao
if ($DryRun) {
    Write-Host "MODO SIMULACAO (-DryRun)" -ForegroundColor Yellow
    Write-Host "Nenhum arquivo sera movido" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para executar realmente, rode:" -ForegroundColor Cyan
    Write-Host "  .\scripts\reorganizar_docs_estrutura.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Confirmacao se nao for force
if (-not $Force) {
    Write-Host ""
    $confirm = Read-Host "Deseja mover $fileCount arquivos para docs/Outros/? (s/n)"
    
    if ($confirm -ne "s" -and $confirm -ne "S") {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""

# Mover arquivos
$movedCount = 0

$filesToMove | ForEach-Object {
    try {
        $sourceFile = $_.FullName
        $destFile = Join-Path $outrosPath $_.Name
        
        Move-Item -Path $sourceFile -Destination $destFile -Force
        Write-Host "  OK $($_.Name)" -ForegroundColor Green
        $movedCount++
    } catch {
        Write-Host "  ERRO ao mover $($_.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Resultado: $movedCount arquivos movidos" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Estrutura final:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  docs/" -ForegroundColor Cyan
Write-Host "    - README_ESTRUTURA_DOCS.md" -ForegroundColor Green
Write-Host "    - ROTEIRO_MODULOS_TAREFAS.md" -ForegroundColor Green
Write-Host "    - CONTEXTO_ATUAL_PROJETO_31OUT.md" -ForegroundColor Green
Write-Host "    - Projeto/ (tarefas em andamento)" -ForegroundColor Green
Write-Host "    - Tarefas_Cumpridas/ (historico)" -ForegroundColor Green
Write-Host "    - Outros/ ($movedCount arquivos de referencia)" -ForegroundColor Green
Write-Host ""

Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  git add docs/" -ForegroundColor Gray
Write-Host "  git commit -m 'docs: reorganizar em estrutura de pastas'" -ForegroundColor Gray
Write-Host "  git push origin seu_branch" -ForegroundColor Gray
Write-Host ""

Write-Host "OK!" -ForegroundColor Green
Write-Host ""
