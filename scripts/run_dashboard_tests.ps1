# scripts/run_dashboard_tests.ps1
param()

function SafeInvokeGet($url) {
  Write-Host "-> GET $url" -ForegroundColor Cyan
  try {
    $r = Invoke-RestMethod -Uri $url -UseBasicParsing -TimeoutSec 30
    $r | ConvertTo-Json -Depth 6
  } catch {
    $e = $_.Exception
    $resp = $e.Response
    if ($resp -ne $null) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $sr.ReadToEnd(); $sr.Close()
      Write-Host "REQUEST ERROR STATUS: $($resp.StatusCode.value__)" -ForegroundColor Yellow
      Write-Host $body
    } else {
      Write-Host "REQUEST ERROR: $($e.Message)" -ForegroundColor Red
    }
  }
}

function SafeInvokePost($url, $bodyJson) {
  Write-Host "-> POST $url" -ForegroundColor Cyan
  try {
    $r = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $bodyJson -UseBasicParsing -TimeoutSec 60
    $r | ConvertTo-Json -Depth 6
  } catch {
    $e = $_.Exception
    $resp = $e.Response
    if ($resp -ne $null) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $body = $sr.ReadToEnd(); $sr.Close()
      Write-Host "REQUEST ERROR STATUS: $($resp.StatusCode.value__)" -ForegroundColor Yellow
      Write-Host $body
    } else {
      Write-Host "REQUEST ERROR: $($e.Message)" -ForegroundColor Red
    }
  }
}

# MAIN
$base = 'http://localhost:8080'

SafeInvokeGet "$base/api/v2/dashboards/1"

SafeInvokeGet "$base/api/v2/widget/17/data?filial=1"

SafeInvokeGet "$base/api/v2/widget/15/data?filial=1"

$body = '{"parameters":{"filial":1}}'
SafeInvokePost "$base/api/v2/dashboard-builder/queries/15/execute" $body
SafeInvokePost "$base/api/v1/dashboard-queries/15/execute" $body

Write-Host "== TESTS COMPLETED ==" -ForegroundColor Green
