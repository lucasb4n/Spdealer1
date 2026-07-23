<#
start_system_shim.ps1

Minimal shim that forwards to `start_system_dev.ps1` when mode 2 is requested.
Use this if `start_system.ps1` is corrupted. This file is intentionally
simple and safe.
#>

param(
    [string]$Mode = ''
)

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    Set-Location $scriptDir

    if ($Mode -eq '2' -or $Mode -eq 'dev') {
        $devScript = Join-Path $scriptDir 'start_system_dev.ps1'
        if (Test-Path $devScript) {
            Write-Host "[start_system_shim] Invocando: $devScript"
            & powershell -NoProfile -ExecutionPolicy Bypass -File $devScript
            exit $LASTEXITCODE
        } else {
            Write-Host "[start_system_shim] ERRO: start_system_dev.ps1 nao encontrado em: $scriptDir" -ForegroundColor Red
            exit 1
        }
    }

    Write-Host "Uso: .\start_system_shim.ps1 2    # 2 = modo desenvolvimento" -ForegroundColor Cyan
    exit 0
} catch {
    Write-Host "Excecao: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
