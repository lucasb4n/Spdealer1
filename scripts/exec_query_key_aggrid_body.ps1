Write-Host 'POST /api/v1/dashboard-queries/key/aggrid_saldo_caixa/execute with {} body'
$body = '{}' 
try {
    $res = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/dashboard-queries/key/aggrid_saldo_caixa/execute' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing
    $res | ConvertTo-Json -Depth 6 | Write-Host
} catch {
    $err = $_.Exception
    $resp = $err.Response
    if ($resp -ne $null) {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $sr.ReadToEnd(); $sr.Close();
        Write-Host "REQUEST ERROR STATUS: $($resp.StatusCode.value__)"
        Write-Host "BODY:`n$body"
    } else {
        Write-Host "REQUEST ERROR: $($err.Message)"
    }
}
