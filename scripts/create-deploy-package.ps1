# Cria um pacote de deploy local para SPDealer
# Local: workspace root
# Saida: ./deploy-package

Param()

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
# Assume script is in ./scripts, move one level up to repository root
$root = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $root

Write-Host "[1/6] Limpando/criando pasta deploy-package..."
if (Test-Path .\deploy-package) { Remove-Item .\deploy-package -Recurse -Force }
New-Item -ItemType Directory -Path .\deploy-package | Out-Null

Write-Host "[2/6] Copiando JAR gerado (target\spdealer-1.0.0.jar)..."
$jarPath = Join-Path $root "target\spdealer-1.0.0.jar"
if (-Not (Test-Path $jarPath)) { Write-Error "JAR não encontrado em $jarPath. Execute mvn clean package antes."; exit 1 }
Copy-Item $jarPath .\deploy-package\

Write-Host "[3/6] Copiando build estático (build\ -> deploy-package\static) ..."
$buildDir = Join-Path $root "build"
if (-Not (Test-Path $buildDir)) { Write-Error "Pasta build/ não encontrada. Execute npm run build antes."; exit 1 }
New-Item -ItemType Directory -Path .\deploy-package\static | Out-Null
Copy-Item (Join-Path $buildDir '*') .\deploy-package\static -Recurse -Force

Write-Host "[4/6] Copiando application-prod.properties de src/main/resources (se existir) ..."
$srcProps = Join-Path $root "src\main\resources\application-prod.properties"
if (Test-Path $srcProps) {
    Copy-Item $srcProps .\deploy-package\
} else {
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
    Write-Host "Arquivo application-prod.properties não existe em src/main/resources — vou criar um com configurações padrão conforme o guia."
    @'
# Configuração de Produção - SEPROCOM
# Servidor: 192.168.10.70
# Banco: 100.126.166.63:3306/erp

server.port=8080
server.servlet.context-path=/spdealer
# Cria um pacote de deploy local para SPDealer
# Local: workspace root
# Saida: ./deploy-package

Param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host "[1/6] Limpando/criando pasta deploy-package..."
if (Test-Path .\deploy-package) { Remove-Item .\deploy-package -Recurse -Force }
New-Item -ItemType Directory -Path .\deploy-package | Out-Null

Write-Host "[2/6] Copiando JAR gerado (target\spdealer-1.0.0.jar)..."
$jarPath = Join-Path $root "target\spdealer-1.0.0.jar"
if (-Not (Test-Path $jarPath)) { Write-Error "JAR não encontrado em $jarPath. Execute mvn clean package antes."; exit 1 }
Copy-Item $jarPath .\deploy-package\

Write-Host "[3/6] Copiando build estático (build\ -> deploy-package\static) ..."
$buildDir = Join-Path $root "build"
if (-Not (Test-Path $buildDir)) { Write-Error "Pasta build/ não encontrada. Execute npm run build antes."; exit 1 }
New-Item -ItemType Directory -Path .\deploy-package\static | Out-Null
Copy-Item (Join-Path $buildDir '*') .\deploy-package\static -Recurse -Force

Write-Host "[4/6] Copiando application-prod.properties de src/main/resources (se existir) ..."
$srcProps = Join-Path $root "src\main\resources\application-prod.properties"
if (Test-Path $srcProps) {
    Copy-Item $srcProps .\deploy-package\
} else {
    Write-Host "Arquivo application-prod.properties não existe em src/main/resources — vou criar um com configurações padrão conforme o guia."
    @'
# Configuração de Produção - SEPROCOM
# Servidor: 192.168.10.70
# Banco: 100.126.166.63:3306/erp

server.port=8080
server.servlet.context-path=/spdealer
spring.application.name=spdealer

# Database
spring.datasource.url=jdbc:mysql://100.126.166.63:3306/erp?useSSL=false&serverTimezone=America/Sao_Paulo&allowPublicKeyRetrieval=true
spring.datasource.username=spdealer_user
spring.datasource.password=SpD3al3r@2025!
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDB103Dialect

# Logging
logging.level.root=INFO
logging.level.br.com.spdealer=INFO
logging.file.name=/opt/tomcat/logs/spdealer.log
logging.file.max-size=10MB
logging.file.max-history=30

# Pool de Conexão
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000

# Profile
spring.profiles.active=prod
'@ | Out-File -FilePath .\deploy-package\application-prod.properties -Encoding UTF8
}

Write-Host "[5/6] Listando conteúdo do deploy-package..."
Get-ChildItem .\deploy-package -Recurse | ForEach-Object { Write-Host $_.FullName }

Write-Host "[6/6] Pacote de deploy criado em: $(Resolve-Path .\deploy-package)"
Write-Host "Próximo passo: transferir .\deploy-package para o servidor de produção (scp/WinSCP)."

Exit 0
