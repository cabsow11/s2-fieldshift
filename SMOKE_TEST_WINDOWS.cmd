@echo off
cd /d "%~dp0"
python scripts\smoke_earthdata.py
if errorlevel 1 (echo SMOKE TEST FAILED. See errors above. & exit /b 1)
echo SMOKE TEST PASSED.
