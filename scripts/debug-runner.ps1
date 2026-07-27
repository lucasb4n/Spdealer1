<#
  scripts/debug-runner.ps1
  Testa disponibilidade de executáveis e demonstra comandos PowerShell corretos.
  Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\debug-runner.ps1
#>

Write-Host "=== DEBUG RUNNER: Verificando ambiente PowerShell e utilitários SSH ==="

function Test-CommandExistence {
    param([string]$cmd)
    $path = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($null -ne $path) {
        Write-Host "OK: $cmd -> $($path.Source)"
        return $true
    } else {
        Write-Host "MISSING: $cmd"
        return $false
    }
}

# Testar utilitários comuns
Test-CommandExistence -cmd ssh
Test-CommandExistence -cmd scp
Test-CommandExistence -cmd plink
Test-CommandExistence -cmd pscp

Write-Host "`n=== Teste de comando remoto (dry-run) ==="
Write-Host "Nota: não executa comandos remotos por padrão. Para testar, defina as variaveis abaixo e descomente a chamda de Invoke-CommandRemote."

$remoteHost = '192.168.10.70'
$remoteUser = 'root'
#$remotePass = 'k15720'   # evitar hardcode, usar variaveis de ambiente

function Invoke-CommandRemote {
    param(
        [string]$host,
        [string]$user,
        [string]$cmd
    )
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        $msg = "Executando via OpenSSH: ssh $($user)@$($host) '" + $cmd + "'"
        Write-Host $msg
        & ssh "$($user)@$($host)" $cmd
    } elseif (Get-Command plink -ErrorAction SilentlyContinue) {
        $msg2 = "Executando via plink: plink -ssh $($user)@$($host) '" + $cmd + "'"
        Write-Host $msg2
        & plink -ssh "$($user)@$($host)" $cmd
    } else {
        Write-Host "Nenhum cliente SSH encontrado. Instale OpenSSH ou PuTTY (plink)."
    }
}

Write-Host "`nArquivo 'COPILOT_POWERSHELL_ISSUES.md' criado em scripts/  verifique e adicione problemas encontrados."

Write-Host "`nPara testar um comando remoto real (apenas se souber o host está acessível), descomente a linha abaixo e execute novamente."
# Invoke-CommandRemote -host $remoteHost -user $remoteUser -cmd 'ls -la /usr/local/tomcat10/webapps'

Write-Host "`nFim do debug-runner. Se quiser, execute:"
Write-Host '  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\debug-runner.ps1'
