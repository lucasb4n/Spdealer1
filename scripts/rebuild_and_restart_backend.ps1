# Para ser executado na raiz do projeto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

$pidFile = Join-Path $scriptDir 'run\backend.pid'
if (Test-Path $pidFile) {
    $backendPid = (Get-Content $pidFile).Trim()
    if ($backendPid -match '^\d+$') {
        $proc = Get-Process -Id $backendPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping process PID $backendPid (Name: $($proc.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        } else {
            Write-Host "No running process with PID $backendPid. Removing stale PID file." -ForegroundColor Yellow
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Write-Host 'Running Maven build (may take a few minutes)...' -ForegroundColor Cyan
# Build from project root (parent of scripts)
$projectRoot = (Get-Item -Path (Join-Path $scriptDir '..')).FullName
Push-Location $projectRoot
try {
    # Prefer mvnw if present
    if (Test-Path (Join-Path $projectRoot 'mvnw.cmd')) {
        & .\mvnw.cmd clean package -DskipTests
    } else {
        mvn clean package -DskipTests
    }
} finally {
    Pop-Location
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Maven build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host 'Maven build succeeded. Starting backend via start_backend_safe.ps1' -ForegroundColor Green
& .\start_backend_safe.ps1

Write-Host 'Done.' -ForegroundColor Green
