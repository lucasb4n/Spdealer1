Set-Location 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01'
Write-Host '>>> Backend: iniciando com WAR compilado (logs em server.log/server.err)' -ForegroundColor Green
Write-Host '>>> Parando qualquer processo Java anterior...'
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$logPath = 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01\server.log'
$errPath = 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01\server.err'

# Garantir que os arquivos de log existam e sejam truncados
'' | Out-File -FilePath $logPath -Encoding UTF8 -Force
'' | Out-File -FilePath $errPath -Encoding UTF8 -Force

Write-Host ">>> Logs: $logPath (stdout), $errPath (stderr)" -ForegroundColor DarkGray

if (Test-Path 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01\target\spdealer-1.0.0.war') {
  Write-Host 'Executando: java -jar target/spdealer-1.0.0.war --server.port=8080' -ForegroundColor Cyan
  # Iniciar processo Java gravando no log e exibindo na tela em tempo real
  java -jar target/spdealer-1.0.0.war --spring.profiles.active=dev --server.port=8080 2>&1 | Tee-Object -FilePath $logPath
} else {
  Write-Host 'WAR nao encontrado em target/spdealer-1.0.0.war' -ForegroundColor Red
  exit 1
}
