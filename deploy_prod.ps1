<#
Deploy automático (para -> transferir WAR -> start) usando sshpass.
Exemplo:
.\deploy-prod-sshpass.ps1 -RemoteHost '192.168.10.70' -RemoteUser 'root' -SshPass 'SENHA' -RemotePath '/usr/local/tomcat/webapps' -TomcatService 'spdealer.service'
#>

param(
  [Parameter(Mandatory=$true)][string]$RemoteHost,
  [string]$RemoteUser = 'root',
  [string]$SshPass,
  [string]$RemotePath = '/usr/local/tomcat/webapps',
  [string]$TomcatService = 'spdealer.service',
  [string]$PublicUrl = 'https://spdealer.seprocom.com.br',
  [string]$ApiUrl = 'https://spdealer.seprocom.com.br/api'
)

if (-not (Get-Command sshpass -ErrorAction SilentlyContinue)) {
  Write-Error 'sshpass não encontrado no PATH. Instale/veja disponibilidade.'
  exit 1
}

if ($SshPass) { $env:SSHPASS = $SshPass }

try {
  Write-Output '1) Build frontend (produção)...'
  $env:PUBLIC_URL = '/spdealer/'
  $env:REACT_APP_API_BASE_URL = $PublicUrl
  $env:REACT_APP_API_URL = $ApiUrl

  npm ci
  npm run build

  Write-Output '2) Copiar build para backend resources...'
  $staticDir = Join-Path (Get-Location) 'src/main/resources/static'
  if (-Not (Test-Path $staticDir)) { New-Item -ItemType Directory -Path $staticDir | Out-Null }
  Remove-Item -Path (Join-Path $staticDir '*') -Force -Recurse -ErrorAction SilentlyContinue
  Copy-Item -Path (Join-Path (Get-Location) 'build\*') -Destination $staticDir -Recurse -Force

  Write-Output '3) Build backend (Maven)...'
  mvn clean package -DskipTests

  $war = Get-ChildItem -Path target -Filter '*.war' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $war) { Write-Error 'WAR não encontrado em target/'; exit 1 }

  $remoteWar = Join-Path $RemotePath 'spdealer.war'
  Write-Output "4) Parando serviço remoto '$TomcatService' em $RemoteHost antes da transferência..."

  $stopCmd = "sshpass -e ssh -o StrictHostKeyChecking=no $RemoteUser@$RemoteHost 'sudo systemctl stop $TomcatService && sleep 2'"
  Write-Output "Exec: $stopCmd"
  iex $stopCmd
  if ($LASTEXITCODE -ne 0) { Write-Warning 'Falha ao parar serviço remoto (continue com cautela)'; }

  Write-Output "5) Transferindo $($war.FullName) para $remoteTarget (sem backup)..."
  # construir destino remoto separadamente para evitar problemas de interpolação
  $remoteTarget = $RemoteUser + '@' + $RemoteHost + ':' + $remoteWar
  $localWar = $war.FullName
  $scpCmd = "sshpass -e scp -o StrictHostKeyChecking=no `"$localWar`" $remoteTarget"
  Write-Output "Exec: $scpCmd"
  iex $scpCmd
  if ($LASTEXITCODE -ne 0) { Write-Error 'SCP falhou'; exit 1 }

  Write-Output "6) Iniciando serviço remoto '$TomcatService' em $RemoteHost..."
  # construir comando de start via concatenação para evitar conflitos de aspas
    $startInner = "sudo systemctl start $TomcatService; sleep 6; sudo systemctl status $TomcatService --no-pager -l | sed -n '1,120p'"
    $startCmd = 'sshpass -e ssh -o StrictHostKeyChecking=no ' + $RemoteUser + '@' + $RemoteHost + ' "' + $startInner + '"'
  Write-Output "Exec: $startCmd"
  iex $startCmd

  Write-Output '✅ Deploy concluído (serviço reiniciado).'
} catch {
    Write-Error "Erro no deploy: $_"
  exit 1
} finally {
  Remove-Item Env:SSHPASS -ErrorAction SilentlyContinue
}