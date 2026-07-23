Set-Location 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01'
Write-Host '>>> Frontend: definindo REACT_APP_* e iniciando (npm start)'
[Environment]::SetEnvironmentVariable('REACT_APP_API_BASE_URL','http://localhost:8080','Process')
[Environment]::SetEnvironmentVariable('REACT_APP_API_URL','http://localhost:8080/api','Process')
[Environment]::SetEnvironmentVariable('PUBLIC_URL','/','Process')
[Environment]::SetEnvironmentVariable('PORT','3000','Process')
[Environment]::SetEnvironmentVariable('HOST','localhost','Process')
[Environment]::SetEnvironmentVariable('DANGEROUSLY_DISABLE_HOST_CHECK','true','Process')
cd 'E:\Desenvolvimento\Seprocom\spdealer\spdealer.01'
if (Test-Path package.json) { npm start } else { Write-Host 'package.json nao encontrado'; exit 1 }
