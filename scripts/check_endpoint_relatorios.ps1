try {
    $r = Invoke-RestMethod 'http://localhost:8080/api/relatorios/departamentos' -Method Get -TimeoutSec 10
    Write-Host 'OK'
    $r | ConvertTo-Json -Depth 5
} catch {
    $e = $_.Exception
    Write-Host 'Error:' $e.Message
}