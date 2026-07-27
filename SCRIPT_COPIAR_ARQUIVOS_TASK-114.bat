@echo off
REM SCRIPT DE COPIA - TASK-114 FILTROS DE CLASSIFICACOES
REM Autor: GitHub Copilot
REM Data: 2025-11-01

setlocal enabledelayedexpansion

set "projectRoot=h:\DISCO_D\Desenvolvimento\Seprocom\spdealer"

echo.
echo ========================================
echo SCRIPT DE COPIA - TASK-114
echo ========================================
echo.

REM Criar diretorios se nao existirem
echo Criando diretorios...
mkdir "%projectRoot%\src\main\java\com\spdealer\api\dto" 2>nul
mkdir "%projectRoot%\src\main\java\com\spdealer\api\service" 2>nul
mkdir "%projectRoot%\src\main\java\com\spdealer\api\controller" 2>nul
mkdir "%projectRoot%\src\main\java\com\spdealer\api\repository" 2>nul
mkdir "%projectRoot%\src\components\TaskManager" 2>nul
mkdir "%projectRoot%\src\services" 2>nul
mkdir "%projectRoot%\src\hooks" 2>nul
mkdir "%projectRoot%\src\types" 2>nul
mkdir "%projectRoot%\src\__tests__\components" 2>nul
mkdir "%projectRoot%\src\__tests__\hooks" 2>nul
mkdir "%projectRoot%\src\test\java\com\spdealer\api\service" 2>nul
mkdir "%projectRoot%\docs" 2>nul

echo [OK] Diretorios criados
echo.

REM Backend
echo ========================================
echo COPIANDO ARQUIVOS BACKEND
echo ========================================
echo.

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_1-DTODTO.java" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_1-DTODTO.java" "%projectRoot%\src\main\java\com\spdealer\api\dto\ClassificationFilterDTO.java" >nul
    echo [OK] ClassificationFilterDTO.java
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_1-DTODTO.java nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_2-SERVICE.java" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_2-SERVICE.java" "%projectRoot%\src\main\java\com\spdealer\api\service\ClassificationFilterService.java" >nul
    echo [OK] ClassificationFilterService.java
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_2-SERVICE.java nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_3-CONTROLLER.java" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_3-CONTROLLER.java" "%projectRoot%\src\main\java\com\spdealer\api\controller\ClassificationFilterController.java" >nul
    echo [OK] ClassificationFilterController.java
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_3-CONTROLLER.java nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_4A-REPOSITORY.java" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_4A-REPOSITORY.java" "%projectRoot%\src\main\java\com\spdealer\api\repository\TaskClassificationRepository.java" >nul
    echo [OK] TaskClassificationRepository.java
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_4A-REPOSITORY.java nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_4B-SQL_QUERIES.sql" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_4B-SQL_QUERIES.sql" "%projectRoot%\docs\SQL_CLASSIFICATION_FILTERS.sql" >nul
    echo [OK] SQL_CLASSIFICATION_FILTERS.sql
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_4B-SQL_QUERIES.sql nao encontrado
)

echo.

REM Frontend
echo ========================================
echo COPIANDO ARQUIVOS FRONTEND
echo ========================================
echo.

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_1-FILTERBAR.tsx" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_1-FILTERBAR.tsx" "%projectRoot%\src\components\TaskManager\FilterBar.tsx" >nul
    echo [OK] FilterBar.tsx
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_1-FILTERBAR.tsx nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_2-SERVICE.ts" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_2-SERVICE.ts" "%projectRoot%\src\services\ClassificationFilterService.ts" >nul
    echo [OK] ClassificationFilterService.ts
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_2-SERVICE.ts nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_3-HOOK.ts" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_3-HOOK.ts" "%projectRoot%\src\hooks\useFilterClassifications.ts" >nul
    echo [OK] useFilterClassifications.ts
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_3-HOOK.ts nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_4-TYPES.ts" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_4-TYPES.ts" "%projectRoot%\src\types\ClassificationFilter.ts" >nul
    echo [OK] ClassificationFilter.ts
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_4-TYPES.ts nao encontrado
)

echo.

REM Testes
echo ========================================
echo COPIANDO ARQUIVOS DE TESTES
echo ========================================
echo.

if exist "%projectRoot%\EJEMPLO_CODIGO_BACKEND_5-TEST.java" (
    copy "%projectRoot%\EJEMPLO_CODIGO_BACKEND_5-TEST.java" "%projectRoot%\src\test\java\com\spdealer\api\service\ClassificationFilterServiceTest.java" >nul
    echo [OK] ClassificationFilterServiceTest.java
) else (
    echo [ERRO] EJEMPLO_CODIGO_BACKEND_5-TEST.java nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_5-TEST.test.tsx" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_5-TEST.test.tsx" "%projectRoot%\src\__tests__\components\FilterBar.test.tsx" >nul
    echo [OK] FilterBar.test.tsx
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_5-TEST.test.tsx nao encontrado
)

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_6-HOOK.test.ts" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_6-HOOK.test.ts" "%projectRoot%\src\__tests__\hooks\useFilterClassifications.test.ts" >nul
    echo [OK] useFilterClassifications.test.ts
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_6-HOOK.test.ts nao encontrado
)

echo.

REM Documentacao
echo ========================================
echo COPIANDO DOCUMENTACAO
echo ========================================
echo.

if exist "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_5-INTEGRACAO.tsx" (
    copy "%projectRoot%\EJEMPLO_CODIGO_FRONTEND_5-INTEGRACAO.tsx" "%projectRoot%\docs\FILTRO_INTEGRACAO_GUIA.tsx" >nul
    echo [OK] FILTRO_INTEGRACAO_GUIA.tsx
) else (
    echo [ERRO] EJEMPLO_CODIGO_FRONTEND_5-INTEGRACAO.tsx nao encontrado
)

if exist "%projectRoot%\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md" (
    copy "%projectRoot%\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md" "%projectRoot%\docs\FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md" >nul
    echo [OK] FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md
) else (
    echo [ERRO] FILTRO_CLASSIFICACOES_GUIA_COMPLETO.md nao encontrado
)

if exist "%projectRoot%\RESUMO_EXECUTIVO_TASK-114.md" (
    copy "%projectRoot%\RESUMO_EXECUTIVO_TASK-114.md" "%projectRoot%\docs\RESUMO_EXECUTIVO_TASK-114.md" >nul
    echo [OK] RESUMO_EXECUTIVO_TASK-114.md
) else (
    echo [ERRO] RESUMO_EXECUTIVO_TASK-114.md nao encontrado
)

echo.
echo ========================================
echo RESUMO FINAL
echo ========================================
echo.
echo Todos os arquivos foram copiados para os diretorios do projeto!
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. COMPILAR BACKEND:
echo    mvn clean package -DskipTests
echo.
echo 2. TESTAR BACKEND:
echo    mvn test -Dtest=ClassificationFilterServiceTest
echo.
echo 3. TESTAR FRONTEND:
echo    npm test -- FilterBar.test.tsx
echo.
echo 4. INTEGRAR:
echo    Abra docs\FILTRO_INTEGRACAO_GUIA.tsx e siga as instrucoes
echo.
echo 5. VERIFICAR VISUALMENTE:
echo    npm start e teste os filtros no TaskManager
echo.
echo ========================================
echo SCRIPT FINALIZADO
echo ========================================
echo.
pause
