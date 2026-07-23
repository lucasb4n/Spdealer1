# Script temporário: baixa Maven do archive.apache.org e compila o projeto
$projectRoot = Resolve-Path "."
$toolsDir = Join-Path $projectRoot 'tools'
if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }
$MavenVersion = '3.9.6'
$zipName = "apache-maven-$MavenVersion-bin.zip"
$zipPath = Join-Path $toolsDir $zipName
$mavenExtractDir = Join-Path $toolsDir "apache-maven-$MavenVersion"
$mavenUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/$zipName"
Write-Host "Downloading from $mavenUrl"
try { Invoke-WebRequest -Uri $mavenUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 300 } catch { Write-Host "Download failed: $_" -ForegroundColor Red; exit 1 }
Write-Host "Extracting..."
try { Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force } catch { Write-Host "Extract failed: $_" -ForegroundColor Red; exit 1 }
$env:MAVEN_HOME = $mavenExtractDir
$env:PATH = "$mavenExtractDir\bin;" + $env:PATH
Write-Host "Maven home: $env:MAVEN_HOME"
mvn -v
if ($LASTEXITCODE -ne 0) { Write-Host "mvn failed" -ForegroundColor Red; exit 1 }
Write-Host "Running mvn clean package -DskipTests"
cd $projectRoot
mvn clean package -DskipTests
