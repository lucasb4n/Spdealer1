<#
.\run-populate.ps1
Script para aplicar a migration de metadata e popular `dictionary_tables` com defaults.

Uso:
  .\run-populate.ps1 [-Host "100.126.166.63"] [-Port 3306] [-User "root"] [-Pass "k15720"] [-Database "erp"]

Observações:
- Executar em homologação / com backup do banco antes de aplicar em produção.
#>

param(
    [string]$Host = '100.126.166.63',
    [int]$Port = 3306,
    [string]$User = 'root',
    [string]$Pass = 'k15720',
    [string]$Database = 'erp'
)

function Check-Command($name){
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)){
        Write-Error "Comando '$name' não encontrado no PATH. Instale o cliente MySQL e tente novamente.";
        exit 1
    }
}

Check-Command mysql

$baseArgs = "-h $Host -P $Port -u $User -p$Pass $Database"

Write-Host "[1/3] Aplicando migration: V20260117__add_dictionary_tables_menu_and_route.sql"
Get-Content ".\src\refatorado\sql\V20260117__add_dictionary_tables_menu_and_route.sql" -Raw | mysql $baseArgs
if ($LASTEXITCODE -ne 0){ Write-Error "Migration falhou com exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "[2/3] Executando populate: V20260117__populate_dictionary_tables_metadata_fixed.sql"
Get-Content ".\src\refatorado\sql\V20260117__populate_dictionary_tables_metadata_fixed.sql" -Raw | mysql $baseArgs
if ($LASTEXITCODE -ne 0){ Write-Error "Populate falhou com exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "[3/3] Verificando resultado (consulta rápida):"
mysql $baseArgs -e "SELECT id, table_name, display_name, api_path, frontend_route, frontend_component, menu_group, menu_item, default_permissions, template_source FROM dictionary_tables ORDER BY table_name;"
if ($LASTEXITCODE -ne 0){ Write-Warning "A consulta de verificação retornou exit code $LASTEXITCODE" }

Write-Host "Concluído. Revise os resultados acima e, se necessário, ajuste metadados individualmente no DB."
