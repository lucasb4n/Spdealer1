# Test script: aguarda actuator/health UP e testa endpoints de widget
$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    try {
        $h = Invoke-RestMethod -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 5
        if ($h.status -eq 'UP') { Write-Host "Service UP" -ForegroundColor Green; break }
    } catch { }
    Start-Sleep -Seconds 3
}
if ((Get-Date) -ge $deadline) { Write-Host 'Timeout aguardando health UP (120s) - tentando mesmo assim' -ForegroundColor Yellow }

function TryRequest($url) {
    Write-Host "== TEST: $url ==" -ForegroundColor Cyan
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
        Write-Host "STATUS: $($r.StatusCode) $($r.StatusDescription)"
        Write-Host $r.Content
    } catch {
        $err = $_.Exception
        $resp = $err.Response
        if ($resp -ne $null) {
            $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $sr.ReadToEnd(); $sr.Close()
            Write-Host "REQUEST ERROR STATUS: $($resp.StatusCode.value__)"
            Write-Host "BODY:`n$body"
        } else {
            Write-Host "REQUEST ERROR: $($err.Message)"
        }
    }
}

TryRequest 'http://localhost:8080/api/v2/widget/17/data?filial=1'
TryRequest 'http://localhost:8080/api/v2/widget/15/data?filial=1'
Write-Host '== TEST COMPLETED ==' -ForegroundColor Green
