@echo off
setlocal enabledelayedexpansion

set MODE=%1

if "%MODE%"=="" (
    echo.
    echo SPDealer - MENU
    echo.
    echo 1. Development (npm + Java)
    echo 2. Production (build only)
    echo 3. Help
    echo 0. Exit
    echo.
    set /p MODE="Select option: "
)

if "%MODE%"=="dev" goto :dev
if "%MODE%"=="1" goto :dev
if "%MODE%"=="prod" goto :prod
if "%MODE%"=="2" goto :prod
if "%MODE%"=="help" goto :help
if "%MODE%"=="3" goto :help
if "%MODE%"=="0" goto :end

echo Invalid option.
goto :end

:dev
echo.
echo Starting DEVELOPMENT mode...
echo.

echo 1. Setting environment variables...
set PUBLIC_URL=/spdealer/
set REACT_APP_API_BASE_URL=http://localhost:8080
set REACT_APP_API_URL=http://localhost:8080/api
set PORT=3000
set GENERATE_SOURCEMAP=false
echo OK

echo 2. Stopping Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK

echo 3. Starting backend (Maven Spring Boot port 8080)...
start /min mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8080"
echo OK - Backend started

echo 4. Waiting for backend...
timeout /t 5 /nobreak >nul

echo 5. Starting frontend (npm port 3000)...
start cmd /k npm start
echo OK - Frontend started

echo.
echo SUCCESS - Development started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
goto :end

:prod
echo.
echo Starting PRODUCTION build...
echo.

echo 1. Setting production environment variables...
set PUBLIC_URL=/spdealer/
set REACT_APP_API_BASE_URL=https://spdealer.seprocom.com.br
set REACT_APP_API_URL=https://spdealer.seprocom.com.br/api
set NODE_ENV=production
set GENERATE_SOURCEMAP=false
echo OK

echo 2. Stopping Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK

echo 3. Building frontend with npm...
call npm ci
call npm run build
if errorlevel 1 (
    echo ERROR - npm build failed
    goto :end
)
echo OK

echo 4. Building backend with Maven...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR - Maven build failed
    goto :end
)
echo OK

echo.
echo SUCCESS - Production build completed!
echo WAR file: target\spdealer-1.0.0.war
echo.
goto :end

:help
echo.
echo SPDealer Start System
echo.
echo Usage: start_system.bat [mode]
echo.
echo Modes:
echo   dev  or 1   - Start development (npm + Java)
echo   prod or 2   - Build production (npm + Maven)
echo   help or 3   - Show this help
echo.
goto :end

:end
endlocal
