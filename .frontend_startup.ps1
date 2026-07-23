# Frontend startup wrapper
Set-Location 'C:\Desenvolvimento\Seprocom\spdealer\spdealer.01'

[Environment]::SetEnvironmentVariable('REACT_APP_API_BASE_URL','http://localhost:8080','Process')
[Environment]::SetEnvironmentVariable('REACT_APP_API_URL','http://localhost:8080/api','Process')
[Environment]::SetEnvironmentVariable('PUBLIC_URL','/','Process')
[Environment]::SetEnvironmentVariable('PORT','3000','Process')
[Environment]::SetEnvironmentVariable('DANGEROUSLY_DISABLE_HOST_CHECK','true','Process')

Write-Host '[FRONTEND] Iniciando React dev server' -ForegroundColor Cyan

if (Test-Path package.json) {
    npm start
} else {
    Write-Host '[FRONTEND] ERRO: package.json nao encontrado!' -ForegroundColor Red
    exit 1
}

