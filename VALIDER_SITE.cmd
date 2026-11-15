@echo off
cd /d "%~dp0"
call npm install
if errorlevel 1 exit /b 1
call npm test
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
echo Vite build and tests passed.
pause
