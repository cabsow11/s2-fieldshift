@echo off
cd /d "%~dp0"
python scripts\collect_harmony_region.py run --start 2015-01-01 --end 2025-12-31 --max-jobs 4 --polls 8 --poll-interval 15 --retry-missing
echo.
pause
