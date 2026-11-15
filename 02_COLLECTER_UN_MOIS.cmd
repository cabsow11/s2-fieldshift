@echo off
cd /d "%~dp0"
python scripts\collect_harmony_region.py run --start 2015-01-01 --end 2015-01-31 --max-jobs 1 --polls 8 --poll-interval 15 --retry-missing
echo.
pause
