<#
deploy-actuator.ps1 (minimal clean version)

Purpose: small, syntactically-valid DryRun script that starts a transcript
and prints the sequence of actions that would be executed. Use this to
validate PowerShell parsing and generate `deploy-dryrun.log`.
#>

param(
    [string]$SshPassword = $null,
    [string]$SshKeyPath = $null,
    [switch]$DryRun = $false,

    [string]$RemoteHost = '192.168.10.70',
    [string]$RemoteUser = 'root',
    [int]$RemoteSshPort = 22,

    [string]$LocalRepoPath = 'H:/DISCO_D/Desenvolvimento/Seprocom/spdealer',
    [string]$WarName = 'spdealer-1.0.0.war'
)

Set-StrictMode -Version Latest

# Ensure paths are normalized
$LocalRepoPath = (Resolve-Path -Path $LocalRepoPath).ProviderPath

# Transcript for DryRun
$transcriptPath = Join-Path -Path $LocalRepoPath -ChildPath 'deploy-dryrun.log'
$transcriptStarted = $false
if ($DryRun) {
    try {
        Start-Transcript -Path $transcriptPath -Force
        $transcriptStarted = $true
        Write-Host "[DRYRUN] Transcript iniciado: $transcriptPath" -ForegroundColor Yellow
    } catch {
        Write-Warning "Falha ao iniciar transcript: $_"
    }
}

try {
    Write-Host "Parâmetros recebidos:" -ForegroundColor Cyan
    Write-Host " RemoteHost: ${RemoteHost}" -ForegroundColor Cyan
    Write-Host " RemoteUser: ${RemoteUser}" -ForegroundColor Cyan
    Write-Host " RemoteSshPort: ${RemoteSshPort}" -ForegroundColor Cyan
    Write-Host " LocalRepoPath: ${LocalRepoPath}" -ForegroundColor Cyan
    Write-Host " WarName: ${WarName}" -ForegroundColor Cyan

    if ($DryRun) {
        $localWar = Join-Path -Path $LocalRepoPath -ChildPath (Join-Path -Path 'target' -ChildPath $WarName)
        Write-Host "[DRYRUN] 1) mvn clean package -DskipTests (local build)"
        Write-Host "[DRYRUN] 2) scp '$localWar' -> '${RemoteUser}@${RemoteHost}:/tmp/' (using key: ${SshKeyPath})"
        Write-Host "[DRYRUN] 3) ssh ${RemoteUser}@${RemoteHost} -p ${RemoteSshPort} 'backup, move, restart tomcat'"
        Write-Host "[DRYRUN] 4) ensure actuator property exists in /opt/spdealer/application-prod.properties"
        Write-Host "[DRYRUN] 5) optional: copy nginx-update.sh to nginx host and execute"
        Write-Host "[DRYRUN] 6) check health URL: http://${RemoteHost}:8080/spdealer/actuator/health"
    } else {
        Write-Host "Modo real (não DryRun) não implementado nesta versão mínima." -ForegroundColor Yellow
        Write-Host "Para validar, execute com -DryRun." -ForegroundColor Yellow
    }

    Write-Host "Execução finalizada (versão mínima)." -ForegroundColor Green

} finally {
    if ($transcriptStarted) {
        try {
            Stop-Transcript | Out-Null
            Write-Host "[DRYRUN] Transcript salvo: $transcriptPath" -ForegroundColor Green
        } catch {
            Write-Warning "Falha ao parar transcript: $_"
        }
    }
}
<#
Minimal, clean deploy script for DryRun validation.

This file is intentionally small and syntactically strict to avoid PowerShell
parse errors encountered previously. It implements a parameter block, starts
transcript in DryRun mode, and prints the sequence of actions that would be
performed. Once this runs cleanly, we can expand it back to the full deploy
workflow.
#>

param(
    [string]$SshPassword = $null,
    [string]$SshKeyPath = $null,
    [switch]$DryRun = $false,

    [string]$RemoteHost = '192.168.10.70',
    [string]$RemoteUser = 'root',
    [int]$RemoteSshPort = 22,

    [string]$LocalRepoPath = 'H:/DISCO_D/Desenvolvimento/Seprocom/spdealer',
    [string]$WarName = 'spdealer-1.0.0.war'
)

Set-StrictMode -Version Latest

# Transcript file for DryRun
$transcriptPath = Join-Path -Path $LocalRepoPath -ChildPath 'deploy-dryrun.log'
$transcriptStarted = $false
if ($DryRun) {
    try {
        Start-Transcript -Path $transcriptPath -Force
        $transcriptStarted = $true
        Write-Host "[DRYRUN] Transcript iniciado: $transcriptPath" -ForegroundColor Yellow
    } catch {
        Write-Warning "Falha ao iniciar transcript: $_"
    }
}

try {
    Write-Host "Parâmetros recebidos:" -ForegroundColor Cyan
    Write-Host " RemoteHost: $RemoteHost" -ForegroundColor Cyan
    Write-Host " RemoteUser: $RemoteUser" -ForegroundColor Cyan
    Write-Host " RemoteSshPort: $RemoteSshPort" -ForegroundColor Cyan
    Write-Host " LocalRepoPath: $LocalRepoPath" -ForegroundColor Cyan
    Write-Host " WarName: $WarName" -ForegroundColor Cyan

    if ($DryRun) {
        Write-Host "[DRYRUN] 1) mvn clean package -DskipTests (local build)"
        Write-Host "[DRYRUN] 2) scp $LocalRepoPath\target\$WarName -> $RemoteUser@$RemoteHost:/tmp/ (using key: $SshKeyPath)"
        Write-Host "[DRYRUN] 3) ssh $RemoteUser@$RemoteHost -p $RemoteSshPort 'backup, move, restart tomcat'"
        Write-Host "[DRYRUN] 4) ensure actuator property exists in /opt/spdealer/application-prod.properties"
        Write-Host "[DRYRUN] 5) optional: copy nginx-update.sh to nginx host and execute"
        Write-Host "[DRYRUN] 6) check health URL: http://$RemoteHost:8080/spdealer/actuator/health"
    } else {
        Write-Host "Modo real (não DryRun) ainda não implementado nesta versão mínima." -ForegroundColor Yellow
        Write-Host "Nada será executado. Para validar, rode com -DryRun." -ForegroundColor Yellow
    }

    Write-Host "Execução finalizada (versão mínima)." -ForegroundColor Green

} finally {
    if ($transcriptStarted) {
        try {
            Stop-Transcript | Out-Null
            Write-Host "[DRYRUN] Transcript salvo: $transcriptPath" -ForegroundColor Green
        } catch {
            Write-Warning "Falha ao parar transcript: $_"
        }
    }
}

# When DryRun is requested, start a transcript to capture all output to a file
$transcriptStarted = $false
$transcriptPath = Join-Path -Path $localRepoPath -ChildPath "deploy-dryrun.log"
if ($DryRun) {
    try {
        Start-Transcript -Path $transcriptPath -Force
        $transcriptStarted = $true
        Write-Host "[DRYRUN] Transcript iniciado: $transcriptPath" -ForegroundColor Yellow
    <#
    deploy-actuator.ps1

    Builds the WAR, uploads to a Tomcat host, performs backup and deploy, restarts Tomcat
    and optionally updates an Nginx host. Designed for interactive use from a
    workstation or CI runner. Supports key-based auth (`-SshKeyPath`) and a DryRun
    mode that records all output to `deploy-dryrun.log`.

    Usage examples:
      .\deploy-actuator.ps1 -SshKeyPath 'C:\Users\you\.ssh\id_ed25519' -DryRun
      .\deploy-actuator.ps1 -RemoteHost '192.168.10.70' -SshKeyPath 'C:\keys\deploy' 

    Prerequisites:
     - OpenSSH client (`ssh`, `scp`) or PuTTY (`plink`, `pscp`) on the runner
     - Maven installed locally
     - The caller has SSH access to the remote host with enough privileges to move
       the WAR and restart `tomcat10` (sudo may be required)
    #>

    param(
        [string]$SshPassword = $null,
        [string]$SshKeyPath = $null,
        [switch]$DryRun = $false,

        [string]$RemoteHost = '192.168.10.70',
        [string]$RemoteUser = 'root',
        [int]$RemoteSshPort = 22,

        [string]$NginxHost = '192.168.10.30',
        [string]$NginxUser = 'root',
        [int]$NginxSshPort = 22,

        [string]$LocalRepoPath = 'H:/DISCO_D/Desenvolvimento/Seprocom/spdealer',
        [string]$WarName = 'spdealer-1.0.0.war'
    )

    try {
        # Normalize and resolve inputs
        if (-not $SshPassword) { $SshPassword = $env:SPDEALER_SSH_PASS }

        $remoteTmp = '/tmp'
        $tomcatWebapps = '/usr/local/tomcat10/webapps'
        $backupDir = '/var/backups/spdealer'

        # Detect available SSH clients
        $sshpassPath = (Get-Command sshpass -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source) -as [string]
        $pscpPath = (Get-Command pscp -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source) -as [string]
        $plinkPath = (Get-Command plink -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source) -as [string]
        $sshPath = (Get-Command ssh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source) -as [string]
        $scpPath = (Get-Command scp -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source) -as [string]

        if ($sshPath) { Write-Host "OK: ssh -> $sshPath" -ForegroundColor Green }
        if ($scpPath) { Write-Host "OK: scp -> $scpPath" -ForegroundColor Green }
        if ($sshpassPath) { Write-Host "sshpass encontrado em: $sshpassPath" -ForegroundColor Green }
        if ($pscpPath) { Write-Host "pscp (PuTTY) encontrado em: $pscpPath" -ForegroundColor Green }
        if ($plinkPath) { Write-Host "plink (PuTTY) encontrado em: $plinkPath" -ForegroundColor Green }

        # DryRun transcript
        $transcriptStarted = $false
        $transcriptPath = Join-Path -Path $LocalRepoPath -ChildPath 'deploy-dryrun.log'
        if ($DryRun) {
            try {
                Start-Transcript -Path $transcriptPath -Force
                $transcriptStarted = $true
                Write-Host "[DRYRUN] Transcript iniciado: $transcriptPath" -ForegroundColor Yellow
            } catch {
                Write-Warning "Falha ao iniciar transcript: $_"
            }
        }

        function Run-Scp($localPath, $remoteTarget, $port, $useSshPass, $keyPath) {
            if ($DryRun) { Write-Host "[DRYRUN] scp $localPath -> $remoteTarget (port $port)"; return 0 }
            if ($scpPath) {
                $args = @()
                if ($keyPath) { $args += @('-i', $keyPath) }
                $args += @('-P', $port, $localPath, $remoteTarget)
                if ($useSshPass -and $SshPassword -and $sshpassPath) {
                    Write-Host "Executando: sshpass -p **** scp $($args -join ' ')"
                    & $sshpassPath -p $SshPassword $scpPath @args
                    return $LASTEXITCODE
                }
                Write-Host "Executando: scp $($args -join ' ')"
                & $scpPath @args
                return $LASTEXITCODE
            } elseif ($pscpPath) {
                $args = @()
                if ($keyPath) { $args += @('-i', $keyPath) }
                $args += @('-P', $port, $localPath, $remoteTarget)
                if ($useSshPass -and $SshPassword) {
                    Write-Host "Executando: pscp -pw **** $($args -join ' ')"
                    & $pscpPath @('-pw', $SshPassword) @args
                    return $LASTEXITCODE
                }
                Write-Host "Executando: pscp $($args -join ' ')"
                & $pscpPath @args
                return $LASTEXITCODE
            } else {
                Write-Host "Nenhum cliente scp detectado. Tente instalar OpenSSH ou PuTTY (pscp)." -ForegroundColor Red
                return 2
            }
        }

        function Run-Ssh($user, $host, $port, $command, $useSshPass, $keyPath) {
            if ($DryRun) { Write-Host "[DRYRUN] ssh $user@$host -p $port '$command'"; return 0 }
            if ($sshPath) {
                $args = @()
                if ($keyPath) { $args += @('-i', $keyPath) }
                $args += @('-p', $port, "$user@$host", $command)
                if ($useSshPass -and $SshPassword -and $sshpassPath) {
                    Write-Host "Executando: sshpass -p **** ssh $($args -join ' ')"
                    & $sshpassPath -p $SshPassword $sshPath @args
                    return $LASTEXITCODE
                }
                Write-Host "Executando: ssh $($args -join ' ')"
                & $sshPath @args
                return $LASTEXITCODE
            } elseif ($plinkPath) {
                $args = @()
                if ($keyPath) { $args += @('-i', $keyPath) }
                $args += @('-P', $port, "$user@$host", $command)
                if ($useSshPass -and $SshPassword) {
                    Write-Host "Executando: plink -pw **** $($args -join ' ')"
                    & $plinkPath @('-pw', $SshPassword) @args
                    return $LASTEXITCODE
                }
                Write-Host "Executando: plink $($args -join ' ')"
                & $plinkPath @args
                return $LASTEXITCODE
            } else {
                Write-Host "Nenhum cliente ssh detectado (OpenSSH/Plink). Instale um cliente SSH." -ForegroundColor Red
                return 2
            }
        }

        # 1) Build
        Write-Host "[1/8] Building WAR locally (mvn clean package -DskipTests)" -ForegroundColor Cyan
        Push-Location $LocalRepoPath
        try {
            if ($DryRun) { Write-Host "[DRYRUN] mvn clean package -DskipTests (skipping)" } else { & mvn clean package -DskipTests }
        } catch {
            Write-Error "Build falhou. Verifique erros do Maven e tente novamente."; Pop-Location; throw
        }
        Pop-Location

        $localWar = Join-Path -Path $LocalRepoPath -ChildPath "target\$WarName"
        if (-Not (Test-Path $localWar)) { Write-Error "WAR não encontrado em $localWar"; exit 1 }

        # 2) Upload WAR
        Write-Host "[2/8] Upload do WAR para ${RemoteHost}:$remoteTmp" -ForegroundColor Cyan
        $scpTarget = "${RemoteUser}@${RemoteHost}:$remoteTmp/"
        $useSshPass = $false
        if ($SshPassword) { $useSshPass = $true; Write-Host "Usando senha fornecida para autenticação (não interativo)" -ForegroundColor Yellow }
        Write-Host "Uploading $localWar -> $scpTarget"
        $exit = Run-Scp $localWar $scpTarget $RemoteSshPort $useSshPass $SshKeyPath
        if ($exit -ne 0) { Write-Error "SCP falhou com código $exit"; exit 1 }

        # 3) Remote deploy
        Write-Host "[3/8] Executando deploy remoto (backup, mover WAR, remover exploded dir, restart Tomcat)" -ForegroundColor Cyan
        $remoteCommands = @(
            "sudo mkdir -p $backupDir",
            "if [ -f $tomcatWebapps/spdealer.war ]; then sudo cp $tomcatWebapps/spdealer.war $backupDir/spdealer.war.$(date +%Y%m%d%H%M%S); fi",
            "if [ -d $tomcatWebapps/spdealer ]; then sudo rm -rf $tomcatWebapps/spdealer; fi",
            "sudo mv $remoteTmp/$WarName $tomcatWebapps/spdealer.war",
            "sudo chown -R tomcat:tomcat $tomcatWebapps/spdealer.war",
            "sudo systemctl daemon-reload || true",
            "sudo systemctl restart tomcat10",
            "sleep 5",
            "sudo journalctl -u tomcat10 -n 200 --no-pager | sed -n '1,200p'"
        )

        $remoteCmdJoined = $remoteCommands -join "; "
        Write-Host "SSH -> ${RemoteUser}@${RemoteHost}: $remoteCmdJoined"
        $exit = Run-Ssh $RemoteUser $RemoteHost $RemoteSshPort $remoteCmdJoined $useSshPass $SshKeyPath
        if ($exit -ne 0) { Write-Error "Comandos remotos falharam (exit $exit)"; exit 1 }

        # 4) Ensure actuator property
        Write-Host "[4/8] Garantir que /opt/spdealer/application-prod.properties contenha Actuator exposure" -ForegroundColor Cyan
        $checkActuatorCmd = "grep -q '^management.endpoints.web.exposure.include=' /opt/spdealer/application-prod.properties || echo 'management.endpoints.web.exposure.include=health,info' | sudo tee -a /opt/spdealer/application-prod.properties"
        $exit = Run-Ssh $RemoteUser $RemoteHost $RemoteSshPort $checkActuatorCmd $useSshPass $SshKeyPath
        if ($exit -ne 0) { Write-Warning "Falha ao checar/adicionar propriedades do Actuator (exit $exit)" }

        # 5) Optional Nginx update
        if ($NginxHost) {
            Write-Host "[5/8] Aplicando update no Nginx host ${NginxHost}" -ForegroundColor Cyan
            $localNginxScript = Join-Path -Path $LocalRepoPath -ChildPath 'scripts/nginx-update.sh'
            if (-Not (Test-Path $localNginxScript)) { Write-Warning "nginx-update.sh nao encontrado em $localNginxScript" } else {
                $scpNginxTarget = "${NginxUser}@${NginxHost}:/tmp/"
                Write-Host "Uploading nginx-update.sh to ${NginxHost}:/tmp/"
                $scpExit = Run-Scp $localNginxScript $scpNginxTarget $NginxSshPort $useSshPass $SshKeyPath
                if ($scpExit -ne 0) { Write-Warning "SCP para nginx host retornou codigo $scpExit" }

                $remoteNginxCmd = 'sudo bash /tmp/nginx-update.sh'
                $nginxExit = Run-Ssh $NginxUser $NginxHost $NginxSshPort $remoteNginxCmd $useSshPass $SshKeyPath
                if ($nginxExit -ne 0) { Write-Warning "Execucao remota do nginx-update.sh retornou codigo $nginxExit" }
            }
        }

        # 6) Health check
        Write-Host "[6/8] Aguardando Tomcat iniciar e checando /spdealer/actuator/health..." -ForegroundColor Cyan
        Start-Sleep -Seconds 6
        try {
            $healthUrl = "http://$RemoteHost:8080/spdealer/actuator/health"
            if ($DryRun) { Write-Host "[DRYRUN] Invoke-WebRequest $healthUrl (skipping)" } else {
                $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -ErrorAction Stop
                Write-Host "Response status: $($health.StatusCode)" -ForegroundColor Green
                Write-Host $health.Content
            }
        } catch {
            Write-Warning "Não foi possível obter /spdealer/actuator/health agora (pode demorar alguns segundos). Verifique logs no servidor.";
        }

        Write-Host "Deploy finalizado. Backup salvo em $backupDir (no host remoto)." -ForegroundColor Green
        Write-Host "Se precisar, rode o script de verificação: scripts\\verify-actuator.ps1" -ForegroundColor Yellow

    } finally {
        if ($transcriptStarted) {
            try {
                Stop-Transcript | Out-Null
                Write-Host "[DRYRUN] Transcript salvo em: $transcriptPath" -ForegroundColor Green
            } catch {
                Write-Warning "Falha ao parar transcript: $_"
            }
        }
    }
                } elseif ($pscpPath) {
                    $args = @()
                    if ($keyPath) { $args += @('-i', $keyPath) }
                    $args += @('-P', $port, $localPath, $remoteTarget)
                    if ($useSshPass -and $SshPassword) {
                        Write-Host "Executando: pscp -pw **** $($args -join ' ')"
                        & $pscpPath @('-pw', $SshPassword) @args
                        return $LASTEXITCODE
                    }
                    Write-Host "Executando: pscp $($args -join ' ')"
                    & $pscpPath @args
                    return $LASTEXITCODE
                } else {
                    Write-Host "Nenhum cliente scp detectado. Tente instalar OpenSSH ou PuTTY (pscp)." -ForegroundColor Red
                    return 2
                }
            }

            function Run-Ssh($user, $host, $port, $command, $useSshPass, $keyPath) {
                if ($DryRun) { Write-Host "[DRYRUN] ssh $user@$host -p $port '$command'"; return 0 }
                if ($sshPath) {
                    $args = @()
                    if ($keyPath) { $args += @('-i', $keyPath) }
                    $args += @('-p', $port, "$user@$host", $command)
                    if ($useSshPass -and $SshPassword -and $sshpassPath) {
                        Write-Host "Executando: sshpass -p **** ssh $($args -join ' ')"
                        & $sshpassPath -p $SshPassword $sshPath @args
                        return $LASTEXITCODE
                    }
                    Write-Host "Executando: ssh $($args -join ' ')"
                    & $sshPath @args
                    return $LASTEXITCODE
                } elseif ($plinkPath) {
                    $args = @()
                    if ($keyPath) { $args += @('-i', $keyPath) }
                    $args += @('-P', $port, "$user@$host", $command)
                    if ($useSshPass -and $SshPassword) {
                        Write-Host "Executando: plink -pw **** $($args -join ' ')"
                        & $plinkPath @('-pw', $SshPassword) @args
                        return $LASTEXITCODE
                    }
                    Write-Host "Executando: plink $($args -join ' ')"
                    & $plinkPath @args
                    return $LASTEXITCODE
                } else {
                    Write-Host "Nenhum cliente ssh detectado (OpenSSH/Plink). Instale um cliente SSH." -ForegroundColor Red
                    return 2
                }
            }

            try {
                Write-Host "[1/8] Building WAR locally (mvn clean package -DskipTests)" -ForegroundColor Cyan
                Push-Location $LocalRepoPath
                try {
                    if ($DryRun) { Write-Host "[DRYRUN] mvn clean package -DskipTests (skipping)" } else { & mvn clean package -DskipTests }
                } catch {
                    Write-Error "Build falhou. Verifique erros do Maven e tente novamente."; Pop-Location; throw
                }
                Pop-Location

                $localWar = Join-Path -Path $LocalRepoPath -ChildPath "target\\$WarName"
                if (-Not (Test-Path $localWar)) {
                    Write-Error "WAR não encontrado em $localWar"; exit 1
                }

                Write-Host "[2/8] Upload do WAR para ${RemoteHost}:$remoteTmp" -ForegroundColor Cyan
                $scpTarget = "${RemoteUser}@${RemoteHost}:$remoteTmp/"
                $useSshPass = $false
                if ($SshPassword) { $useSshPass = $true; Write-Host "Usando senha fornecida para autenticação (não interativo)" -ForegroundColor Yellow }
                Write-Host "Uploading $localWar -> $scpTarget"
                $exit = Run-Scp $localWar $scpTarget $RemoteSshPort $useSshPass $SshKeyPath
                if ($exit -ne 0) { Write-Error "SCP falhou com código $exit"; exit 1 }

                Write-Host "[3/8] Executando deploy remoto (backup, mover WAR, remover exploded dir, restart Tomcat)" -ForegroundColor Cyan
                $remoteCommands = @(
                    "sudo mkdir -p $backupDir",
                    "if [ -f $tomcatWebapps/spdealer.war ]; then sudo cp $tomcatWebapps/spdealer.war $backupDir/spdealer.war.$(date +%Y%m%d%H%M%S); fi",
                    "if [ -d $tomcatWebapps/spdealer ]; then sudo rm -rf $tomcatWebapps/spdealer; fi",
                    "sudo mv $remoteTmp/$WarName $tomcatWebapps/spdealer.war",
                    "sudo chown -R tomcat:tomcat $tomcatWebapps/spdealer.war",
                    "sudo systemctl daemon-reload || true",
                    "sudo systemctl restart tomcat10",
                    "sleep 5",
                    "sudo journalctl -u tomcat10 -n 200 --no-pager | sed -n '1,200p'"
                )

                $remoteCmdJoined = $remoteCommands -join "; "
                Write-Host "SSH -> ${RemoteUser}@${RemoteHost}: $remoteCmdJoined"
                $exit = Run-Ssh $RemoteUser $RemoteHost $RemoteSshPort $remoteCmdJoined $useSshPass $SshKeyPath
                if ($exit -ne 0) { Write-Error "Comandos remotos falharam (exit $exit)"; exit 1 }

                Write-Host "[4/8] Opcional: garantir que /opt/spdealer/application-prod.properties contenha Actuator exposure" -ForegroundColor Cyan
                $checkActuatorCmd = "grep -q '^management.endpoints.web.exposure.include=' /opt/spdealer/application-prod.properties || echo 'management.endpoints.web.exposure.include=health,info' | sudo tee -a /opt/spdealer/application-prod.properties"
                $exit = Run-Ssh $RemoteUser $RemoteHost $RemoteSshPort $checkActuatorCmd $useSshPass $SshKeyPath
                if ($exit -ne 0) { Write-Warning "Falha ao checar/adicionar propriedades do Actuator (exit $exit)" }

                if ($NginxHost) {
                    Write-Host "[5/8] Aplicando update no Nginx host $NginxHost" -ForegroundColor Cyan
                    $localNginxScript = Join-Path -Path $LocalRepoPath -ChildPath 'scripts/nginx-update.sh'
                    if (-Not (Test-Path $localNginxScript)) { Write-Warning "nginx-update.sh nao encontrado em $localNginxScript" } else {
                        $scpNginxTarget = "${NginxUser}@${NginxHost}:/tmp/"
                        Write-Host "Uploading nginx-update.sh to ${NginxHost}:/tmp/"
                        $scpExit = Run-Scp $localNginxScript $scpNginxTarget $NginxSshPort $useSshPass $SshKeyPath
                        if ($scpExit -ne 0) { Write-Warning "SCP para nginx host retornou codigo $scpExit" }

                        $remoteNginxCmd = 'sudo bash /tmp/nginx-update.sh'
                        $nginxExit = Run-Ssh $NginxUser $NginxHost $NginxSshPort $remoteNginxCmd $useSshPass $SshKeyPath
                        if ($nginxExit -ne 0) { Write-Warning "Execucao remota do nginx-update.sh retornou codigo $nginxExit" }
                    }
                }

                Write-Host "[6/8] Aguardando Tomcat iniciar e checando /spdealer/actuator/health..." -ForegroundColor Cyan
                Start-Sleep -Seconds 6
                try {
                    $healthUrl = "http://$RemoteHost:8080/spdealer/actuator/health"
                    if ($DryRun) { Write-Host "[DRYRUN] Invoke-WebRequest $healthUrl (skipping)" } else {
                        $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -ErrorAction Stop
                        Write-Host "Response status: $($health.StatusCode)" -ForegroundColor Green
                        Write-Host $health.Content
                    }
                } catch {
                    Write-Warning "Não foi possível obter /spdealer/actuator/health agora (pode demorar alguns segundos). Verifique logs no servidor.";
                }

                Write-Host "Deploy finalizado. Backup salvo em $backupDir (no host remoto)." -ForegroundColor Green
                Write-Host "Se precisar, rode o script de verificação: scripts\\verify-actuator.ps1" -ForegroundColor Yellow
            } finally {
                if ($transcriptStarted) {
                    try {
                        Stop-Transcript | Out-Null
                        Write-Host "[DRYRUN] Transcript salvo em: $transcriptPath" -ForegroundColor Green
                    } catch {
                        Write-Warning "Falha ao parar transcript: $_"
                    }
                }
            }