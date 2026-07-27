param(
  [string]$Host = '192.168.10.100',
  [int]$Port = 3306,
  [string]$User = 'root',
  [string]$Db   = 'spdealer',
  [string]$Password = 'k15720'
)

$ErrorActionPreference = 'Stop'

function Invoke-MysqlScript([string]$filePath) {
  if (-not (Test-Path -LiteralPath $filePath)) {
    throw "SQL file not found: $filePath"
  }
  $mysql = 'mysql'
  $env:MYSQL_PWD = $Password
  Write-Host "RUNNING: $filePath"
  $arg = "/c `"$mysql -h $Host -P $Port -u $User $Db < `"$filePath`"`""
  $proc = Start-Process -FilePath "cmd.exe" -ArgumentList $arg -NoNewWindow -PassThru -Wait
  if ($proc.ExitCode -ne 0) {
    throw "mysql exited with code $($proc.ExitCode) for $filePath"
  }
}

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $base
$sql1 = Join-Path $root 'database\migrations\2025-10-19_add_parametros_ferramentas_menu.sql'
$sql2 = Join-Path $root 'database\migrations\2025-10-19_flow_engine.sql'

Invoke-MysqlScript -filePath $sql1
Invoke-MysqlScript -filePath $sql2

Write-Host 'MIGRATIONS_APPLIED'