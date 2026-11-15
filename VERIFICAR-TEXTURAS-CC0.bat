@echo off
cd /d "%~dp0"
echo [Silvengard] Texturas externas CC0 instaladas:
set /a count=0
for %%N in (paving stone rock wood roofing ground mud) do (
  if exist "app\dist\textures\cc0\%%N.jpg" (
    echo   [OK] %%N.jpg
    set /a count+=1
  ) else (
    echo   [FALTA] %%N.jpg
  )
)
echo.
echo Total: %count% de 7 arquivos CC0.
if %count% LSS 7 echo Para baixar, rode INSTALAR-TEXTURAS-CC0.bat
pause
