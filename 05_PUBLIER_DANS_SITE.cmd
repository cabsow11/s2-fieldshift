@echo off
cd /d "%~dp0"
python scripts\collect_harmony_region.py publish --start 2015-01-01 --end 2025-12-31
echo.
pause
