<#
.SYNOPSIS
  Deploy do WAR do SPDealer para um Tomcat remoto via SCP/SSH.

.DESCRIPTION
  Suporta dois ambientes:
  - DEV: 192.168.10.70, banco erp (teste)
  - PROD: 100.126.166.63, banco erp (produção)
  
  O script compila o projeto com Maven e faz deploy do WAR.

  Para DEV:   .\deploy.ps1 -D DEV   (ou -Ambiente DEV)
  Para PROD:  .\deploy.ps1 -P PROD  (ou -Ambiente PROD)

.EXAMPLE
  .\deploy.ps1 -D DEV
  .\deploy.ps1 -P PROD
  .\deploy.ps1 -Ambiente PROD

#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("DEV", "PROD")]
    [Alias("D", "P")]
    [string]$Ambiente = "PROD",
    
    [string]$RemoteUser = "root",
    [string]$RemoteTomcatWebapps = "/usr/local/tomcat10/webapps",
    [int]$SshPort = 22,
    [int]$SshTimeoutSec = 30,
    [switch]$SkipCompile,
    [switch]$SkipDeploy
)

# Configurações por ambiente
$config = @{
    DEV = @{
        Host = "100.116.217.83"
        WarName = "spdealer_test.war"
        Profile = "prod"
        Servico = "spdealer.service"
        CORS = "http://100.116.217.83:3000,http://100.116.217.83:5070"
    }
    PROD = @{
        Host = "100.116.217.83"
        WarName = "spdealer.war"
        Profile = "prod"
        Servico = "spdealer.service"
        CORS = "https://spdealer.seprocom.com.br"
    }
}

$cfg = $config[$Ambiente]
$RemoteHost = $cfg.Host
$warName = $cfg.WarName
$profile = $cfg.Profile
$servico = $cfg.Servico

# Comandos nativos ou PuTTY
$ScpCmd = "pscp"
$SshCmd = "plink"
$RemotePw = "k15720"
$HostKey = "ssh-ed25519 255 SHA256:7QTt4U5Npd0PbJnhwB48FBjvpN/eXtP1bs5Woiit6kg"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AMBIENTE: $Ambiente" -ForegroundColor Cyan
Write-Host "  Servidor: $RemoteHost" -ForegroundColor Cyan
Write-Host "  WAR: $warName" -ForegroundColor Cyan
Write-Host "  Profile: $profile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function AbortIfError($code, $msg) {
    if ($code -ne 0) {
        Write-Error $msg
        exit $code
    }
}

# ============================================================================
# PASSO 1: Compilar projeto com Maven
# ============================================================================

if (-not $SkipCompile) {
    Write-Output "=============================================="
    Write-Output "PASSO 1: Compilando projeto com Maven..."
    Write-Output "=============================================="
    
    # Configurar Maven local para garantir consistência e evitar conflito de variáveis
    $localMvnDir = Join-Path $PSScriptRoot "tools\maven_extracted\apache-maven-3.9.6"
    if (-not (Test-Path $localMvnDir)) {
        $localMvnDir = Join-Path $PSScriptRoot "tools\apache-maven-3.9.6"
    }
    if (-not (Test-Path $localMvnDir)) {
        $localMvnDir = Join-Path $PSScriptRoot "tools\apache-maven-3.9.4"
    }
    
    if (Test-Path $localMvnDir) {
        $resolvedMvnPath = (Resolve-Path $localMvnDir).Path
        $env:MAVEN_HOME = $resolvedMvnPath
        $env:M2_HOME = $resolvedMvnPath
        $env:PATH = "$(Join-Path $resolvedMvnPath 'bin');$env:PATH"
        Write-Output "Configurado Maven local: MAVEN_HOME=$env:MAVEN_HOME"
    } else {
        Write-Warning "Aviso: Maven local não encontrado em .\tools. Utilizando o ambiente global padrão."
    }
    
    # Modificar temporariamente a homepage no package.json e as variaveis no .env
    $packageJsonPath = Join-Path $PSScriptRoot "package.json"
    $origPackageJson = Get-Content -Raw -Path $packageJsonPath
    
    $envPath = Join-Path $PSScriptRoot ".env"
    $origEnv = Get-Content -Raw -Path $envPath
    
    try {
        if ($Ambiente -eq "DEV") {
            $targetHomepage = "/spdealer_test/"
            $targetApiUrl = "/spdealer_test/api"
        } else {
            $targetHomepage = "/spdealer/"
            $targetApiUrl = "/spdealer/api"
        }
        
        $updatedPackageJson = $origPackageJson -replace '"homepage":\s*"[^"]*"', ('"homepage": "' + $targetHomepage + '"')
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($packageJsonPath, $updatedPackageJson, $utf8NoBom)
        Write-Output "Configurada homepage temporaria no package.json: $targetHomepage"

        $updatedEnv = $origEnv -replace 'REACT_APP_API_URL=[^\r\n]*', ("REACT_APP_API_URL=" + $targetApiUrl)
        [System.IO.File]::WriteAllText($envPath, $updatedEnv, $utf8NoBom)
        Write-Output "Configurado REACT_APP_API_URL temporario no .env: $targetApiUrl"

        $mvnCmd = "mvn clean package -DskipTests -P$profile"
        Write-Output "Executando: $mvnCmd"
        
        Invoke-Expression $mvnCmd
        $mvnExitCode = $LASTEXITCODE
        
        if ($mvnExitCode -ne 0) {
            Write-Error "FALHA NA COMPILAÇÃO! Verifique os erros acima."
            Write-Error "Deploy cancelado devido a erros de compilação."
            exit $mvnExitCode
        }
        
        Write-Host "Compilação concluída com sucesso!" -ForegroundColor Green
    } finally {
        # Restaurar package.json e .env originais
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($packageJsonPath, $origPackageJson, $utf8NoBom)
        Write-Output "Restaurado package.json original"
        
        [System.IO.File]::WriteAllText($envPath, $origEnv, $utf8NoBom)
        Write-Output "Restaurado .env original"
    }
} else {
    Write-Output "=============================================="
    Write-Output "PASSO 1: Compilação ignorada (-SkipCompile)"
    Write-Output "=============================================="
}

# ============================================================================
# PASSO 2: Verificar/Criar WAR
# ============================================================================

Write-Output "=============================================="
Write-Output "PASSO 2: Preparando WAR..."
Write-Output "=============================================="

$warFiles = Get-ChildItem -Path .\target -Filter "spdealer*.war" | Sort-Object LastWriteTime -Descending
if ($warFiles.Count -eq 0) {
    Write-Error "Nenhum WAR encontrado em .\target"
    exit 1
}

$localWarBase = $warFiles[0].FullName
$localWar = Join-Path (Split-Path $localWarBase -Parent) $warName

# Copiar para nome correto
Copy-Item $localWarBase $localWar -Force
Write-Host "WAR preparado: $localWar" -ForegroundColor Green

if ($SkipDeploy) {
    Write-Output "=============================================="
    Write-Output "Deploy ignorado (-SkipDeploy)"
    Write-Output "=============================================="
    Write-Output "WAR disponível em: $localWar"
    exit 0
}

# ============================================================================
# PASSO 3: Deploy para servidor remoto com Posh-SSH
# ============================================================================

Write-Output "=============================================="
Write-Output "PASSO 3: Deploy para servidor remoto..."
Write-Output "=============================================="

Import-Module Posh-SSH -ErrorAction Stop

$timestampStr = Get-Date -Format "yyyyMMddHHmmss"
$remoteTmp = "/tmp/" + $warName + "." + $timestampStr

$securePw = ConvertTo-SecureString $RemotePw -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($RemoteUser, $securePw)

Write-Output "Conectando via SSH a $RemoteHost como $RemoteUser..."
try {
    $sshSession = New-SSHSession -ComputerName $RemoteHost -Credential $cred -Port $SshPort -AcceptKey -ErrorAction Stop
} catch {
    AbortIfError 1 "Falha ao estabelecer conexão SSH: $_"
}

Write-Output "Copiando $localWar para o servidor remoto em $remoteTmp..."
try {
    Set-SCPItem -ComputerName $RemoteHost -Credential $cred -Port $SshPort -Path $localWar -Destination "/tmp" -NewName ($warName + "." + $timestampStr) -AcceptKey -ErrorAction Stop
} catch {
    Remove-SSHSession -SessionId $sshSession.SessionId -ErrorAction SilentlyContinue
    AbortIfError 1 "SCP falhou no envio do WAR: $_"
}

# Remote bash script
$remoteTemplate = @'
set -e
echo "Parando serviço {SERVICO} (se existir)..."
systemctl stop {SERVICO} || true

timestamp=$(date +%Y%m%d%H%M%S)
WEBAPPS="{WEBAPPS}"
WARNAME="{WARNAME}"

# Backup antigo
if [ -f "{WEBAPPS}/{WARNAME}" ]; then
  mv "{WEBAPPS}/{WARNAME}" "{WEBAPPS}/{WARNAME}.bak.$timestamp"
  echo "WAR antigo movido para backup"
fi
# Limpeza do contexto para evitar arquivos corrompidos
echo "Limpando aplicação {WARFOLDER} antiga..."
rm -rf "$WEBAPPS/{WARFOLDER}"
rm -f "$WEBAPPS/{WARNAME}"

echo "Limpando pastas temporárias (temp e work)..."
rm -rf /usr/local/tomcat10/temp/*
rm -rf /usr/local/tomcat10/work/*

echo "Movendo novo WAR para webapps..."
mv "{REMOTE_TMP}" "{WEBAPPS}/{WARNAME}"

echo "Definindo permissões (tentativa: tomcat:tomcat)..."
chown -R tomcat:tomcat "{WEBAPPS}/{WARNAME}" || true

echo "Iniciando serviço {SERVICO}..."
systemctl start {SERVICO} || { 
    echo "Falha ao iniciar {SERVICO}, tentando iniciar Tomcat diretamente..."
    if [ -f /usr/local/tomcat10/bin/startup.sh ]; then
        /usr/local/tomcat10/bin/shutdown.sh 2>/dev/null || true
        sleep 2
        /usr/local/tomcat10/bin/startup.sh
    fi
}

echo "Aguardando 8 segundos para Tomcat explodir WAR..."
sleep 8

echo "Estado do Tomcat:"
if [ -f /usr/local/tomcat10/logs/catalina.out ]; then
    echo "--- Últimas 50 linhas de catalina.out ---"
    tail -n 50 /usr/local/tomcat10/logs/catalina.out
fi

echo "Deploy remoto concluído com sucesso"
exit 0
'@

$warFolder = $warName -replace '\.war$', ''
$remoteCmd = $remoteTemplate -replace '\{SERVICO\}', $servico
$remoteCmd = $remoteCmd -replace '\{WEBAPPS\}', $RemoteTomcatWebapps
$remoteCmd = $remoteCmd -replace '\{WARNAME\}', $warName
$remoteCmd = $remoteCmd -replace '\{WARFOLDER\}', $warFolder
$remoteCmd = $remoteCmd -replace '\{REMOTE_TMP\}', $remoteTmp

$localRemoteScript = Join-Path $env:TEMP "spdealer-deploy-remote.sh.$timestampStr"
# Write with LF-only (Unix line endings) to avoid bash errors on remote Linux
[System.IO.File]::WriteAllText($localRemoteScript, ($remoteCmd -replace "`r\n", "`n"))

$sharedScriptSuffix = $timestampStr
$remoteScriptPath = "/tmp/spdealer-deploy-remote.sh." + $sharedScriptSuffix

Write-Output "Copiando script remoto para $remoteScriptPath..."
try {
    Set-SCPItem -ComputerName $RemoteHost -Credential $cred -Port $SshPort -Path $localRemoteScript -Destination "/tmp" -NewName ("spdealer-deploy-remote.sh." + $sharedScriptSuffix) -AcceptKey -ErrorAction Stop
} catch {
    Remove-SSHSession -SessionId $sshSession.SessionId -ErrorAction SilentlyContinue
    AbortIfError 1 "SCP falhou no envio do script remoto: $_"
}

Write-Output "Executando script remoto..."
$exitCode = 0
try {
    $result = Invoke-SSHCommand -SessionId $sshSession.SessionId -Command "bash $remoteScriptPath" -ErrorAction Stop
    $result.Output | ForEach-Object { Write-Output $_ }
    $exitCode = $result.ExitStatus
} catch {
    $exitCode = 1
    Write-Error "Falha ao executar comandos SSH: $_"
} finally {
    Remove-SSHSession -SessionId $sshSession.SessionId -ErrorAction SilentlyContinue
}

if ($exitCode -ne 0) {
    Write-Warning "Execução remota retornou código $exitCode. Verifique logs remotos."
} else {
    Write-Host "Script remoto finalizado com código 0" -ForegroundColor Green
}

# ============================================================================
# RESUMO
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUÍDO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($Ambiente -eq "DEV") {
    Write-Host "URL de Teste: http://$RemoteHost:5070/$($warName -replace '\.war$', '')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para promover para PRODUÇÃO:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1 -Ambiente PROD" -ForegroundColor Yellow
} else {
    Write-Host "URL de Produção: https://spdealer.seprocom.com.br" -ForegroundColor Cyan
}

Write-Host ""
