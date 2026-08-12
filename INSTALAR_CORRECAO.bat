@echo off
REM Script para corrigir encoding UTF-8 no Windows
REM Execute este arquivo para instalar a correção automaticamente

echo.
echo ============================================================
echo   Corretor de Encoding UTF-8 - Smoke Garden
echo ============================================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js não encontrado!
    echo Instale Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Iniciando instalação...
echo.

REM Executar o script de instalação
node install-fix.js

if errorlevel 1 (
    echo.
    echo ERRO: Falha na instalação
    pause
    exit /b 1
)

echo.
echo Tudo pronto! 
echo.
echo Próximas etapas:
echo 1. Abra o terminal em: frontend
echo 2. Execute: npm run build
echo.
pause
