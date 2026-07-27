# Instala Apache Maven localmente em tools\apache-maven-3.9.6
$ErrorActionPreference = 'Stop'
$root = Resolve-Path -Path .
$toolsDir = Join-Path $root 'tools'
if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

$url = 'https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip'
$zip = Join-Path $toolsDir 'apache-maven-3.9.6-bin.zip'
Write-Host "Downloading Maven from $url to $zip ..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host 'Extracting archive...'
Expand-Archive -Path $zip -DestinationPath $toolsDir -Force
Remove-Item $zip -Force

$mhome = Join-Path $toolsDir 'apache-maven-3.9.6'
Write-Host "Maven extracted to: $mhome"

# Add bin to PATH for current session
$env:PATH = $env:PATH + ';' + (Join-Path $mhome 'bin')
Write-Host "Maven bin added to PATH for this session: " (Join-Path $mhome 'bin')

# Print mvn version
& (Join-Path $mhome 'bin\mvn.cmd') -v
Write-Host 'Installation script finished.'
