Param(
    [switch]$Push,
    [switch]$ExcludeNodeModules
)

# Simple ASCII-only backup script to avoid parsing issues
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$branch = "backup/$ts"
$tag = "backup-$ts"

Write-Host "Iniciando backup completo: $ts"

if (-not (Test-Path '.git')) {
    Write-Host 'Erro: este diretorio nao parece ser um repositorio git.' -ForegroundColor Red
    exit 1
}

$changes = git status --porcelain
if ($changes) {
    Write-Host 'Ha mudancas nao comitadas - criando commit automatico.' -ForegroundColor Yellow
    git add -A
    git commit -m "backup: auto-commit $ts" | Out-Null
} else {
    Write-Host 'Sem mudancas nao comitadas.' -ForegroundColor Green
}

Write-Host "Criando branch $branch"
git checkout -b $branch

Write-Host "Criando tag $tag"
git tag -a $tag -m "Full backup $ts"

if ($Push) {
    $remotes = git remote
    if ($remotes) {
        Write-Host 'Enviando branch e tag para origin...'
        git push origin $branch
        git push origin $tag
    } else {
        Write-Host 'Nenhum remoto configurado (git remote vazio).' -ForegroundColor Yellow
    }
}

$backupDir = Join-Path -Path '.' -ChildPath 'backups'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$zipPath = Join-Path $backupDir "spdealer-backup-$ts.zip"

if ($ExcludeNodeModules) {
    Write-Host 'Gerando arquivo ZIP excluindo node_modules...'
    # Use robocopy to copy files excluding node_modules into temp folder then zip
    $tmp = Join-Path $env:TEMP "spdealer_backup_$ts"
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
    New-Item -ItemType Directory -Path $tmp | Out-Null
    robocopy . $tmp /MIR /XD node_modules .git backups  > $null
    Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $zipPath -Force
    Remove-Item $tmp -Recurse -Force
} else {
    Write-Host 'Gerando arquivo ZIP com todo o repositorio (inclui .git).'
    Compress-Archive -Path * -DestinationPath $zipPath -Force
}

Write-Host "Backup criado: $zipPath" -ForegroundColor Green
Write-Host ("Branch local: {0}" -f $branch)
Write-Host ("Tag local: {0}" -f $tag)
Write-Host 'Para enviar para o remoto, rode: .\scripts\backup_repo.ps1 -Push' -ForegroundColor Cyan
