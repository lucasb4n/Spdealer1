Set-Location 'C:\Desenvolvimento\Seprocom\spdealer'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend SPDealer - Modo Desenvolvimento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos Java anteriores
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Tentar Maven primeiro
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "âœ“ Maven encontrado. Compilando e iniciando..." -ForegroundColor Green
    Write-Host ""
    [Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE','dev','Process')
    mvn clean package -DskipTests
    mvn spring-boot:run
} else {
    Write-Host "âœ— Maven nÃ£o encontrado. Procurando JAR em target/..." -ForegroundColor Yellow
    $jar = Get-ChildItem -Path 'C:\Desenvolvimento\Seprocom\spdealer\target' -Filter 'spdealer*.jar' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($jar) { 
        Write-Host "âœ“ JAR encontrado: $($jar.Name)" -ForegroundColor Green
        Write-Host ""
        java -jar $jar.FullName --server.port=8080
    } else { 
        Write-Host "âœ— Nenhum JAR encontrado. Execute: mvn clean package -DskipTests" -ForegroundColor Red
        exit 1 
    }
}
