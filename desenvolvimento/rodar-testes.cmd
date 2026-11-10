@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
set falhas=0
set total=0

echo === Testes JavaScript ===
for %%f in (desenvolvimento\testes\*.test.mjs) do (
  set /a total+=1
  "app\runtime\node.exe" "%%f" >nul 2>&1
  if errorlevel 1 (echo   FALHOU  %%~nxf & set /a falhas+=1) else (echo   ok      %%~nxf)
)

echo.
echo === Testes Python ===
for %%f in (desenvolvimento\testes\test_*.py) do (
  set /a total+=1
  python "%%f" >nul 2>&1
  if errorlevel 1 (echo   FALHOU  %%~nxf & set /a falhas+=1) else (echo   ok      %%~nxf)
)

echo.
if !falhas! gtr 0 (
  echo !falhas! de !total! arquivos de teste falharam.
  exit /b 1
) else (
  echo Todos os !total! arquivos de teste passaram.
  exit /b 0
)
