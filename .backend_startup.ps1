# Backend startup wrapper
Set-Location 'C:\Desenvolvimento\Seprocom\spdealer\spdealer.01'

# Parar java anterior se houver
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Configurar variÃ¡veis de ambiente
[Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE','dev','Process')

Write-Host '[BACKEND] Iniciando Spring Boot via java -jar' -ForegroundColor Cyan
Write-Host "[BACKEND] JAR: C:\Desenvolvimento\Seprocom\spdealer\spdealer.01\target\spdealer-1.0.0-exec.war" -ForegroundColor Gray

java -Xms256m -Xmx1024m -jar 'C:\Desenvolvimento\Seprocom\spdealer\spdealer.01\target\spdealer-1.0.0-exec.war' --server.port=8080

