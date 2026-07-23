<#
.SYNOPSIS
  Gera par de chaves SSH (ed25519) e copia a chave pública para um servidor remoto.

.DESCRIPTION
  Script de assistência para configurar autenticação SSH baseada em chave para deploys automatizados
  em Windows PowerShell (v5.1). Gera a chave em $KeyPath se ela não existir, restringe permissões
  e (opcional) copia a chave pública para o usuário remoto (vai solicitar senha do usuário remoto
  na primeira vez).

.EXAMPLE
  # Gerar chave local e apenas exibir a pública
  .\setup-ssh-deploy.ps1 -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"

  # Gerar e copiar para o servidor remoto (será solicitado password do usuário remoto)
  .\setup-ssh-deploy.ps1 -RemoteHost 192.168.1.100 -RemoteUser deploy

#>

param(
  [string]$KeyType = 'ed25519',
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$RemoteHost,
  [string]$RemoteUser
)

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null }
}

Write-Host "[ssh-deploy] KeyType: $KeyType" -ForegroundColor Cyan
Write-Host "[ssh-deploy] KeyPath: $KeyPath" -ForegroundColor Cyan

if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
  Write-Warning "ssh-keygen não encontrado no PATH. Instale OpenSSH (Windows 10/11) ou Git for Windows.";
}

$keyDir = Split-Path -Parent $KeyPath
Ensure-Directory -Path $keyDir

if (Test-Path $KeyPath) {
  Write-Host "Chave já existe em: $KeyPath" -ForegroundColor Yellow
} else {
  Write-Host "Gerando chave SSH ($KeyType) sem passphrase para automacao..." -ForegroundColor Green
  # Gera sem passphrase para uso automatizado. Se preferir passphrase, remova -N "" e forneça uma.
  $hostTag = $env:COMPUTERNAME
  $comment = "spdealer-deploy@$hostTag"
  Write-Host "Executando ssh-keygen..." -ForegroundColor Gray
  try {
    # Some ssh-keygen builds on Windows don't accept empty string arguments via Start-Process ArgumentList.
    # Build a single command string and execute via cmd.exe /c to preserve empty passphrase "" correctly.
    $cmd = 'ssh-keygen -t ' + $KeyType + ' -f "' + $KeyPath + '" -N "" -C "' + $comment + '"'
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -NoNewWindow -Wait -PassThru -ErrorAction Stop
    if ($proc.ExitCode -ne 0) { throw "ssh-keygen falhou (exit=$($proc.ExitCode))" }
  } catch {
    throw "ssh-keygen falhou: $_"
  }

  # Restringir permissões (Windows)
  try {
    icacls $KeyPath /inheritance:r | Out-Null
    icacls $KeyPath /grant:r "$($env:USERNAME):(R)" | Out-Null
    icacls $KeyPath.pub /grant:r "$($env:USERNAME):(R)" | Out-Null
  } catch {
    Write-Warning "Falha ao ajustar ACLs com icacls. Verifique permissões manualmente.";
  }

  Write-Host "Chave gerada com sucesso." -ForegroundColor Green
}

$pub = "$KeyPath.pub"
if (-not (Test-Path $pub)) { throw "Arquivo de chave publica nao encontrado: $pub" }

Write-Host "--- Conteúdo da chave pública (copie/cole no servidor remoto se preferir):" -ForegroundColor Cyan
Get-Content $pub | Write-Host

if ($RemoteHost -and $RemoteUser) {
  Write-Host "Tentando copiar chave publica para $RemoteUser@$RemoteHost (será solicitada a senha do usuário remoto)..." -ForegroundColor Cyan

  try {
    Get-Content $pub | ssh "$RemoteUser@$RemoteHost" 'umask 0077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys; chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys'
    if ($LASTEXITCODE -eq 0) {
      Write-Host "Chave pública copiada com sucesso para $RemoteUser@$RemoteHost" -ForegroundColor Green
    } else {
      Write-Warning "ssh retornou código $LASTEXITCODE; verifique credenciais/permissões no servidor remoto.";
    }
  } catch {
    Write-Warning "Erro ao copiar chave via SSH: $_";
  }
}

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host " - Teste: ssh -i $KeyPath ${RemoteUser}@${RemoteHost} 'echo OK' (ou sem -i se estiver usando o caminho padrão)" -ForegroundColor Gray
Write-Host " - Atualize seus scripts de deploy para usar: scp -i $KeyPath <file> ${RemoteUser}@${RemoteHost}:/tmp/ && ssh -i $KeyPath ${RemoteUser}@${RemoteHost} 'sudo systemctl restart spdealer'" -ForegroundColor Gray

Write-Host "Dica de segurança: mantenha chave privada fora do controle de versão e restrinja leitura apenas ao usuário." -ForegroundColor Yellow
