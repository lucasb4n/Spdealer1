<#
  scripts/check-ps1-encoding.ps1
  Verifica a codificação e procura por BOM (UTF-8 BOM) e caracteres invisíveis problemáticos em arquivos .ps1
  Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-ps1-encoding.ps1 .\scripts\debug-runner.ps1
#>

param(
    [Parameter(Mandatory=$true, ValueFromPipeline=$true)]
    [string[]]$Paths
)

function Check-File {
    param([string]$file)
    if (-not (Test-Path $file)) {
        Write-Host "MISSING: $file" -ForegroundColor Yellow
        return 1
    }

    $bytes = [System.IO.File]::ReadAllBytes($file)
    $len = $bytes.Length
    $hasBom = $false
    if ($len -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $hasBom = $true
    }

    $controlBytes = @()
    for ($i=0; $i -lt $len; $i++) {
        $b = $bytes[$i]
        # allow tab(9), LF(10), CR(13)
        if ($b -lt 32 -and $b -ne 9 -and $b -ne 10 -and $b -ne 13) {
            $controlBytes += $i
        }
    }

    # check for UTF-8 ZERO WIDTH SPACE sequence (E2 80 8B)
    $zwIndexes = @()
    for ($i=0; $i -lt $len-2; $i++) {
        if ($bytes[$i] -eq 0xE2 -and $bytes[$i+1] -eq 0x80 -and $bytes[$i+2] -eq 0x8B) {
            $zwIndexes += $i
        }
    }

    Write-Host "File: $file"
    if ($hasBom) { Write-Host "  -> BOM UTF-8 DETECTADO (EF BB BF). Converter para UTF-8 sem BOM." -ForegroundColor Red } else { Write-Host "  -> BOM: none" -ForegroundColor Green }
    if ($controlBytes.Count -gt 0) { Write-Host "  -> Bytes de controle detectados em offsets: $($controlBytes -join ', ')" -ForegroundColor Red } else { Write-Host "  -> Controle bytes: none" -ForegroundColor Green }
    if ($zwIndexes.Count -gt 0) { Write-Host "  -> Zero-width UTF-8 sequences at offsets: $($zwIndexes -join ', ')" -ForegroundColor Red } else { Write-Host "  -> Zero-width sequences: none" -ForegroundColor Green }

    if ($hasBom -or $controlBytes.Count -gt 0 -or $zwIndexes.Count -gt 0) { return 2 } else { return 0 }
}

$overall = 0
foreach ($p in $Paths) {
    $ret = Check-File -file $p
    if ($ret -gt $overall) { $overall = $ret }
}

exit $overall
