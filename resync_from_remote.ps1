<#
resync_from_remote.ps1
Script para uso na máquina do desenvolvedor para alinhar o clone local com o remoto
Sem push: cria backup local (opcional) e sobrescreve o working tree com origin/main
#>

function Confirm-YesNo($msg, $defaultYes=$true) {
    $yn = Read-Host "$msg [$([string](if ($defaultYes) { 'Y/n' } else { 'y/N' }))]"
    if ([string]::IsNullOrWhiteSpace($yn)) { return $defaultYes }
    return ($yn.Trim().ToLower().StartsWith('y'))
}

Write-Host "=== RESYNC FROM REMOTE (NO PUSH) ===" -ForegroundColor Cyan
Write-Host "Local: $PWD" -ForegroundColor DarkCyan
Write-Host "AVISO: Este script pode sobrescrever o working tree local. Faça backup se necessário." -ForegroundColor Yellow

# Mostrar status rápido
Write-Host "\n--- git status (resumo) ---" -ForegroundColor Green
git status --porcelain | ForEach-Object { Write-Host $_ }

# Perguntar sobre backup local
if (Confirm-YesNo "Deseja criar um branch de backup local (salva alterações atuais, sem push)?" $true) {
    $ts = Get-Date -Format "yyyyMMdd-HHmm"
    $bak = "backup-local-$ts"
    Write-Host "Criando branch local '$bak' e commitando alterações..." -ForegroundColor Green
    git checkout -b $bak
    git add -A
    git commit -m "wip: local backup before resync ($env:USERNAME) $ts" --allow-empty
    Write-Host "Backup criado em branch: $bak" -ForegroundColor Cyan
} else {
    if (Confirm-YesNo "Deseja fazer stash das alterações (salva em stash)?" $true) {
        git stash push -m "WIP backup before resync ($env:USERNAME)"
        Write-Host "Alterações guardadas com git stash." -ForegroundColor Cyan
    } else {
        Write-Host "Nenhum backup feito. Procedendo com cuidado." -ForegroundColor Yellow
    }
}

# Buscar remoto
Write-Host "\nBuscando dados do remoto..." -ForegroundColor Green
git fetch --all --tags

# Garantir branch main local e trocar para ela
if (git show-ref --verify --quiet refs/heads/main) {
    Write-Host "Checkout para branch local 'main'..." -ForegroundColor Green
    git checkout main
} else {
    Write-Host "Branch 'main' não existe localmente. Criando a partir de origin/main..." -ForegroundColor Green
    git checkout -b main origin/main
}

# Reset hard para origin/main
Write-Host "Resetando working tree para origin/main (hard)..." -ForegroundColor Yellow
git reset --hard origin/main

git fetch --prune

# Configurar core.excludesfile local apontando para git_excludes.txt do repo
$exfile = Join-Path $PWD "git_excludes.txt"
if (Test-Path $exfile) {
    git config core.excludesfile "$exfile"
    Write-Host "core.excludesfile configurado para: $exfile" -ForegroundColor Cyan
} else {
    Write-Host "Arquivo git_excludes.txt não encontrado no repositório. Pule a configuração local do excludes." -ForegroundColor Yellow
}

Write-Host "\n--- Resultado final (git status) ---" -ForegroundColor Green
git status --porcelain
Write-Host "\nRESYNC concluído. Nenhum push foi executado." -ForegroundColor Cyan
Write-Host "Se precisar restaurar o backup local, troque para o branch 'backup-local-*' criado." -ForegroundColor Cyan

# Fim do script

