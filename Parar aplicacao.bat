@echo off
echo.
echo ===================================================
echo   ENCERRANDO ACTIVITIES CONTROL
echo ===================================================
echo.

echo Parando Processos do Node.js (Servidor Backend e Frontend VITE)...
taskkill /F /IM node.exe /T 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo [SUCESSO] Todos os modulos do Node foram encerrados.
) else (
    echo [AVISO] Nenhum processo do Node estava rodando.
)

echo.
echo A aplicacao foi desligada. O banco de dados SQLite salvo no disco nao precisa de desligamento.
echo.
pause
