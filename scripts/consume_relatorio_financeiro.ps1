Param(
    [string]$ApiBaseUrl = "http://localhost:8080/api",
    [string]$OutDir = ".\tmp"
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$payloads = @(
    @{ tipo = 'receber'; dataInicial = '2025-12-01'; dataFinal = '2025-12-31'; soEmAberto = $null; soPagos = $null; tipoCobranca = 'CARTAO OUTROS' },
    @{ tipo = 'receber'; dataInicial = '2025-12-01'; dataFinal = '2025-12-31'; soEmAberto = $true; soPagos = $false; tipoCobranca = 'CARTAO OUTROS' },
    @{ tipo = 'receber'; dataInicial = '2025-12-01'; dataFinal = '2025-12-31'; soEmAberto = $false; soPagos = $true; tipoCobranca = 'CARTAO OUTROS' }
)

for ($i = 0; $i -lt $payloads.Count; $i++) {
    $idx = $i + 1
    $payload = $payloads[$i]
    $outFile = Join-Path $OutDir "relatorio_receber_$idx.json"
    $errFile = Join-Path $OutDir "relatorio_receber_$idx.err.txt"

    try {
        Write-Host "POSTing payload #$idx to $ApiBaseUrl/relatorios-jasper/financeiro"
        $body = ConvertTo-Json $payload -Depth 10
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/relatorios-jasper/financeiro" -Method Post -Body $body -ContentType 'application/json'
        $response | ConvertTo-Json -Depth 20 | Out-File -FilePath $outFile -Encoding UTF8
        Write-Host "Saved response -> $outFile"
    } catch {
        $err = $_.Exception.Message + "`n" + $_.Exception.InnerException
        $err | Out-File -FilePath $errFile -Encoding UTF8
        Write-Host "Error calling endpoint. See $errFile"
    }
}

Write-Host "Done. Files in: $OutDir"
