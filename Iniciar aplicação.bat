@echo off
title Activities Control - Iniciando...

echo.
echo ============================================
echo   Activities Control - Iniciando Aplicacao
echo ============================================
echo.

REM Inicia o servidor backend (Express + Prisma/SQLite)
echo [1/2] Iniciando servidor backend (porta 3001)...
start "Backend - Activities Control" cmd /k "cd /d "%~dp0server" && npm run dev"

REM Aguarda 3 segundos para o backend iniciar antes do frontend
timeout /t 3 /nobreak >nul

REM Inicia o frontend (Vite)
echo [2/2] Iniciando frontend (porta 5173)...
start "Frontend - Activities Control" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Aplicacao iniciada! Acesse: http://localhost:5173
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
