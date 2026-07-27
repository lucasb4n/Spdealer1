param(
  [string]$Host = '192.168.10.70',
  [string]$User = 'root',
  [string]$KeyPath = ''
)

$scriptLocal = Join-Path -Path $PSScriptRoot -ChildPath 'spdealer_deploy_audit.sh'
if (-not (Test-Path $scriptLocal)){
  Write-Error "Arquivo $scriptLocal nao encontrado. Certifique-se de que o script Bash foi salvo em scripts\spdealer_deploy_audit.sh"
  exit 1
}

function Run-Scp {
  param($src, $dest)
  $args = @()
  if ($KeyPath -ne ''){ $args += '-i'; $args += $KeyPath }
  $args += $src; $args += $dest
  Write-Host "Running: scp $($args -join ' ')"
  & scp @args
  if ($LASTEXITCODE -ne 0){ Write-Error "scp failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
}

function Run-Ssh {
  param($remoteCmd)
  $args = @()
  if ($KeyPath -ne ''){ $args += '-i'; $args += $KeyPath }
  $args += "$User@$Host"; $args += $remoteCmd
  Write-Host "Running: ssh $($args -join ' ')"
  & ssh @args
  if ($LASTEXITCODE -ne 0){ Write-Error "ssh failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
}

# 1) Upload script
$remotePath = "/tmp/spdealer_deploy_audit.sh"
Run-Scp -src $scriptLocal -dest "$User@$Host:$remotePath"

# 2) Execute script remotely
Run-Ssh -remoteCmd "bash $remotePath"

# 3) Find remote archive
$findArgs = @()
if ($KeyPath -ne ''){ $findArgs += '-i'; $findArgs += $KeyPath }
$findArgs += "$User@$Host"; $findArgs += "bash -lc 'ls -1 /tmp/spdealer_deploy_audit_*.tar.gz 2>/dev/null | tail -n1'"
$remoteArchive = (& ssh @findArgs) -join "`n"
if ([string]::IsNullOrWhiteSpace($remoteArchive)){
  Write-Error "Nenhum arquivo de auditoria encontrado em /tmp no servidor. Verifique logs remotos."; exit 2
}
$remoteArchive = $remoteArchive.Trim()
Write-Host "Remote archive found: $remoteArchive"

# 4) Download archive
$localTarget = Join-Path -Path (Get-Location) -ChildPath (Split-Path -Leaf $remoteArchive)
$scpArgs = @()
if ($KeyPath -ne ''){ $scpArgs += '-i'; $scpArgs += $KeyPath }
$scpArgs += "$User@$Host:`"$remoteArchive`""; $scpArgs += $localTarget
Write-Host "Downloading to $localTarget"
& scp @scpArgs
if ($LASTEXITCODE -ne 0){ Write-Error "scp download failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Host "Download complete: $localTarget"
Write-Host "You can extract it with: tar -xzf $localTarget -C ./ -v"
