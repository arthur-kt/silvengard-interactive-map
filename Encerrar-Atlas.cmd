@echo off
rem ============================================================
rem  PLANO B - encerra o servidor aberto por Iniciar-Atlas.cmd
rem  (ou qualquer servidor do Atlas registrado em app\logs\atlas.port).
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set ACHOU=0
if exist "app\logs\atlas.port" (
  for /f "tokens=2 delims==" %%p in ('findstr /b "pid=" "app\logs\atlas.port" 2^>nul') do (
    taskkill /pid %%p /f >nul 2>&1 && set ACHOU=1
  )
  del "app\logs\atlas.port" >nul 2>&1
)

if "%ACHOU%"=="1" (
  echo Servidor do Atlas encerrado.
) else (
  echo Nao havia servidor do Atlas registrado em app\logs\atlas.port.
  echo Se a pagina continuar aberta, feche a janela do navegador; o servidor ela nao fecha.
)
timeout /t 3 >nul
