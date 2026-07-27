Write-Host "Instalando dependencias npm..." -ForegroundColor Cyan
npm install --prefer-offline 2>&1 | Out-String

Write-Host "Iniciando frontend..." -ForegroundColor Green
npm start
