#!/usr/bin/env pwsh
# SCRIPT DE COPIA E CONFIGURACAO - TASK-114 FILTROS DE CLASSIFICACOES
# Autor: GitHub Copilot
# Data: 2025-11-01
# Descricao: Copia todos os arquivos criados para as locacoes corretas do projeto SPDealer

# ============================================================
# CONFIGURACOES
# ============================================================

$projectRoot = "h:\DISCO_D\Desenvolvimento\Seprocom\spdealer"
$srcPath = $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCRIPT DE COPIA - TASK-114" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# FUNCOES AUXILIARES
# ============================================================

function Copy-IfExists {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        Write-Host "[✓] Copiando: $Description" -ForegroundColor Green
        Write-Host "    De: $Source" -ForegroundColor Gray
        Write-Host "    Para: $Destination" -ForegroundColor Gray
        
        # Criar diretorio se nao existir
        $destDir = Split-Path -Parent $Destination
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "    Status: COPIADO COM SUCESSO" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "[✗] ERRO: Arquivo não encontrado: $Source" -ForegroundColor Red
        return $false
    }
}

function Test-Directory {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host "[✓] Diretório existe: $Description ($Path)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[✗] Diretório NÃO encontrado: $Description ($Path)" -ForegroundColor Red
        return $false
    }
}

# ============================================================
# PRE-VERIFICACOES
# ============================================================

Write-Host "ETAPA 1: PRE-VERIFICACOES" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

$backendOk = Test-Directory "$projectRoot\src\main\java\com\spdealer\api" "Backend Java"
$frontendOk = Test-Directory "$projectRoot\src\components" "Frontend Components"
$testsOk = Test-Directory "$projectRoot\src\test" "Backend Tests"
$hooksOk = Test-Directory "$projectRoot\src\hooks" "Frontend Hooks"

Write-Host ""

if (-not $backendOk -or -not $frontendOk) {
    Write-Host "[!] AVISO: Alguns diretórios não encontrados. Criando..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "$projectRoot\src\main\java\com\spdealer\api\dto" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\main\java\com\spdealer\api\service" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\main\java\com\spdealer\api\controller" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\main\java\com\spdealer\api\repository" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\components\TaskManager" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\hooks" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\types" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\__tests__\components" -Force -EA SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path "$projectRoot\src\__tests__\hooks" -Force -EA SilentlyContinue | Out-Null
    Write-Host "[✓] Diretórios criados com sucesso" -ForegroundColor Green
}

Write-Host ""

# ============================================================
# COPIA DE ARQUIVOS BACKEND
# ============================================================

Write-Host "ETAPA 2: COPIA DE ARQUIVOS BACKEND" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

$backendFiles = @(
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_1-DTODTO.java"
        Dest = "$projectRoot\src\main\java\com\spdealer\api\dto\ClassificationFilterDTO.java"
        Desc = "DTO para filtragem"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_2-SERVICE.java"
        Dest = "$projectRoot\src\main\java\com\spdealer\api\service\ClassificationFilterService.java"
        Desc = "Service de filtragem"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_3-CONTROLLER.java"
        Dest = "$projectRoot\src\main\java\com\spdealer\api\controller\ClassificationFilterController.java"
        Desc = "Controller REST"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_4A-REPOSITORY.java"
        Dest = "$projectRoot\src\main\java\com\spdealer\api\repository\TaskClassificationRepository.java"
        Desc = "Repository JPA"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_4B-SQL_QUERIES.sql"
        Dest = "$projectRoot\docs\SQL_CLASSIFICATION_FILTERS.sql"
        Desc = "Queries de referencia SQL"
    }
)

$backendSuccess = 0
foreach ($file in $backendFiles) {
    if (Copy-IfExists $file.Source $file.Dest $file.Desc) {
        $backendSuccess++
    }
}

Write-Host "Backend: $backendSuccess/5 arquivos copiados" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# COPIA DE ARQUIVOS FRONTEND
# ============================================================

Write-Host "ETAPA 3: COPIA DE ARQUIVOS FRONTEND" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

$frontendFiles = @(
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_1-FILTERBAR.tsx"
        Dest = "$projectRoot\src\components\TaskManager\FilterBar.tsx"
        Desc = "Componente FilterBar"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_2-SERVICE.ts"
        Dest = "$projectRoot\src\services\ClassificationFilterService.ts"
        Desc = "Servico HTTP de filtragem"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_3-HOOK.ts"
        Dest = "$projectRoot\src\hooks\useFilterClassifications.ts"
        Desc = "Hooks de filtragem"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_4-TYPES.ts"
        Dest = "$projectRoot\src\types\ClassificationFilter.ts"
        Desc = "TypeScript types"
    }
)

$frontendSuccess = 0
foreach ($file in $frontendFiles) {
    if (Copy-IfExists $file.Source $file.Dest $file.Desc) {
        $frontendSuccess++
    }
}

Write-Host "Frontend: $frontendSuccess/4 arquivos copiados" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# COPIA DE ARQUIVOS DE TESTES
# ============================================================

Write-Host "ETAPA 4: COPIA DE ARQUIVOS DE TESTES" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

$testFiles = @(
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_BACKEND_5-TEST.java"
        Dest = "$projectRoot\src\test\java\com\spdealer\api\service\ClassificationFilterServiceTest.java"
        Desc = "Testes backend (ClassificationFilterService)"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_5-TEST.test.tsx"
        Dest = "$projectRoot\src\__tests__\components\FilterBar.test.tsx"
        Desc = "Testes frontend (FilterBar)"
    },
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_6-HOOK.test.ts"
        Dest = "$projectRoot\src\__tests__\hooks\useFilterClassifications.test.ts"
        Desc = "Testes frontend (Hooks)"
    }
)

$testSuccess = 0
foreach ($file in $testFiles) {
    if (Copy-IfExists $file.Source $file.Dest $file.Desc) {
        $testSuccess++
    }
}

Write-Host "Testes: $testSuccess/3 arquivos copiados" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# COPIA DE DOCUMENTACAO E GUIAS
# ============================================================

Write-Host "ETAPA 5: COPIA DE DOCUMENTACAO E GUIAS" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

$docFiles = @(
    @{
        Source = "$srcPath\EJEMPLO_CODIGO_FRONTEND_5-INTEGRACAO.tsx"
        Dest = "$projectRoot\docs\FILTRO_INTEGRACAO_GUIA.tsx"
        Desc = "Guia de integração"
    },
    @{
        Source = "$srcPath\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md"
        Dest = "$projectRoot\docs\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md"
        Desc = "Guia completo de implementação"
    },
    @{
        Source = "$srcPath\RESUMO_EXECUTIVO_TASK-114.md"
        Dest = "$projectRoot\docs\RESUMO_EXECUTIVO_TASK-114.md"
        Desc = "Resumo executivo"
    }
)

$docSuccess = 0
foreach ($file in $docFiles) {
    if (Copy-IfExists $file.Source $file.Dest $file.Desc) {
        $docSuccess++
    }
}

Write-Host "Documentacao: $docSuccess/3 arquivos copiados" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# RESUMO FINAL
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalSuccess = $backendSuccess + $frontendSuccess + $testSuccess + $docSuccess
$totalFiles = 5 + 4 + 3 + 3

Write-Host "Backend:       $backendSuccess/5 ✓" -ForegroundColor Green
Write-Host "Frontend:      $frontendSuccess/4 ✓" -ForegroundColor Green
Write-Host "Testes:        $testSuccess/3 ✓" -ForegroundColor Green
Write-Host "Documentacao:  $docSuccess/3 ✓" -ForegroundColor Green
Write-Host ""
Write-Host "TOTAL:         $totalSuccess/$totalFiles arquivos copiados" -ForegroundColor Cyan

if ($totalSuccess -eq $totalFiles) {
    Write-Host ""
    Write-Host "[✓] SUCESSO: Todos os arquivos foram copiados!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Compilar backend:   mvn clean package -DskipTests" -ForegroundColor Cyan
    Write-Host "2. Testar backend:     mvn test -Dtest=ClassificationFilterServiceTest" -ForegroundColor Cyan
    Write-Host "3. Instalar frontend:  npm install (se necessario)" -ForegroundColor Cyan
    Write-Host "4. Testar frontend:    npm test -- FilterBar.test.tsx" -ForegroundColor Cyan
    Write-Host "5. Integrar:           Usar guia FILTRO_INTEGRACAO_GUIA.tsx" -ForegroundColor Cyan
    Write-Host "6. Verificar E2E:      npm start e testar manualmente" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[✗] AVISO: Nem todos os arquivos foram copiados!" -ForegroundColor Red
    Write-Host "   Arquivos copiados: $totalSuccess/$totalFiles" -ForegroundColor Red
    Write-Host "   Verifique os erros acima" -ForegroundColor Red
    Write-Host ""
}

# ============================================================
# OPCIONAL: Copiar arquivo de integracao para analise
# ============================================================

Write-Host ""
Write-Host "INFORMACOES ADICIONAIS:" -ForegroundColor Yellow
Write-Host "- Guia de Integracao: $projectRoot\docs\FILTRO_INTEGRACAO_GUIA.tsx" -ForegroundColor Cyan
Write-Host "- Guia Completo:      $projectRoot\docs\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md" -ForegroundColor Cyan
Write-Host "- Resumo Executivo:   $projectRoot\docs\RESUMO_EXECUTIVO_TASK-114.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "VERIFICACOES RAPIDAS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Verificar backend compilando:" -ForegroundColor Cyan
Write-Host "  mvn clean package -DskipTests 2>&1 | grep -i error" -ForegroundColor Gray
Write-Host ""
Write-Host "Verificar frontend sem erros:" -ForegroundColor Cyan
Write-Host "  npm run build 2>&1 | grep -i error" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCRIPT FINALIZADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
