@echo off
cd /d "%~dp0"
python scripts\harmony_recovery.py diagnose --job fd8a7f8f-951a-431d-8f63-b0ef173f2e87
echo.
echo Diagnostics in earthdata_archive\reports\
pause
