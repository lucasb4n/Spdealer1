param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Mode = ''
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startTime = Get-Date

# Garantir que o Maven local esteja no PATH para a sessao
$localMvnBin = Join-Path $scriptDir 'maven\apache-maven-3.9.6\bin'
if (Test-Path $localMvnBin) {
    $env:PATH = "$localMvnBin;$env:PATH"
}

# Logs directory
$logDir = Join-Path $scriptDir 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

# Helper Functions
function Stop-ProcessOnPort {
    param(
        [Parameter(Mandatory=$true)]
        [int]$Port,
        [Parameter(Mandatory=$true)]
        [string]$Label
    )

    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -ne $conn -and $conn.OwningProcess) {
            Write-Host "Stopping process on port $Port ($Label) - PID: $($conn.OwningProcess)" -ForegroundColor Yellow
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
    catch {
        # ignore
    }
}

function Write-EnvFileNoBom {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,
        [Parameter(Mandatory=$true)]
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Test-CommandExists {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )

    try {
        $cmd = Get-Command $Name -ErrorAction SilentlyContinue
        return ($null -ne $cmd)
    }
    catch {
        return $false
    }
}

function Get-WslDistroNames {
    try {
        if (-not (Test-CommandExists -Name 'wsl.exe')) {
            return @()
        }
        $raw = & wsl.exe -l -q 2>$null
        if ($LASTEXITCODE -ne 0 -or $null -eq $raw) {
            return @()
        }
        return @($raw | ForEach-Object { "$($_)".Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }
    catch {
        return @()
    }
}

function Convert-WindowsPathToWsl {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path
    )

    # Converte algo como C:\Dev\Repo -> /mnt/c/Dev/Repo
    $p = $Path.Trim()
    if ($p.Length -ge 2 -and $p[1] -eq ':') {
        $drive = $p.Substring(0, 1).ToLower()
        $rest = $p.Substring(2)
        $rest = $rest.TrimStart('\')
        $rest = $rest.Replace('\', '/')
        return "/mnt/$drive/$rest"
    }

    return ($p.Replace('\', '/'))
}

function Stop-RtcCalculadoraOfflineWsl {
    try {
        if (-not (Test-CommandExists -Name 'wsl.exe')) {
            return
        }
        & wsl.exe --terminate calculadora 2>$null | Out-Null
    }
    catch {
        # ignore
    }
}

function Start-RtcCalculadoraOfflineWsl {
    param(
        [Parameter(Mandatory=$false)]
        [int]$RegimePort = 18080,
        [Parameter(Mandatory=$false)]
        [int]$SplitPort = 18081
    )

    if (-not (Test-CommandExists -Name 'wsl.exe')) {
        Write-Host "ERROR - WSL nao encontrado (wsl.exe). Instale/ative WSL e rode RTC/windows/1-instalar.bat uma vez." -ForegroundColor Red
        return $false
    }

    $distros = Get-WslDistroNames
    if (-not ($distros -contains 'calculadora')) {
        Write-Host "ERROR - Distro WSL 'calculadora' nao encontrada." -ForegroundColor Red
        Write-Host "Execute: RTC\\windows\\1-instalar.bat (ou instale manualmente) e tente novamente." -ForegroundColor Yellow
        return $false
    }

    # Evita conflito com o backend do SPDealer (8080) e garante que a distro suba limpa
    Stop-RtcCalculadoraOfflineWsl

    # Garantir que portas alternativas estejam livres (processos WSL antigos podem ficar presos)
    Stop-ProcessOnPort -Port $RegimePort -Label 'RTC Regime Geral (WSL)'
    Stop-ProcessOnPort -Port $SplitPort -Label 'RTC Split Payment (WSL)'

    # Abre uma janela separada para manter o RTC rodando
    if (-not (Test-Path (Join-Path $scriptDir 'RTC\wsl-start-rtc-api-only.sh'))) {
        Write-Host "ERROR - Script RTC\\wsl-start-rtc-api-only.sh nao encontrado no repo." -ForegroundColor Red
        return $false
    }

    $wslRepoPath = Convert-WindowsPathToWsl -Path $scriptDir
    $wslStarter = "$wslRepoPath/RTC/wsl-start-rtc-api-only.sh"
    $rtcCmd = "wsl.exe -d calculadora --exec bash `"$wslStarter`" $RegimePort $SplitPort"
    $rtcProc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $rtcCmd -PassThru
    Write-Host "OK - RTC (WSL) iniciado em nova janela (PID: $($rtcProc.Id))" -ForegroundColor Green
    return $true
}

function Start-Development {
    param(
        [Parameter(Mandatory=$false)]
        [switch]$WithRtc
    )

    Write-Host ""
    Write-Host "Starting DEVELOPMENT mode..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Write-Host "1. Setting environment variables..." -ForegroundColor Yellow
        # Bind frontend dev server to all interfaces so other machines on LAN can access it
        $env:HOST = '0.0.0.0'

            # Em DEV (npm start), a SPA roda em http://localhost:3000 na raiz.
            # Evite PUBLIC_URL=/spdealer/ aqui para não confundir caminhos/roteamento.
            $env:PUBLIC_URL = ''
            $env:REACT_APP_API_BASE_URL = 'http://localhost:8080'
        $env:PORT = '3000'

        # Ensure development installs devDependencies (react-scripts)
        $env:NODE_ENV = 'development'

        # Try to detect a usable IPv4 address for informational `REACT_APP_API_BASE_URL` but
        # keep `REACT_APP_API_URL` as a relative '/api' so the dev server proxy handles requests.
        try {
            $localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.*' -and $_.PrefixLength -gt 0 } | Sort-Object -Property PrefixLength -Descending | Select-Object -First 1).IPAddress
            if (![string]::IsNullOrWhiteSpace($localIp)) {
                $env:REACT_APP_API_BASE_URL = "http://$localIp:8080"
            } else {
                $env:REACT_APP_API_BASE_URL = 'http://localhost:8080'
            }
        }
        catch {
            $env:REACT_APP_API_BASE_URL = 'http://localhost:8080'
        }

        # Important: in development keep REACT_APP_API_URL relative to allow the React dev proxy to
        # receive requests from remote browsers (guest VSCode) and forward them to the local backend.
        $env:REACT_APP_API_URL = '/api'

        # Validação final para garantir que nunca escrevemos REACT_APP_API_BASE_URL inválido (ex: 'http://').
        $tmpUri = $null
        if (-not [System.Uri]::TryCreate($env:REACT_APP_API_BASE_URL, [System.UriKind]::Absolute, [ref]$tmpUri) -or [string]::IsNullOrWhiteSpace($tmpUri.Host)) {
            $env:REACT_APP_API_BASE_URL = 'http://localhost:8080'
        }

        $envFile = "PUBLIC_URL=$($env:PUBLIC_URL)`nREACT_APP_API_BASE_URL=$($env:REACT_APP_API_BASE_URL)`nREACT_APP_API_URL=/api`nPORT=$($env:PORT)`nGENERATE_SOURCEMAP=false"
        Write-EnvFileNoBom -Path "$scriptDir\.env" -Content $envFile
        Write-Host "OK - Environment configured" -ForegroundColor Green
        
        Write-Host "2. Stopping previous Java processes..." -ForegroundColor Yellow
        try {
            # Listar processos Java antes de matar
            $beforeJava = Get-Process java -ErrorAction SilentlyContinue
            if ($beforeJava) {
                Write-Host "Found $($beforeJava.Count) Java process(es)" -ForegroundColor Yellow
                $beforeJava | ForEach-Object { Write-Host "  - PID: $($_.Id), Name: $($_.ProcessName)" -ForegroundColor Gray }
            }
            
            # Forcar parada de todos os processos Java relacionados
            Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            # Verificar se ainda ha processos
            $remainingJava = Get-Process java -ErrorAction SilentlyContinue
            if ($remainingJava) {
                Write-Host "WARN - Ainda ha $($remainingJava.Count) processos Java. Forcando parada..." -ForegroundColor Yellow
                taskkill /F /IM java.exe 2>$null | Out-Null
                Start-Sleep -Seconds 2
            }
            
            $finalJava = Get-Process java -ErrorAction SilentlyContinue
            if ($finalJava) {
                Write-Host "ERROR - Ainda ha processos Java nao parados: $($finalJava.Count)" -ForegroundColor Red
                $finalJava | ForEach-Object { Write-Host "  - PID: $($_.Id)" -ForegroundColor Gray }
            } else {
                Write-Host "OK - Java processes stopped" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "OK - No Java processes running" -ForegroundColor Green
        }

        Write-Host "2.1 Stopping previous frontend process (port 3000)..." -ForegroundColor Yellow
        Stop-ProcessOnPort -Port 3000 -Label 'React dev server'
        Write-Host "OK - Frontend port checked" -ForegroundColor Green

        Write-Host "2.2 Forcing cleanup (kill java/node + remove target)..." -ForegroundColor Yellow
        try {
            # Em Windows, arquivos em target\classes podem ficar presos por java/node/antivirus.
            taskkill /F /IM java.exe 2>$null | Out-Null
            taskkill /F /IM node.exe 2>$null | Out-Null
        }
        catch {
            # ignore
        }

        Start-Sleep -Seconds 2

        if (Test-Path (Join-Path $scriptDir 'target')) {
            $maxAttempts = 3
            for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
                try {
                    Remove-Item -LiteralPath (Join-Path $scriptDir 'target') -Recurse -Force -ErrorAction Stop
                    break
                }
                catch {
                    if ($attempt -lt $maxAttempts) {
                        Write-Host "WARN - Falha ao remover target (tentativa $attempt/$maxAttempts). Tentando novamente..." -ForegroundColor Yellow
                        Start-Sleep -Seconds 2
                    } else {
                        Write-Host "ERROR - Nao foi possivel remover target. Feche VS Code/Explorer que estejam acessando target e tente novamente." -ForegroundColor Red
                        return $false
                    }
                }
            }
        }
        Write-Host "OK - Cleanup forced" -ForegroundColor Green

        $rtcBaseUrl = $null
        if ($WithRtc) {
            Write-Host "2.3 Starting RTC calculadora offline (WSL) on ports 18080/18081..." -ForegroundColor Yellow
            $rtcOk = Start-RtcCalculadoraOfflineWsl -RegimePort 18080 -SplitPort 18081
            if (-not $rtcOk) {
                Write-Host "ERROR - Nao foi possivel iniciar a calculadora RTC. Abortando DEV+RTC." -ForegroundColor Red
                return $false
            }
            $rtcBaseUrl = 'http://localhost:18080'
            Write-Host "OK - RTC base-url para o backend: $rtcBaseUrl" -ForegroundColor Green
            Start-Sleep -Seconds 3
        }
        
        Write-Host "3. Compiling backend (Maven)..." -ForegroundColor Yellow
        Push-Location $scriptDir
        $mvnLog = Join-Path $logDir ("maven-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log")
        Write-Host "Writing mvn log to: $mvnLog"
        mvn clean package -DskipTests 2>&1 | Tee-Object -FilePath $mvnLog -Append
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR - Maven build failed. See log: $mvnLog" -ForegroundColor Red
            Pop-Location
            return $false
        }
        Write-Host "OK - Backend compiled" -ForegroundColor Green
        Pop-Location
        
        Write-Host "4. Starting backend (PowerShell window - Java WAR port 8080)..." -ForegroundColor Yellow
        $jarPath = "$scriptDir\target\spdealer-1.0.0.war"
        if (!(Test-Path $jarPath)) {
            Write-Host "ERROR - WAR file not found at $jarPath" -ForegroundColor Red
            return $false
        }
        $backendScript = "cd '$scriptDir'; java -jar target\spdealer-1.0.0.war --server.port=8080"
        if ($WithRtc -and -not [string]::IsNullOrWhiteSpace($rtcBaseUrl)) {
            $backendScript = $backendScript + " --rtc.calculadora.base-url=$rtcBaseUrl"
        }
        $backendProc = Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoExit", "-Command", $backendScript `
            -PassThru
        Write-Host "OK - Backend window opened (PID: $($backendProc.Id))" -ForegroundColor Green
        
        Write-Host "5. Waiting for backend to be ready (30 segundos)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host "6. Preparing frontend (install dependencies) ..." -ForegroundColor Yellow
        Push-Location $scriptDir
        $npmLogDev = Join-Path $logDir ("npm-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log")
        Write-Host "Writing npm dev log to: $npmLogDev"

        # Use ProcessStartInfo to call npm robustly and avoid PowerShell NativeCommandError on warnings
        try {
            $env:NPM_CONFIG_PRODUCTION = 'false'

            $npmCmd = $null
            try { $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source } catch { }
            if (-not $npmCmd) { try { $npmCmd = (Get-Command npm -ErrorAction SilentlyContinue).Source } catch { } }
            if (-not $npmCmd) { $npmCmd = 'npm' }

            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = $npmCmd
            $psi.Arguments = 'install --legacy-peer-deps'
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError = $true
            $psi.UseShellExecute = $false
            $proc = [System.Diagnostics.Process]::Start($psi)
            $stdout = $proc.StandardOutput.ReadToEnd()
            $stderr = $proc.StandardError.ReadToEnd()
            $proc.WaitForExit()
            ($stdout + "`n" + $stderr) | Out-File -FilePath $npmLogDev -Append -Encoding UTF8
            Remove-Item Env:\NPM_CONFIG_PRODUCTION -ErrorAction SilentlyContinue
            if ($proc.ExitCode -ne 0) {
                Write-Host "ERROR - npm ci failed. See log: $npmLogDev" -ForegroundColor Red
                Pop-Location
                return $false
            }
        }
        catch {
            Write-Host "ERROR - Exception while running npm ci: $_" -ForegroundColor Red
            Pop-Location
            return $false
        }
        Pop-Location

        Write-Host "7. Starting frontend (PowerShell window - npm port 3000)..." -ForegroundColor Yellow
        $frontendScript = "cd '$scriptDir'; npm start"
        $frontendProc = Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoExit", "-Command", $frontendScript `
            -PassThru
        Write-Host "OK - Frontend window opened (PID: $($frontendProc.Id))" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "SUCCESS - Development started!" -ForegroundColor Green
        Write-Host "Two PowerShell windows should have opened:" -ForegroundColor Green
            Write-Host "  • Window 1: Backend (Maven Spring Boot - http://localhost:8080)" -ForegroundColor Cyan
            Write-Host "  • Window 2: Frontend (npm - http://localhost:3000)" -ForegroundColor Cyan
            Write-Host "Acesse para teste visual: http://localhost:3000/ferramentas/form-builder" -ForegroundColor Cyan
            Write-Host "(Em DEV, prefira 3000. A UI servida pelo WAR em 8080 pode ficar desatualizada se voce nao rodar npm run build antes do Maven.)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Close windows to stop services" -ForegroundColor Yellow
        Write-Host ""
        
        return $true
    }
    catch {
        Write-Host "ERROR - $_" -ForegroundColor Red
        return $false
    }
}

function Start-Production {
    Write-Host ""
    Write-Host "Starting PRODUCTION build..." -ForegroundColor Cyan
    Write-Host ""

    try {
        Write-Host "1. Setting production environment variables..." -ForegroundColor Yellow
        $env:PUBLIC_URL = '/spdealer/'
        $env:REACT_APP_API_BASE_URL = 'https://spdealer.seprocom.com.br'
        $env:REACT_APP_API_URL = 'https://spdealer.seprocom.com.br/api'
        $env:NODE_ENV = 'production'
        Write-Host "OK - Production environment configured" -ForegroundColor Green

        Write-Host "2. Stopping Java processes..." -ForegroundColor Yellow
        try {
            taskkill /F /IM java.exe 2>$null | Out-Null
            Start-Sleep -Seconds 2
        }
        catch { }
        Write-Host "OK - Java processes stopped" -ForegroundColor Green

        Write-Host "3. Building frontend with npm..." -ForegroundColor Yellow
        Push-Location $scriptDir
        $npmLog = Join-Path $logDir ("npm-prod-$(Get-Date -Format 'yyyyMMdd-HHmmss').log")
        Write-Host "Writing npm log to: $npmLog"
        # Ensure devDependencies are installed for the build (react-scripts is often a devDependency)
        $env:NPM_CONFIG_PRODUCTION = 'false'
        # Use ProcessStartInfo to capture output robustly and avoid PowerShell NativeCommandError on warnings
        try {
            # Resolve npm executable on Windows (prefer npm.cmd)
            $npmCmd = $null
            try { $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source } catch { }
            if (-not $npmCmd) { try { $npmCmd = (Get-Command npm -ErrorAction SilentlyContinue).Source } catch { } }
            if (-not $npmCmd) { $npmCmd = 'npm' }

            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = $npmCmd
            $psi.Arguments = 'install --legacy-peer-deps'
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError = $true
            $psi.UseShellExecute = $false
            $proc = [System.Diagnostics.Process]::Start($psi)
            $stdout = $proc.StandardOutput.ReadToEnd()
            $stderr = $proc.StandardError.ReadToEnd()
            $proc.WaitForExit()
            ($stdout + "`n" + $stderr) | Out-File -FilePath $npmLog -Append -Encoding UTF8
            if ($proc.ExitCode -ne 0) {
                Write-Host "ERROR - npm ci failed. See log: $npmLog" -ForegroundColor Red
                Pop-Location
                return $false
            }

            # Run build
            $psi.Arguments = 'run build'
            $proc = [System.Diagnostics.Process]::Start($psi)
            $stdout = $proc.StandardOutput.ReadToEnd()
            $stderr = $proc.StandardError.ReadToEnd()
            $proc.WaitForExit()
            ($stdout + "`n" + $stderr) | Out-File -FilePath $npmLog -Append -Encoding UTF8
            # Restore production install behavior after build
            Remove-Item Env:\NPM_CONFIG_PRODUCTION -ErrorAction SilentlyContinue
            if ($proc.ExitCode -ne 0) {
                Write-Host "ERROR - npm build failed. See log: $npmLog" -ForegroundColor Red
                Pop-Location
                return $false
            }
        }
        catch {
            Write-Host "ERROR - Exception while running npm: $_" -ForegroundColor Red
            Pop-Location
            return $false
        }
        Write-Host "OK - Frontend built" -ForegroundColor Green

        Write-Host "4. Building backend with Maven..." -ForegroundColor Yellow
        mvn clean package -DskipTests 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR - Maven build failed" -ForegroundColor Red
            Pop-Location
            return $false
        }
        Write-Host "OK - Backend built" -ForegroundColor Green

        Pop-Location

        Write-Host ""
        Write-Host "SUCCESS - Production build completed!" -ForegroundColor Green
        Write-Host "WAR file: $scriptDir\target\spdealer-1.0.0.war" -ForegroundColor Cyan
        Write-Host ""

        # Deploy remoto automático: substitui o WAR remoto sem backup e reinicia o serviço
        try {
            $remoteUser = 'root'
            $remoteHost = '192.168.10.70'
            $remoteWarPath = '/usr/local/tomcat10/webapps/spdealer.war'
            $remoteService = 'spdealer.service'
            $localWar = "$scriptDir\target\spdealer-1.0.0.war"

            if (!(Test-CommandExists -Name 'scp')) {
                Write-Host "ERROR - 'scp' nao encontrado no PATH. Instale OpenSSH client." -ForegroundColor Red
                Pop-Location
                return $false
            }
            if (!(Test-CommandExists -Name 'ssh')) {
                Write-Host "ERROR - 'ssh' nao encontrado no PATH. Instale OpenSSH client." -ForegroundColor Red
                Pop-Location
                return $false
            }

            Write-Host ("Copiando WAR para {0}@{1}:{2} (substituindo sem backup)..." -f $remoteUser, $remoteHost, $remoteWarPath) -ForegroundColor Yellow
            $scpTarget = $remoteUser + "@" + $remoteHost + ":" + $remoteWarPath
            & scp $localWar $scpTarget
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERROR - scp falhou. Verifique conexao/credenciais." -ForegroundColor Red
                Pop-Location
                return $false
            }
            Write-Host "OK - WAR copiado" -ForegroundColor Green

            Write-Host "Ajustando permissoes e propriedade e reiniciando '$remoteService'..." -ForegroundColor Yellow
            $remoteCmd = "chown tomcat:tomcat $remoteWarPath; chmod 0644 $remoteWarPath; systemctl restart $remoteService; systemctl status $remoteService --no-pager"
            & ssh "$remoteUser@$remoteHost" "$remoteCmd"
            if ($LASTEXITCODE -ne 0) {
                Write-Host "WARN - comando remoto retornou erro. Verifique manualmente no host remoto." -ForegroundColor Yellow
            }
            else {
                Write-Host "OK - Servico reiniciado no host remoto e permissoes ajustadas" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "WARN - Deploy remoto falhou: $_" -ForegroundColor Yellow
        }

        return $true
    }
    catch {
        Write-Host "ERROR - $_" -ForegroundColor Red
        return $false
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "SPDealer - MENU" -ForegroundColor Cyan
    Write-Host "1. Development (npm + Java)" -ForegroundColor White
    Write-Host "4. Development + RTC (WSL) (npm + Java + Calculadora RTC offline)" -ForegroundColor White
    Write-Host "2. Production (build only)" -ForegroundColor White
    Write-Host "3. Help" -ForegroundColor White
    Write-Host "0. Exit" -ForegroundColor White
    Write-Host ""
    
    $selection = Read-Host "Select option"
    return $selection
}

# Main Logic
if ($Mode -eq '') {
    $Mode = Show-Menu
}

switch ($Mode) {
    { $_ -eq 'dev' -or $_ -eq '1' } {
        Start-Development
    }

    { $_ -eq 'devrtc' -or $_ -eq '4' } {
        Start-Development -WithRtc
    }
    
    { $_ -eq 'prod' -or $_ -eq '2' } {
        Start-Production
    }
    
    { $_ -eq 'help' -or $_ -eq '3' } {
        Write-Host ""
        Write-Host "SPDealer Start System" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\start_system.ps1 [mode]" -ForegroundColor White
        Write-Host ""
        Write-Host "Modes:" -ForegroundColor Cyan
        Write-Host "  dev  or 1   - Start development (npm + Java)" -ForegroundColor White
        Write-Host "  devrtc or 4 - Start development + RTC (WSL) (porta RTC: 18080/18081)" -ForegroundColor White
        Write-Host "  prod or 2   - Build production (npm + Maven)" -ForegroundColor White
        Write-Host "  help or 3   - Show this help" -ForegroundColor White
        Write-Host ""
    }
    
    { $_ -eq '0' } {
        Write-Host "Exiting..." -ForegroundColor Yellow
    }
    
    default {
        Write-Host "Invalid option. Use 'help' for more info." -ForegroundColor Red
    }
}

$elapsed = (Get-Date) - $startTime
Write-Host "Total time: $($elapsed.TotalSeconds.ToString('0.00')) seconds" -ForegroundColor Cyan
Write-Host ""
