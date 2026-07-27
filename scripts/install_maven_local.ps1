# Instalação local do Apache Maven em tools/ e execução do build
param(
    [string]$ProjectRoot = "$(Get-Location)",
    [string]$MavenVersion = '3.9.4'
)

$projectRoot = Resolve-Path $ProjectRoot
$toolsDir = Join-Path $projectRoot 'tools'
if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

$zipName = "apache-maven-$MavenVersion-bin.zip"
$zipPath = Join-Path $toolsDir $zipName
$mavenExtractDir = Join-Path $toolsDir "apache-maven-$MavenVersion"

# URL oficial Apache (CDN)
$mavenUrl = "https://dlcdn.apache.org/maven/maven-3/$MavenVersion/binaries/$zipName"

Write-Host "Project root: $projectRoot"
Write-Host "Tools dir: $toolsDir"

if (-not (Test-Path $mavenExtractDir)) {
    if (-not (Test-Path $zipPath)) {
        Write-Host "Baixando Maven $MavenVersion..." -ForegroundColor Cyan
        try {
            Invoke-WebRequest -Uri $mavenUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 120
        } catch {
            Write-Host "Falha ao baixar Maven: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Arquivo zip do Maven já existe: $zipPath"
    }

    Write-Host "Extraindo $zipPath para $toolsDir..." -ForegroundColor Cyan
    try {
        Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    } catch {
        Write-Host "Falha ao extrair: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Maven já extraído em: $mavenExtractDir" -ForegroundColor Green
}

# Ajustar variáveis de ambiente somente para sessão atual
$env:MAVEN_HOME = $mavenExtractDir
$env:PATH = "$mavenExtractDir\bin;" + $env:PATH

Write-Host "Maven instalado em: $env:MAVEN_HOME" -ForegroundColor Green
Write-Host "Versão do Maven:"
mvn -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao executar mvn - verifique Java e PATH." -ForegroundColor Red
    exit 1
}

# Executar build e restart via script existente
Write-Host "Executando rebuild_and_restart_backend.ps1..." -ForegroundColor Cyan
$script = Join-Path $projectRoot 'scripts\rebuild_and_restart_backend.ps1'
if (Test-Path $script) {
    & powershell -ExecutionPolicy Bypass -File $script
    exit $LASTEXITCODE
} else {
    Write-Host "Script rebuild_and_restart_backend.ps1 não encontrado." -ForegroundColor Red
    exit 1
}
