$ErrorActionPreference = 'Stop'
try {
  $r = Invoke-RestMethod 'http://localhost:8080/api/relatorios/departamentos' -TimeoutSec 10
  Write-Host 'RESPONSE_OK'
  $r | ConvertTo-Json -Depth 5
} catch {
  Write-Host 'EXCEPTION'
  $_ | Format-List * -Force
}
Get-Content .\scripts\logs\server-out.log -Tail 160
