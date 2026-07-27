Set-Location 'C:\Desenvolvimento\Seprocom\spdealer'

Write-Host "Backend SPDealer iniciando..." -ForegroundColor Green
Write-Host ""

# Parar Java anterior
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "Compilando e iniciando Backend..." -ForegroundColor Green
    [Environment]::SetEnvironmentVariable('SPRING_PROFILES_ACTIVE','dev','Process')
    mvn clean package -DskipTests
    mvn spring-boot:run
} else {
    Write-Host "Maven nao encontrado. Procurando JAR..." -ForegroundColor Yellow
    $jar = Get-ChildItem -Path 'C:\Desenvolvimento\Seprocom\spdealer\target' -Filter 'spdealer*.jar' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($jar) {
        Write-Host "JAR encontrado: $($jar.Name)" -ForegroundColor Green
        java -jar $jar.FullName --server.port=8080
    } else {
        Write-Host "Nenhum JAR encontrado. Execute: mvn clean package -DskipTests" -ForegroundColor Red
        exit 1
    }
}
