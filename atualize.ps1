<#
.SYNOPSIS
  Atualiza arquivos específicos do repositório a partir de uma branch remota.

.DESCRIPTION
  Busca no remote e faz checkout apenas dos caminhos que batem com o padrão informado.
  Uso típico: .\atualize.ps1 'ParametrosG*'  # atualiza todos os arquivos cujo nome contém ParametrosG

.PARAMETER Pattern
  Padrão (wildcard) para corresponder nomes de arquivos. Use aspas simples se houver caracteres especiais.

.PARAMETER Branch
  Branch remota a partir da qual os arquivos serão extraídos. Padrão: 'origin/main'

.PARAMETER Force
  Se especificado, força a substituição (sobrescreve alterações locais nesses arquivos).

EXEMPLOS
  .\atualize.ps1 'ParametrosG*'
  .\atualize.ps1 'ParametrosG*' -Branch 'origin/tmp/commit-params-20260115-204700' -Force
#>

param(
    [Parameter(Mandatory=$true,Position=0)]
    [string]$Pattern,

    [Parameter(Mandatory=$false,Position=1)]
    [string]$Branch = '',

    [switch]
    [bool]$Force = $true
)

function Abort($msg){ Write-Error $msg; exit 1 }

# ensure we are in a git repo
try{
    $root = git rev-parse --show-toplevel 2>$null
} catch {
    Abort "Este diretório não é um repositório git. Entre na raiz do repositório e execute novamente."
}
if (-not $root) { Abort "Não foi possível determinar a raiz do repositório." }
Set-Location $root

Write-Output "[atualize.ps1] Repo root: $root"

# detecta branch padrão do remote se não fornecida
if (-not $Branch) {
  Write-Output "[atualize.ps1] Detectando branch padrão do remote..."
  $default = git ls-remote --symref origin HEAD 2>$null | Select-String 'ref: refs/heads/' | ForEach-Object { ($_ -match 'refs/heads/(.+)$') | Out-Null; $matches[1] } 
  if (-not $default) { $default = 'main' }
  $Branch = "origin/$default"
}

Write-Output "[atualize.ps1] Pattern: $Pattern  Branch: $Branch  Force: $Force"

# fetch remoto (garante HEAD mais recente)
Write-Output "[atualize.ps1] Fazendo git fetch --prune..."
$fetch = git fetch origin --prune 2>&1
if ($LASTEXITCODE -ne 0) { Write-Output $fetch; Abort "git fetch falhou. Verifique autenticação/remote." }

# confirmar branch remota existe
git show-ref --verify --quiet "refs/remotes/$Branch"
if ($LASTEXITCODE -ne 0) { Abort "Branch remota '$Branch' não encontrada." }

# listar arquivos da branch remota
Write-Output "[atualize.ps1] Listando arquivos em $Branch..."
$all = git ls-tree -r --name-only $Branch 2>$null
if ($LASTEXITCODE -ne 0) { Abort "git ls-tree falhou." }

# filtrar pelo pattern (PowerShell -like usa wildcard '*')
$matched = @()
foreach ($p in $all) {
    # extrai apenas o nome do arquivo para comparar se necessário, mas aceitamos qualquer parte do path
    $name = [System.IO.Path]::GetFileName($p)
    if ($name -like $Pattern -or $p -like $Pattern) { $matched += $p }
}

if (-not $matched -or $matched.Count -eq 0) {
    Write-Output "Nenhum arquivo correspondente ao padrão '$Pattern' em $Branch"
    exit 0
}

Write-Output "Arquivos encontrados ($($matched.Count)):`n$($matched -join "`n")"

# executar checkout/restore
foreach ($f in $matched) {
    if ($Force) {
        Write-Output "[force] restaurando: $f"
        git restore --source=$Branch --worktree -- "$f" 2>&1 | Write-Output
        git restore --source=$Branch --staged -- "$f" 2>&1 | Write-Output
    } else {
        Write-Output "[safe] fazendo checkout: $f"
        git checkout $Branch -- "$f" 2>&1 | Write-Output
    }
}

Write-Output "[atualize.ps1] Concluído. Revise, teste e comite se desejar."
