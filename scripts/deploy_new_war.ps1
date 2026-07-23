<#
 scripts/deploy_new_war.ps1
 Script simples para empacotar o projeto (Maven), copiar o WAR para o servidor Tomcat e fazer o deploy.
 Ajuste as variáveis abaixo para seu ambiente (usuário, host, paths e nome do serviço Tomcat).
 Uso: powershell -ExecutionPolicy Bypass -File .\scripts\deploy_new_war.ps1
 #>

Param(
    [string]$RemoteUser = 'root',
    [string]$RemoteHost = '192.168.10.70',
    [string]$RemoteTmpPath = '/tmp',
    [string]$RemoteWebappsPath = '/usr/local/tomcat10/webapps',
    [string]$RemoteServiceCandidates = 'spdealer.service tomcat10 tomcat', # space separated candidates
    [switch]$SkipMavenBuild
)

function Run-Local {
    param([string]$cmd)
    Write-Host "RUN (local): $cmd"
    iex $cmd
}

function Run-Remote {
    param([string]$user, [string]$remoteHost, [string]$cmd)
    # Wrap the remote command in single quotes for ssh; avoid variable collisions
    $escaped = $cmd -replace "'", "'\\''"
    $full = "ssh $user@$remoteHost '$escaped'"
    Write-Host "RUN (remote): $full"
    iex $full
}

# Run remote and capture output (returns array of output lines)
function Run-RemoteCapture {
    param([string]$user, [string]$remoteHost, [string]$cmd)
    $escaped = $cmd -replace "'", "'\\''"
    $full = "ssh $user@$remoteHost '$escaped'"
    Write-Host "RUN (remote-capture): $full"
    $output = Invoke-Expression $full 2>&1
    return $output
}

# 1) Build Maven (unless skip)
if (-not $SkipMavenBuild) {
    Write-Host "==> Executando: mvn clean package -DskipTests" -ForegroundColor Cyan
    & mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Error "mvn build falhou (exit $LASTEXITCODE). Aborting."
        exit $LASTEXITCODE
    }
}

# 2) localizar WAR gerado
$warFiles = Get-ChildItem -Path .\target -Filter *.war -Recurse | Sort-Object LastWriteTime -Descending
if ($warFiles.Count -eq 0) {
    Write-Error "Nenhum arquivo .war encontrado em target/. Verifique o build."
    exit 1
}
$war = $warFiles[0].FullName
Write-Host "Arquivo WAR encontrado: $war" -ForegroundColor Green

# 3) copiar WAR para servidor remoto
$remoteWarPath = "$RemoteTmpPath/$(Split-Path $war -Leaf)"
Write-Host "==> Copiando $war -> ${RemoteUser}@${RemoteHost}:$remoteWarPath" -ForegroundColor Cyan
$scpCmd = "scp.exe `"$war`" ${RemoteUser}@${RemoteHost}:`"$remoteWarPath`""
Write-Host $scpCmd
iex $scpCmd
if ($LASTEXITCODE -ne 0) { Write-Error "scp falhou com exit $LASTEXITCODE"; exit $LASTEXITCODE }

# 3.a) calcular sha256 local e validar no remoto
try {
    $localHash = (Get-FileHash -Path $war -Algorithm SHA256).Hash.ToLower()
    Write-Host "Local SHA256: $localHash"
} catch {
    Write-Error "Falha ao calcular hash local: $_"
    exit 1
}

# calcular sha256 no remoto e comparar
$remoteHashOut = Run-RemoteCapture -user $RemoteUser -remoteHost $RemoteHost -cmd "sha256sum '$remoteWarPath' || shasum -a 256 '$remoteWarPath'"
if (-not $remoteHashOut) {
    Write-Error "Nao foi possivel obter hash remoto para $remoteWarPath"
    exit 1
}
$firstLine = $remoteHashOut | Select-Object -First 1
$remoteHash = ($firstLine -split '\\s+')[0].ToLower()
Write-Host "Remote SHA256: $remoteHash"
if ($localHash -ne $remoteHash) {
    Write-Error "SHA256 mismatch: local ($localHash) != remote ($remoteHash). Aborting deploy."
    exit 2
}

# 4) Backup e deploy remoto (movimenta arquivos e reinicia serviço)
$remoteCommands = @()
# criar backup do webapp existente se presente (montado em um único script remoto)
$timestamp = (Get-Date).ToString('yyyyMMddHHmmss')
$bashScript = @"
if [ -d "$($RemoteWebappsPath)/spdealer" ]; then
    sudo mv "$($RemoteWebappsPath)/spdealer" "$($RemoteWebappsPath)/spdealer.bak-$timestamp"
fi
if [ -f "$($RemoteWebappsPath)/spdealer.war" ]; then
    sudo mv "$($RemoteWebappsPath)/spdealer.war" "$($RemoteWebappsPath)/spdealer.war.bak-$timestamp"
fi
sudo mv "$($remoteWarPath)" "$($RemoteWebappsPath)/spdealer.war"
"@

$remoteCommands += $bashScript

# tentar parar serviço (tenta vários nomes comuns)
foreach ($svc in $RemoteServiceCandidates.Split(' ')) {
        $remoteCommands += "sudo systemctl stop $svc 2>/dev/null || true"
}

# garantir permissões e iniciar serviços
$remoteCommands += "sudo chown -R tomcat:tomcat '$($RemoteWebappsPath)/spdealer*' 2>/dev/null || true"
foreach ($svc in $RemoteServiceCandidates.Split(' ')) {
        $remoteCommands += "sudo systemctl start $svc 2>/dev/null || true"
}

# esperar e checar
$remoteCommands += "sleep 3"
$remoteCommands += "sudo ls -la '$($RemoteWebappsPath)/spdealer' 2>/dev/null || true"
$remoteCommands += "sudo journalctl -u $($RemoteServiceCandidates.Split(' ')[0]) -n 100 --no-pager 2>/dev/null || true"

$joined = $remoteCommands -join "; "
Run-Remote -user $RemoteUser -remoteHost $RemoteHost -cmd $joined

Write-Host "Deploy finalizado. Verifique logs e endpoints via proxy." -ForegroundColor Green
Write-Host "Exemplo de testes:" -ForegroundColor Yellow
Write-Host "curl -H \"Host: spdealer.seprocom.com.br\" http://192.168.10.30/spdealer/api/filiais" -ForegroundColor White
Write-Host "curl -H \"Host: spdealer.seprocom.com.br\" http://192.168.10.30/spdealer/" -ForegroundColor White

# fim
