param(
    [string]$LocalWar = ".\target\spdealer-1.0.0.war",
    [string]$RemoteHost = "192.168.10.70",
    [string]$RemoteUser = "root",
    [string]$RemoteTomcatWebapps = "/usr/local/tomcat10/webapps",
    [int]$SshPort = 22,
    [int]$SshTimeoutSec = 30
)

function AbortIfError($code, $msg) {
    if ($code -ne 0) {
        Write-Error $msg
        exit $code
    }
}

if (-not (Test-Path $LocalWar)) {
    $war = Get-ChildItem -Path .\target -Filter "spdealer*.war" | Select-Object -First 1
    if ($war) { $LocalWar = $war.FullName } else { Write-Error "WAR local nao encontrado: $LocalWar"; exit 1 }
}

$remoteTmp = "/tmp/" + ([IO.Path]::GetFileName($LocalWar))
$dest = $RemoteUser + "@" + $RemoteHost + ":" + $remoteTmp
Write-Output "Copying $LocalWar to $dest"
scp -P $SshPort $LocalWar $dest
AbortIfError $LASTEXITCODE "SCP failed"

$remoteScript = @'
set -e
echo "Stopping spdealer.service if exists"
systemctl stop spdealer.service || true

timestamp=$(date +%Y%m%d%H%M%S)
if [ -f "{WEBAPPS}/spdealer.war" ]; then
  mv "{WEBAPPS}/spdealer.war" "{WEBAPPS}/spdealer.war.bak.$timestamp"
  echo "Moved existing WAR to backup"
fi
if [ -d "{WEBAPPS}/spdealer" ]; then
  mv "{WEBAPPS}/spdealer" "{WEBAPPS}/spdealer.bak.$timestamp"
  echo "Moved exploded webapp to backup"
fi

echo "Moving new WAR to webapps"
mv "{REMOTE_TMP}" "{WEBAPPS}/spdealer.war"

echo "Chown war to tomcat:tomcat (if applicable)"
chown -R tomcat:tomcat "{WEBAPPS}/spdealer.war" || true

echo "Starting spdealer.service"
systemctl start spdealer.service || { echo "Failed to start spdealer.service"; exit 10; }

sleep 5

if [ -f /usr/local/tomcat10/logs/catalina.out ]; then
  echo "--- Last 120 lines of catalina.out ---"
  tail -n 120 /usr/local/tomcat10/logs/catalina.out
fi

echo "Deploy completed"
exit 0
'@

$remoteCmd = $remoteScript -replace '\{WEBAPPS\}', $RemoteTomcatWebapps
$remoteCmd = $remoteCmd -replace '\{REMOTE_TMP\}', $remoteTmp

$localRemoteScript = Join-Path $env:TEMP "spdealer-deploy-remote-clean.sh"
($remoteCmd -replace "`r`n", "`n") | Set-Content -Path $localRemoteScript -Encoding ASCII -Force

$scriptDest = $RemoteUser + "@" + $RemoteHost + ":/tmp/spdealer-deploy-remote-clean.sh"
Write-Output "Copying remote script to $scriptDest"
scp -P $SshPort $localRemoteScript $scriptDest
AbortIfError $LASTEXITCODE "SCP of script failed"

Write-Output "Executing remote script"
ssh -o ConnectTimeout=$SshTimeoutSec -p $SshPort $RemoteUser@$RemoteHost "sh /tmp/spdealer-deploy-remote-clean.sh"
AbortIfError $LASTEXITCODE "Remote execution failed"

Write-Output "Deploy finished"
