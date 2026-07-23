Param(
  [string]$RemoteHost = "100.126.166.63",
  [string]$User = "root",
  [string]$LocalWar = "target\\spdealer-1.0.0-exec.war",
  [string]$RemoteWar = "/usr/local/tomcat10/webapps/spdealer.war",
  [int]$SshPort = 22,
  [string]$Password = ''
)

# Prepare secure password: if supplied as plain text parameter, convert; otherwise prompt
if ([string]::IsNullOrEmpty($Password)) {
  $SecurePassword = Read-Host -AsSecureString "Senha para $User@$RemoteHost"
} else {
  $SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
}

# Install Posh-SSH in current user scope if missing
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
  Write-Host "Instalando Posh-SSH (pode pedir confirmação)..."
  try {
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
  } catch {
    Write-Warning "Falha ao instalar Posh-SSH: $_"
    throw
  }
}

Import-Module Posh-SSH -ErrorAction Stop

$LocalWarPath = Resolve-Path -LiteralPath $LocalWar -ErrorAction SilentlyContinue
if (-not $LocalWarPath) {
  Write-Error "WAR local não encontrado: $LocalWar"
  exit 1
}

$cred = New-Object System.Management.Automation.PSCredential ($User, $SecurePassword)

Write-Host "Conectando por SSH a $RemoteHost..."
$ssh = New-SSHSession -ComputerName $RemoteHost -Credential $cred -Port $SshPort -AcceptKey -ErrorAction Stop
if (-not $ssh) { Write-Error "Falha ao abrir sessão SSH"; exit 1 }

# Parar Tomcat
Write-Host "Parando Tomcat..."
Invoke-SSHCommand -Index $ssh.SessionId -Command "/usr/local/tomcat10/bin/shutdown.sh || true; sleep 2"

# Remover deploy antigo
Write-Host "Removendo app antigo (se existir)..."
Invoke-SSHCommand -Index $ssh.SessionId -Command "rm -rf /usr/local/tomcat10/webapps/spdealer /usr/local/tomcat10/webapps/spdealer.war || true"

# Enviar WAR via SCP para /tmp/ e mover para o destino
Write-Host "Enviando WAR via SCP: $($LocalWarPath.Path) -> /tmp/"
Set-SCPItem -ComputerName $RemoteHost -Credential $cred -Port $SshPort -Path $LocalWarPath.Path -Destination /tmp/ -AcceptKey -ErrorAction Stop
Write-Host "Movendo WAR para $RemoteWar..."
Invoke-SSHCommand -Index $ssh.SessionId -Command "mv /tmp/spdealer-1.0.0-exec.war $RemoteWar" -ErrorAction Stop

# Ajustar permissões (se necessário)
Invoke-SSHCommand -Index $ssh.SessionId -Command "chown root:root $RemoteWar || true"

# Iniciar Tomcat
Write-Host "Iniciando Tomcat..."
Invoke-SSHCommand -Index $ssh.SessionId -Command "/usr/local/tomcat10/bin/startup.sh || true; sleep 3"

Write-Host '--- catalina.out (últimas 200 linhas) ---'
$log = Invoke-SSHCommand -Index $ssh.SessionId -Command "tail -n 200 /usr/local/tomcat10/logs/catalina.out" -ErrorAction SilentlyContinue
if ($log) { $log.Output }

# Fechar sessão SSH
if ($ssh) { Remove-SSHSession -SessionId $ssh.SessionId }

Write-Host "Deploy concluído. Acesse: http://$RemoteHost:8080/spdealer/"
