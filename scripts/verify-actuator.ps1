<#
PowerShell quick verifier for Actuator endpoints (public and backend).
Edit `$publicUrl` and `$backendHost` as needed.

Usage: .\verify-actuator.ps1
#>

$publicUrl = "https://spdealer.seprocom.com.br/api/healthz"   # exemplo public path -> mapear para /spdealer/actuator/health via nginx
$backendHost = "http://192.168.10.70:8080/spdealer"          # backend direto

Write-Host "Verificando endpoint público: $publicUrl" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri $publicUrl -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    Write-Host $r.Content
} catch {
    Write-Warning "Falha ao acessar $publicUrl : $($_.Exception.Message)"
}

Write-Host "\nVerificando backend direto: $backendHost/actuator/health" -ForegroundColor Cyan
try {
    $r2 = Invoke-WebRequest -Uri "$backendHost/actuator/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($r2.StatusCode)" -ForegroundColor Green
    Write-Host $r2.Content
} catch {
    Write-Warning "Falha ao acessar $backendHost/actuator/health : $($_.Exception.Message)"
}

Write-Host "\nVerificação concluída." -ForegroundColor Green
