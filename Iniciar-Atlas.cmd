@echo off
rem ============================================================
rem  PLANO B - use este arquivo somente se o Silvengard-Atlas.exe
rem  nao abrir (bloqueio do Windows/antivirus).
rem  Ele liga o servidor direto e abre o navegador.
rem  Para encerrar, use Encerrar-Atlas.cmd.
rem ============================================================
setlocal
cd /d "%~dp0"

if not exist "app\serve.py" (
  echo ERRO: nao encontrei a pasta "app" ao lado deste arquivo.
  pause
  exit /b 1
)

set PY=
where pythonw.exe >nul 2>&1 && set PY=pythonw.exe
if not defined PY where python.exe >nul 2>&1 && set PY=python.exe
if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PY="%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe"
if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PY="%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PY="%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe"

if not defined PY (
  echo ERRO: Python 3 nao encontrado neste computador.
  echo Instale de https://www.python.org/downloads/windows/
  echo e marque a opcao "Add python.exe to PATH".
  pause
  exit /b 1
)

start "" /b %PY% "app\serve.py"
echo Atlas iniciado. O navegador deve abrir em http://127.0.0.1:8765/
echo Para encerrar, use Encerrar-Atlas.cmd.
timeout /t 3 >nul
