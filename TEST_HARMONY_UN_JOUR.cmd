@echo off
cd /d "%~dp0"
python scripts\harmony_recovery.py smoke --start 2015-01-01 --end 2015-01-01 --polls 1
echo.
echo A running job is normal. Save its job ID and diagnose it later.
pause
