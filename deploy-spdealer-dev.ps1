<#
.SYNOPSIS
  Deploy do SPDealer para desenvolvimento (spdealer_dev.war).

.DESCRIPTION
  1. Compila o projeto com Maven
  2. Se não houver erros, cria o WAR spdealer_dev.war
  3. Copia o WAR para o servidor Tomcat remoto (192.168.100.70)
  4. Faz deploy como spdealer_dev.war
  
  Para produção: após testar, copiar manualmente spdealer_dev.war para spdealer.war
  no servidor: cp /usr/local/tomcat10/webapps/spdealer_dev.war /usr/local/tomcat10/webapps/spdealer.war

.EXAMPLE
  .\deploy-spdealer-dev.ps1

#>

[CmdletBinding()]
param(
    [string]$RemoteHost = "192.168.10.70",
    [string]$RemoteUser = "root",
    [string]$RemoteTomcatWebapps = "/usr/local/tomcat10/webapps",
    [int]$SshPort = 22,
    [int]$SshTimeoutSec = 30,
    [switch]$SkipCompile,
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

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
    
    $mvnCmd = "mvn clean package -DskipTests"
    Write-Output "Executando: $mvnCmd"
    
    Invoke-Expression $mvnCmd
    $mvnExitCode = $LASTEXITCODE
    
    if ($mvnExitCode -ne 0) {
        Write-Error "FALHA NA COMPILAÇÃO! Verifique os erros acima."
        Write-Error "Deploy cancelado devido a erros de compilação."
        exit $mvnExitCode
    }
    
    Write-Host "Compilação concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Output "=============================================="
    Write-Output "PASSO 1: Compilação ignorada (-SkipCompile)"
    Write-Output "=============================================="
}

# ============================================================================
# PASSO 2: Verificar se o WAR foi criado
# ============================================================================

Write-Output "=============================================="
Write-Output "PASSO 2: Verificando WAR gerado..."
Write-Output "=============================================="

$warFiles = Get-ChildItem -Path .\target -Filter "spdealer*.war" | Sort-Object LastWriteTime -Descending
if ($warFiles.Count -eq 0) {
    Write-Error "Nenhum WAR encontrado em .\target"
    exit 1
}

$localWar = $warFiles[0].FullName
Write-Host "WAR encontrado: $localWar" -ForegroundColor Green

# Criar nome do WAR para desenvolvimento
$devWarName = "spdealer_dev.war"
$localDevWar = Join-Path (Split-Path $localWar -Parent) $devWarName

# Copiar para nome de desenvolvimento
Copy-Item $localWar $localDevWar -Force
Write-Host "WAR de desenvolvimento criado: $localDevWar" -ForegroundColor Green

if ($SkipDeploy) {
    Write-Output "=============================================="
    Write-Output "Deploy ignorado (-SkipDeploy)"
    Write-Output "=============================================="
    Write-Output "WAR disponível em: $localDevWar"
    exit 0
}

# ============================================================================
# PASSO 3: Deploy para servidor remoto
# ============================================================================

Write-Output "=============================================="
Write-Output "PASSO 3: Deploy para servidor remoto..."
Write-Output "=============================================="
Write-Output "Servidor: $RemoteUser@$RemoteHost"
Write-Output "WAR: $devWarName"

$remoteTmp = "/tmp/" + $devWarName
$dest = $RemoteUser + "@" + $RemoteHost + ":" + $remoteTmp

Write-Output "Copiando $localDevWar para $dest ..."
scp -P $SshPort $localDevWar $dest
AbortIfError $LASTEXITCODE "SCP falhou. Verifique conectividade/credenciais."

# Remote bash script
$remoteTemplate = @'
set -e
echo "Parando serviço spdealer_dev (se existir)..."
systemctl stop spdealer_dev.service || true

timestamp=$(date +%Y%m%d%H%M%S)
WEBAPPS="{WEBAPPS}"

# Backup antigo
if [ -f "{WEBAPPS}/spdealer_dev.war" ]; then
  mv "{WEBAPPS}/spdealer_dev.war" "{WEBAPPS}/spdealer_dev.war.bak.$timestamp"
  echo "WAR de desenvolvimento antigo movido para backup"
fi
if [ -d "{WEBAPPS}/spdealer_dev" ]; then
  mv "{WEBAPPS}/spdealer_dev" "{WEBAPPS}/spdealer_dev.bak.$timestamp"
  echo "Exploded webapp de desenvolvimento movido para backup"
fi

echo "Movendo novo WAR para webapps..."
mv "{REMOTE_TMP}" "{WEBAPPS}/spdealer_dev.war"

echo "Definindo permissões (tentativa: tomcat:tomcat)..."
chown -R tomcat:tomcat "{WEBAPPS}/spdealer_dev.war" || true

echo "Iniciando serviço spdealer.service (ou Tomcat)..."
# Tentar iniciar serviço específico ou Tomcat diretamente
systemctl start spdealer.service || { 
    # Se não tiver serviço, iniciar Tomcat diretamente
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

$remoteCmd = $remoteTemplate -replace '\{WEBAPPS\}', $RemoteTomcatWebapps
$remoteCmd = $remoteCmd -replace '\{REMOTE_TMP\}', $remoteTmp

$localRemoteScript = Join-Path $env:TEMP "spdealer-dev-deploy-remote.sh"
($remoteCmd -replace "`r`n", "`n") | Set-Content -Path $localRemoteScript -Encoding ASCII -Force

$scriptDest = $RemoteUser + "@" + $RemoteHost + ":/tmp/spdealer-dev-deploy-remote.sh"
Write-Output "Copiando script remoto para $scriptDest ..."
scp -P $SshPort $localRemoteScript $scriptDest
AbortIfError $LASTEXITCODE "SCP do script remoto falhou"

Write-Output "Executando script remoto..."
Get-Content -Raw -Encoding ASCII $localRemoteScript | ssh -o ConnectTimeout=$SshTimeoutSec -p $SshPort $RemoteUser@$RemoteHost 'bash -s'
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Warning "Execução remota retornou código $exitCode. Verifique logs remotos."
} else {
    Write-Host "Script remoto finalizado com código 0" -ForegroundColor Green
}

# ============================================================================
# RESUMO
# ============================================================================

Write-Output ""
Write-Output "=============================================="
Write-Output "           DEPLOY CONCLUÍDO"
Write-Output "=============================================="
Write-Output ""
Write-Host "URL de Desenvolvimento: http://$RemoteHost/spdealer_dev" -ForegroundColor Cyan
Write-Output ""
Write-Output "Para promover para PRODUÇÃO, execute no servidor:"
Write-Host "  cp $RemoteTomcatWebapps/spdealer_dev.war $RemoteTomcatWebapps/spdealer.war" -ForegroundColor Yellow
Write-Output ""
Write-Output "Ou reinicie o Tomcat para aplicar as mudanças."
