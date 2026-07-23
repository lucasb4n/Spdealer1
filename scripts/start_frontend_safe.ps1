<#
.SYNOPSIS
  Inicia o frontend (`npm start`) em nova janela PowerShell ou realiza `npm run build`.

.DESCRIPTION
  - Por padrão abre uma nova janela PowerShell e executa `npm start` no diretório do projeto.
  - Aceita parâmetro `-Build` para apenas realizar `npm run build` e sair.

.EXAMPLE
  .\start_frontend_safe.ps1            # abre nova janela com npm start
  .\start_frontend_safe.ps1 -Build    # executa npm run build e retorna
>
param(
    [switch]$Build
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

if ($Build) {
    Write-Host "Executando 'npm run build'..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build concluído com sucesso." -ForegroundColor Green
    } else {
        Write-Host "Build finalizou com erros (exit $LASTEXITCODE)." -ForegroundColor Red
    }
    exit $LASTEXITCODE
}

# Abrir nova janela PowerShell com npm start (não bloqueia o terminal atual)
Write-Host "Abrindo nova janela PowerShell e iniciando 'npm start'..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$scriptDir'; npm start" -WindowStyle Normal
