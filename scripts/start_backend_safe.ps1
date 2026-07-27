<#
.SYNOPSIS
  Inicia o backend (WAR/JAR) de forma segura em background, redirecionando logs e gravando PID.

.DESCRIPTION
  - Cria pastas `logs` e `run` se não existirem.
  - Verifica se já existe um PID ativo em `run\backend.pid` e evita duplicação.
  - Inicia o processo Java com `Start-Process -PassThru`, redireciona stdout/stderr para `logs\server-out.log`.
  - Salva o PID em `run\backend.pid` para permitir parada segura posterior.

.EXAMPLE
    .\start_backend_safe.ps1
    .\start_backend_safe.ps1 -JarPath 'target\spdealer-1.0.0-exec.war' -Port 8080
#>
param(
    [string]$JarPath = 'target\spdealer-1.0.0-exec.war',
    [int]$Port = 8080
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Project root is parent of scripts folder
$projectRoot = (Get-Item -Path (Join-Path $scriptDir '..')).FullName

# Resolve Jar path relative to project root if not absolute
if ([System.IO.Path]::IsPathRooted($JarPath)) {
    $jarFullPath = $JarPath
} else {
    $jarFullPath = Join-Path $projectRoot $JarPath
}

# Criar diretorios se necessario
New-Item -ItemType Directory -Path "$scriptDir\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$scriptDir\run" -Force | Out-Null

$pidFile = Join-Path $scriptDir 'run\backend.pid'
if (Test-Path $pidFile) {
    try {
        $existing = Get-Content $pidFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' }
        if ($existing) {
            $pid = [int]$existing
            if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
                Write-Host "Processo Java já em execução com PID $pid. Pare-o antes de iniciar outro." -ForegroundColor Yellow
                Write-Host "Se tiver certeza, exclua $pidFile e rode novamente." -ForegroundColor Yellow
                exit 1
            } else {
                # arquivo PID presente mas processo não existe - limpar
                Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # ignorar
    }
}

$logFile = Join-Path $scriptDir 'logs\server-out.log'
Write-Host "Iniciando backend: java -jar $jarFullPath --server.port=$Port" -ForegroundColor Cyan

$cmd = 'java -jar "' + $jarFullPath + '" --server.port=' + $Port.ToString() + ' 1>> "' + $logFile + '" 2>>&1'
$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $projectRoot -WindowStyle Minimized -PassThru

if ($proc -and $proc.Id) {
    $proc.Id | Out-File -FilePath $pidFile -Encoding ascii
    Write-Host "Backend iniciado (PID=$($proc.Id)). Logs em: $logFile" -ForegroundColor Green
    Write-Host "Para acompanhar o log em tempo real, abra outro PowerShell e execute:`nGet-Content '$logFile' -Wait -Tail 200" -ForegroundColor DarkCyan
} else {
    Write-Host "Falha ao iniciar o backend." -ForegroundColor Red
}
