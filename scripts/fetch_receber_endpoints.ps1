$urls = @(
  'http://localhost:8080/api/relatorios/receber/2025-12-17',
  'http://localhost:8080/api/relatorios/contas-receber/2025-12-17',
  'http://localhost:8080/api/relatorios/contas-a-receber/2025-12-17',
  'http://localhost:8080/api/receber?dt=2025-12-17',
  'http://localhost:8080/api/v2/receber/2025-12-17',
  'http://localhost:8080/api/v2/relatorios/receber/2025-12-17'
)
$outFile = 'docs/screenshots/receber_api_20251217.json'

foreach ($u in $urls) {
  try {
    Write-Host "Trying: $u"
    $r = Invoke-RestMethod -Uri $u -Method Get -ErrorAction Stop
    $r | ConvertTo-Json -Depth 10 | Out-File -FilePath $outFile -Encoding utf8
    Write-Host "OK: $u -> $outFile"
    exit 0
  } catch {
    Write-Host "ERR: $u -> $($_.Exception.Message)"
  }
}
Write-Host "No endpoint returned valid JSON."
exit 1
