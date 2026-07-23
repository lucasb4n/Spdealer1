<#
Script: apply_update_prod.ps1
Descrição: Faz backup do banco, executa o script SQL de atualização do menu e verifica o resultado.
ATENÇÃO: Este script contém a senha conforme fornecida. Recomenda-se revisar antes de rodar e executar no servidor de produção com privilégios adequados.
#>

param(
    [string]$Host = '100.126.166.63',
    [string]$User = 'root',
    [string]$Database = 'erp',
    [string]$Password = 'k15720',
    [string]$SqlFile = '.\\scripts\\UPDATE_MENU_ROUTE_FINANCEIRO_CAIXA.sql',
    [string]$BackupDir = 'C:\\backup\\spdealer'
)

Write-Host "[INFO] Iniciando procedimento de update do menu (host=$Host, db=$Database)" -ForegroundColor Cyan

# Criar diretório de backup
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format yyyyMMdd_HHmmss
$backupFile = Join-Path $BackupDir "spdealer_menu_backup_$timestamp.sql"

Write-Host "[INFO] Gerando dump do banco em: $backupFile" -ForegroundColor Yellow
$env:MYSQL_PWD = $Password
try {
    & mysqldump -h $Host -u $User $Database > $backupFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] mysqldump retornou código $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Backup realizado." -ForegroundColor Green

    Write-Host "[INFO] Exibindo registros que serão atualizados (verifique os resultados abaixo):" -ForegroundColor Yellow
    & mysql -h $Host -u $User $Database -e "SELECT id,parentId,codigo,name,route FROM menu_groups WHERE route = '/financeiro/dashboard-fluxo-caixa';"
    & mysql -h $Host -u $User $Database -e "SELECT id,parentId,codigo,name,route FROM menu_items WHERE route = '/financeiro/dashboard-fluxo-caixa';"

    Read-Host -Prompt "Pressione Enter para executar o UPDATE (ou Ctrl+C para cancelar)"

    Write-Host "[INFO] Aplicando script: $SqlFile" -ForegroundColor Yellow
    Get-Content $SqlFile | mysql -h $Host -u $User $Database
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Execução do script retornou código $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }

    Write-Host "[OK] Script aplicado. Conferindo resultados:" -ForegroundColor Green
    & mysql -h $Host -u $User $Database -e "SELECT id,parentId,codigo,name,route FROM menu_groups WHERE route LIKE '/financeiro/%';"
    & mysql -h $Host -u $User $Database -e "SELECT id,parentId,codigo,name,route FROM menu_items WHERE route LIKE '/financeiro/%';"

    Write-Host "[INFO] Operação concluída. Removendo credencial da sessão." -ForegroundColor Cyan
}
finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

Write-Host "[DONE]" -ForegroundColor Green
