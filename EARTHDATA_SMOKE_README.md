# NASA Earthdata acquisition gate (Windows)

Run `SMOKE_TEST_WINDOWS.cmd` from the extracted project, or:

```cmd
python scripts\smoke_earthdata.py
```

This requests *seven actual days* of NASA IMERG Final 2015-01-01 through 2015-01-07, tests that all seven dates have persisted records, verifies Kaolack ROI coordinates and physical precipitation value sanity, and stops after three consecutive extraction errors. If the test passes, run:

```cmd
python scripts\sync_earthdata.py --product imerg --start 2015-01-01 --end 2025-12-31
```

The collector reuses `earthdata_archive`. SMAP can be tested with:

```cmd
python scripts\sync_earthdata.py --product smap --start 2015-04-01 --end 2015-04-07 --cadence daily
```

**Requirements:** Python packages already installed; Earthdata login; working internet. Tests against actual NASA granules must run on the computer with Earthdata access. The test writes only to `earthdata_archive` and does not delete existing validated outputs. Never post passwords or tokens.

**Release gate:** A successful smoke test demonstrates the pipeline works for seven daily dates, not that the full 2015–2025 archive is complete. Inspect `earthdata_archive/imerg_coverage.json` after the full run.
