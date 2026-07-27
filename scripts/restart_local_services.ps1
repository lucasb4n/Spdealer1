# Reinicia backend e frontend ligados ao projeto (para execução na raiz do repo)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir
$projectRoot = (Get-Item -Path (Join-Path $scriptDir '..')).FullName

Write-Host "Project root: $projectRoot"

# Stop backend via PID file
$pidFile = Join-Path $scriptDir 'run\backend.pid'
if (Test-Path $pidFile) {
    $backendPid = (Get-Content $pidFile).Trim()
    if ($backendPid -match '^\d+$') {
        $proc = Get-Process -Id $backendPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping backend PID $backendPid" -ForegroundColor Yellow
            Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Kill any java.exe processes that reference the project path
try {
    $javaProcs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'java.exe' -and $_.CommandLine -and $_.CommandLine -match [regex]::Escape($projectRoot) }
    foreach ($p in $javaProcs) {
        Write-Host "Killing java process ID $($p.ProcessId) (commandline matched project)" -ForegroundColor Yellow
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}

# Kill node processes that reference the project path (frontend)
try {
    $nodeProcs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node.exe' -and $_.CommandLine -and $_.CommandLine -match [regex]::Escape($projectRoot) }
    foreach ($p in $nodeProcs) {
        Write-Host "Killing node process ID $($p.ProcessId) (frontend)" -ForegroundColor Yellow
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}

Start-Sleep -Milliseconds 500

# Start backend (safe script will write new PID)
Write-Host "Starting backend..." -ForegroundColor Cyan
& .\start_backend_safe.ps1

# Start frontend (opens new PowerShell window)
Write-Host "Starting frontend..." -ForegroundColor Cyan
& .\start_frontend_safe.ps1

Write-Host "Restart complete. Backend logs: scripts\logs\server-out.log" -ForegroundColor Green
