Set-Location 'C:\Desenvolvimento\Seprocom\spdealer'
try {
  $url = 'http://localhost:8080/relatorios/consulta-caixa?dataInicial=2025-12-01&dataFinal=2025-12-17'
  Write-Host "Calling: $url"
  $r = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
  $json = $r | ConvertTo-Json -Depth 6
  Write-Output $json
} catch {
  Write-Host 'ERROR calling endpoint:'
  Write-Host $_.Exception.Message
}
