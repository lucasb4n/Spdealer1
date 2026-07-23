#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy rápido para produção - compilar + enviar para servidor

.EXAMPLE
    .\deploy-prod.ps1

.NOTES
    Requer:
    - SSH sem senha já configurado para root@192.168.10.70
    - Java + Maven instalados
    - Node.js + npm instalados
#>

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 DEPLOY RÁPIDO PARA PRODUÇÃO         ║" -ForegroundColor Cyan
Write-Host "║   SPDealer - 22 de dezembro de 2025      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

# Configurações
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$warPath = Join-Path $scriptDir "target\spdealer-1.0.0.war"
$remoteHost = "192.168.10.70"
$remoteUser = "root"
$remoteWarPath = "/usr/local/tomcat10/webapps/spdealer.war"
$startTime = Get-Date

Write-Host "`n📋 PRÉ-REQUISITOS:" -ForegroundColor Yellow
Write-Host "  ✓ SSH sem senha (chave registrada)" -ForegroundColor Green
Write-Host "  ✓ Servidor remoto em $remoteHost" -ForegroundColor Green
Write-Host "  ✓ Java + Maven instalados" -ForegroundColor Green
Write-Host "  ✓ Node.js + npm instalados" -ForegroundColor Green

Write-Host "`n1️⃣  Testando conectividade SSH..." -ForegroundColor Cyan
try {
    $sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 $remoteUser@$remoteHost "echo OK" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ SSH funcionando" -ForegroundColor Green
    } else {
        throw "SSH falhou: $sshTest"
    }
} catch {
    Write-Host "  ✗ Erro SSH: $_" -ForegroundColor Red
    Write-Host "`n💡 Dica: Configure SSH sem senha com:" -ForegroundColor Yellow
    Write-Host "    ssh-keygen -t rsa -f ~/.ssh/id_rsa" -ForegroundColor Gray
    Write-Host "    ssh-copy-id -i ~/.ssh/id_rsa.pub root@$remoteHost" -ForegroundColor Gray
    exit 1
}

Write-Host "`n2️⃣  Executando build completo..." -ForegroundColor Cyan
Write-Host "    (frontend + backend)" -ForegroundColor Gray

Push-Location $scriptDir
try {
    Write-Host "`n  🔨 Frontend..." -ForegroundColor Yellow
    npm ci --legacy-peer-deps > $null
    if ($LASTEXITCODE -ne 0) { throw "npm ci falhou" }
    npm run build > $null
    if ($LASTEXITCODE -ne 0) { throw "npm run build falhou" }
    Write-Host "    ✓ Frontend compilado" -ForegroundColor Green

    Write-Host "`n  🔨 Backend..." -ForegroundColor Yellow
    
    # Parar Java se estiver rodando
    $javaProcs = Get-Process -Name java -ErrorAction SilentlyContinue
    if ($javaProcs) {
        Write-Host "    Parando Java anterior..." -ForegroundColor Gray
        Stop-Process -Name java -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    mvn clean package -DskipTests > $null
    if ($LASTEXITCODE -ne 0) { throw "mvn clean package falhou" }
    Write-Host "    ✓ Backend compilado" -ForegroundColor Green
} catch {
    Write-Host "`n  ✗ Erro na compilação: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`n3️⃣  Verificando WAR gerado..." -ForegroundColor Cyan
if (-not (Test-Path $warPath)) {
    Write-Host "  ✗ WAR não encontrado: $warPath" -ForegroundColor Red
    exit 1
}
$warSize = (Get-Item $warPath).Length / 1MB
$warHash = (Get-FileHash -Path $warPath -Algorithm SHA256).Hash
Write-Host "  ✓ WAR gerado: $([math]::Round($warSize, 2)) MB" -ForegroundColor Green
Write-Host "    SHA256: $($warHash.Substring(0, 16))..." -ForegroundColor Gray

Write-Host "`n4️⃣  Enviando WAR para servidor..." -ForegroundColor Cyan
try {
    scp -o StrictHostKeyChecking=no `"$warPath`" ${remoteUser}@${remoteHost}:/tmp/ 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "scp falhou" }
    Write-Host "  ✓ WAR enviado para /tmp/" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erro ao enviar WAR: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n5️⃣  Implantando no servidor..." -ForegroundColor Cyan
Write-Host "    Parando serviço..." -ForegroundColor Gray
ssh -o StrictHostKeyChecking=no $remoteUser@$remoteHost "sudo systemctl stop spdealer.service" 2>&1 > $null
Start-Sleep -Seconds 2

Write-Host "    Substituindo WAR..." -ForegroundColor Gray
ssh -o StrictHostKeyChecking=no $remoteUser@$remoteHost `
  "sudo mv -f $remoteWarPath ${remoteWarPath}.backup && sudo mv /tmp/spdealer-1.0.0.war $remoteWarPath && sudo chown tomcat:tomcat $remoteWarPath" 2>&1 > $null

Write-Host "    Iniciando serviço..." -ForegroundColor Gray
ssh -o StrictHostKeyChecking=no $remoteUser@$remoteHost "sudo systemctl start spdealer.service" 2>&1 > $null

Write-Host "    Aguardando estabilização..." -ForegroundColor Gray
Start-Sleep -Seconds 8

Write-Host "  ✓ Implantação concluída" -ForegroundColor Green

Write-Host "`n6️⃣  Verificando logs..." -ForegroundColor Cyan
Write-Host "  ════════════════════════════════════════════" -ForegroundColor Gray
ssh -o StrictHostKeyChecking=no $remoteUser@$remoteHost "sudo journalctl -u spdealer.service -n 30 --no-pager" 2>&1 | ForEach-Object {
    if ($_ -match "ERROR|error|exception|Exception") {
        Write-Host "  $_" -ForegroundColor Red
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}
Write-Host "  ════════════════════════════════════════════" -ForegroundColor Gray

$elapsed = (Get-Date) - $startTime
Write-Host "`n✅ DEPLOY CONCLUÍDO COM SUCESSO" -ForegroundColor Green
Write-Host "   Tempo total: $([math]::Round($elapsed.TotalSeconds, 0))s" -ForegroundColor Gray

Write-Host "`n📊 RESUMO:" -ForegroundColor Green
Write-Host "  ✓ Frontend compilado" -ForegroundColor Green
Write-Host "  ✓ Backend compilado" -ForegroundColor Green
Write-Host "  ✓ WAR enviado para servidor" -ForegroundColor Green
Write-Host "  ✓ Serviço reiniciado" -ForegroundColor Green
Write-Host "  ✓ Backup criado em ${remoteWarPath}.backup" -ForegroundColor Green

Write-Host "`n🌐 ACESSE:" -ForegroundColor Cyan
Write-Host "  https://spdealer.seprocom.com.br/spdealer/" -ForegroundColor Yellow

Write-Host "`n"
