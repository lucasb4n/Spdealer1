#!/usr/bin/env pwsh
# ============================================================================
# Script: Reorganizar Documentação SPDealer
# Data: 31 de Outubro de 2025
# Objetivo: Mover documentos confusos/obsoletos para /deprecated
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "
╔════════════════════════════════════════════════════════════════════════════╗
║           SCRIPT: Reorganizar Documentação SPDealer                        ║
║           Status: $(if ($DryRun) { 'DRY RUN (simulação)' } else { 'EXECUÇÃO REAL' })                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

$docsPath = 'h:\DISCO_D\Desenvolvimento\Seprocom\spdealer\docs'
$deprecatedPath = Join-Path $docsPath 'deprecated'

# Arquivos para mover
$filesToMove = @(
    # Análises Históricas
    'ANALISE_3_PROBLEMAS_VISUAIS_29OUT_2025.md',
    'ANALISE_CRITICA_LOG_29OUT.md',
    'ANALISE_LOG_COMPLETO_29OUT.md',
    'ANALISE_RENDIZACAO_DASHBOARD_27OUT.md',
    'ANALISE_ENV_PROPAGACAO_27OUT.md',
    'ANALISE_BUILD_SCRIPTS_27OUT.md',
    'ANALISE_CONFLITO_FORMATACAO_CPF_CNPJ_31OUT.md',
    'ANALISE_FORMBUILDER_FLOWBUILDER_PROBLEMAS_31OUT.md',
    'ANALISE_FORMBUILD_FLOWBUILD_QUERYBUILD_28OUT.md',
    'ANALISE_CONEXOES_ABERTAS_MARIADB.md',
    'ANALISE_CRITICA_PROBLEMA_REAPRENDIZADO.md',
    
    # Backups & Revisões
    'BACKUP_23_OUTUBRO_2025.md',
    'BACKUP_BROKEN_DashboardRenderEngine.tsx.txt',
    'BACKUP_BROKEN_DynamicDashboard.tsx.txt',
    'BACKUP_ESTADO_ATUAL_STATUS.txt',
    'BACKUP_FINAL_CONCLUIDO_31OUT_2025.md',
    'BACKUP_GIT_FINAL_31OUT_2025.md',
    'BACKUP_WORKING_DashboardRenderEngine_BEFORE_9ece012.tsx',
    'BACKUP_WORKING_DynamicDashboard_BEFORE_9ece012.tsx',
    'BEFORE_AFTER_RESPONSIVIDADE.md',
    'RESUMO_ATUALIZACOES_DOCS.md',
    'ANTES_DEPOIS_BUILD_SCRIPT.md',
    'ANTES_DEPOIS_DIAGRAMA.md',
    'ANTES_DEPOIS_MOEDA_30OUT.md',
    'ANTES_SAVE_29OUT_WIDGETS.txt',
    
    # Auditorias Históricas
    'ATUALIZACAO_QUERIES_CAIXA_30OUT.md',
    'ATUALIZACAO_QUERY5_CNPJ_CPF_30OUT.md',
    'AUDITORIA_DASHBOARD2_31OUT.md',
    'AUDITORIA_DASHBOARD2_COMPLETA.md',
    'AUDITORIA_FLUXO_SALVAR_30OUT.md',
    'AUDITORIA_SALVAR_KPI_CHART_AGGRID_29OUT.md',
    
    # QueryBuilder Antigos
    'QUERY_BUILDER_ARQUITETURA.md',
    'QUERY_BUILDER_UI_DESIGN.md',
    'QUERY_BUILDER_INTEGRACAO.md',
    'QUERY_BUILDER_BACKEND.md',
    
    # Fases Históricas
    'FASE3_RESUMO_FINAL.md',
    'FASE3_VISUAL_SUMMARY.txt',
    'FASE4_5_6_QUICK_START.md',
    'ENTREGA_FASE3_DASHBOARDRENDERENGINE.md',
    'FASE4_INTEGRACAO_DASHBOARDBUILDER.md',
    'FASE5_INTEGRACAO_DYNAMICDASHBOARD.md',
    'FASE6_TESTES_VALIDACAO.md',
    'FASE6_VALIDACAO_VISUAL.md',
    'FASE6_CHECKLIST_VISUAL.md',
    'HISTORICO_FASE3_DASHBOARDRENDERENGINE.md',
    
    # Análises Específicas Done
    'COMPARACAO_OBJETIVO_VS_IMPLEMENTADO.md',
    'CHECKLIST_VISUAL_COMPARACAO.md',
    'TESTE_VISUAL_RESULTADO.md',
    'TESTE_VISUAL_AUTENTICADO_RESULTADO.md',
    'ANALISE_VISUAL_REAL_HONESTA.md',
    'ENGENHARIA_REVERSA_DASHBOARD.md',
    
    # Índices Antigos
    'INDICE_DOCUMENTACAO_COMPLETA.md',
    'INDICE_DOCUMENTACAO_DASHBOARD.md',
    
    # Design Detalhado Histórico
    'ESTRATEGIA_DASHBOARDBUILDER_FIEL.md',
    'ARQUITETURA_DASHBOARDBUILDER_IMPL.md',
    'GUIA_INTEGRACAO_DASHBOARDRENDERENGINE.md',
    'DOC_AVANCO_DASHBOARD_PARAMETRIZACAO.md',
    'DOC_ASSISTENTE_ANALISE.md',
    'PLANO_FIDELIDADE_100_DASHBOARDS.md',
    'SISTEMA_JANELAS_FLUTUANTES.md',
    'REESTRUTURACAO_CONTEXTO_JANELAS_OUTUBRO_2025.md',
    'CORRECOES_TECNICAS_OUTUBRO_2025.md',
    'MELHORIAS_CORES_MENU_OUTUBRO_2025.md',
    'RESOLUCAO_PROBLEMA_DASHBOARD_WIDGETS_OUTUBRO_2025.md',
    'DASHBOARD_FINANCEIRO.md',
    
    # Relatórios & SQL
    'DASHBOARD_SISTEMA_COMPLETO.md',
    'SISTEMA_FINANCEIRO_COMPLETO.md',
    'SISTEMA_FINANCEIRO_COMPLETO.md.bak',
    'SCRIPT_RECRIAR_MENUS_SPDEALER.sql.md',
    'FLUXO_PERMISSOES_MENU_SPDEALER.md',
    
    # Explicações Técnicas Antigas
    'padroes-arquitetura-sistema.md',
    'estrutura-definitiva-sistema.md',
    'NOVA_ESTRUTURA_USUARIOS.md',
    'fluxo-navegacao-dashboard.md',
    'aggrid-dashboard-integracao.md',
    'ANALISES_FINANCEIRAS_AVANCADAS.md',
    'MENU_SIDEBAR_REFACTORING.md',
    'NAVEGACAO_DINAMICA_MENU.md',
    'PADRAO_ACESSO_ADMIN.md',
    'GUIA_USO_SHARED_UTILS.md',
    'MELHORIAS_FRONTEND.md',
    
    # Configuração
    'tsconfig-explained.md',
    'package-explained.md',
    'Instruções gerais para o desenvolvimento.md',
    'VALIDACAO_PRODUCAO.md',
    'DOCUMENTACAO_TECNICA.md',
    'MANUTENCAO_MONITORAMENTO.md',
    'ESTRUTURA_DASHBOARD.md',
    
    # Análises Incompletas
    'ERROS_COMPILACAO_ANALISE.md',
    'BUILD_QUICK_REFERENCE.md',
    'BUILD_QUICKSTART.md',
    'BUILD_RESUMO_EXECUTIVO.md',
    'BUILD_SCRIPT_USAGE.md',
    'compile_errors.txt',
    'CHECKLIST_26_OUT_2025.md',
    'CHECKLIST_FINAL_24_OUT.md',
    'CHECKLIST_TESTE_401_CORRIGIDO_30OUT.md',
    'CHECKLIST_VALIDACAO_FINAL.md',
    'CHECKLIST_VERIFICACAO_RESTAURACAO.md',
    'CHROME_CACHE_CLEANUP.md'
)

# ============================================================================
# FUNÇÕES
# ============================================================================

function Test-DocExists {
    param([string]$File)
    $fullPath = Join-Path $docsPath $File
    return (Test-Path $fullPath)
}

function Move-DocFile {
    param(
        [string]$File,
        [int]$Index,
        [int]$Total
    )
    
    $source = Join-Path $docsPath $File
    $destination = Join-Path $deprecatedPath $File
    
    if (Test-Path $source) {
        if ($DryRun) {
            Write-Host "[$Index/$Total] [SIMULADO] Mover: $File" -ForegroundColor Yellow
        }
        else {
            try {
                Move-Item -Path $source -Destination $destination -Force -ErrorAction Stop
                Write-Host "[$Index/$Total] ✅ Movido: $File" -ForegroundColor Green
            }
            catch {
                Write-Host "[$Index/$Total] ❌ Erro ao mover: $File" -ForegroundColor Red
                Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "[$Index/$Total] ⊘  Não encontrado: $File" -ForegroundColor Gray
    }
}

# ============================================================================
# EXECUÇÃO
# ============================================================================

# 1. Verificar diretórios
Write-Host "`n📁 Verificando diretórios..." -ForegroundColor Cyan
if (-not (Test-Path $docsPath)) {
    Write-Host "❌ Diretório não encontrado: $docsPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ /docs encontrado" -ForegroundColor Green

if (-not (Test-Path $deprecatedPath)) {
    Write-Host "⚠️  /docs/deprecated não existe. Criando..." -ForegroundColor Yellow
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $deprecatedPath -Force | Out-Null
        Write-Host "✅ Pasta /docs/deprecated criada" -ForegroundColor Green
    }
    else {
        Write-Host "[SIMULADO] Criar pasta /docs/deprecated" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✅ /docs/deprecated existe" -ForegroundColor Green
}

# 2. Contar arquivos
$existingFiles = @()
foreach ($file in $filesToMove) {
    if (Test-DocExists $file) {
        $existingFiles += $file
    }
}

Write-Host "`n📊 Estatísticas:" -ForegroundColor Cyan
Write-Host "   Total para mover: $($filesToMove.Count)" -ForegroundColor White
Write-Host "   Encontrados: $($existingFiles.Count)" -ForegroundColor Green
Write-Host "   Não encontrados: $($filesToMove.Count - $existingFiles.Count)" -ForegroundColor Yellow

# 3. Confirmação
if (-not $DryRun) {
    Write-Host "`n⚠️  ATENÇÃO: Você está prestes a mover $($existingFiles.Count) arquivos!" -ForegroundColor Yellow
    $confirm = Read-Host "Deseja continuar? (s/n)"
    if ($confirm -ne 's' -and $confirm -ne 'S') {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}

# 4. Mover arquivos
Write-Host "`n📁 Movendo arquivos..." -ForegroundColor Cyan
Write-Host "$(if ($DryRun) { '[MODO SIMULAÇÃO]' } else { '[EXECUÇÃO REAL]' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Red' })

$count = 0
foreach ($file in $filesToMove) {
    $count++
    Move-DocFile -File $file -Index $count -Total $filesToMove.Count
}

# 5. Resumo
Write-Host "`n✅ RESUMO:" -ForegroundColor Cyan
Write-Host "   Arquivos processados: $count"
Write-Host "   Status: $(if ($DryRun) { 'SIMULAÇÃO CONCLUÍDA' } else { 'MOVIMENTAÇÃO CONCLUÍDA' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })

# 6. Próximas ações
Write-Host "`n📋 Próximas ações:" -ForegroundColor Cyan
Write-Host "   1. Verificar git status" -ForegroundColor White
Write-Host "   2. Fazer commit: 'docs: organizar documentação (mover deprecated)'" -ForegroundColor White
Write-Host "   3. Fazer commit: 'docs: criar roteiro de tarefas e índices'" -ForegroundColor White
Write-Host "   4. Ler ROTEIRO_MODULOS_TAREFAS.md" -ForegroundColor White
Write-Host "   5. Iniciar Módulo 1 (Cadastro de Clientes)" -ForegroundColor White

Write-Host "`n
╔════════════════════════════════════════════════════════════════════════════╗
║  Script finalizado com sucesso!                                            ║
║  Documentação reorganizada: /docs vs /docs/deprecated                      ║
╚════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Green
