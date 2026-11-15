# S² FieldShift — All-in-one V2.1.3 (Harmony Recovery)

This archive includes the complete V2.1.2 React/Vite application and previous native `earthaccess` collector plus a **new bounded Harmony recovery and diagnostic script**. No external credentials are bundled. Historical global satellite coverage is NOT bundled.

## FIRST — diagnose the existing 8-granule Harmony job

Run `DIAGNOSTIC_HARMONY_EXISTANT.cmd`. The script prints the exact NASA `errors` and `warnings`, and attempts to recover any deliverables from `complete_with_errors` jobs. Files are validated, not counted as complete by mere download. Reports are written to `earthdata_archive/reports/`.

If the job returns `complete_with_errors`, check `..._diagnosis.json` for reasons. Do not automatically submit 2015–2025. NASA may reject a service or variable even when request submission succeeds.

## SECOND — if NASA's diagnostic permits, test one day

Run `TEST_HARMONY_UN_JOUR.cmd`. It **submits** a one-day regional request and prints the job ID. If status is `running`, use `python scripts\harmony_recovery.py diagnose --job YOUR_JOB_ID`. The workflow never spins forever. A one-day test can still fail due to service support; fix the root cause based on NASA errors before proceeding.

## THIRD — monthly collection (after a successful real test)

`python scripts\harmony_recovery.py collect --start 2015-01-01 --end 2015-01-31 --submit-only`

Retrieve by job ID using `diagnose --job ...`. Each request is limited to 31 days to limit server load, and a completed month does NOT imply complete eleven-year coverage. The previous `sync_earthdata.py` remains available as a documented fallback but downloads complete source granules.

## Site validation

Run `VALIDER_SITE.cmd` on Windows. Alternatively `npm install && npm test && npm run build`. Deploy only if checks pass. The platform keeps the existing real NASA dataset and shows limited coverage honestly.

## Data safety

Do not delete or overwrite your existing `earthdata_archive`. If you run a ZIP from a newly extracted folder, copy/merge the existing archive into this folder first to reuse it. No passwords/tokens should appear in code, logs, screenshots or submitted materials.

## NASA submission

Make the site public and submit the project in the official event window. Data acquisition can continue beyond submission but must not block it.

## Known limitations

- Harmony status `complete_with_errors` is an incomplete server-side processing job; the recovery script cannot guarantee that NASA will fix upstream failures.
- One full-week output may contain multiple daily timestamps; the extractor refuses silently averaging multi-day data. It works for single daily raster results with an unambiguous precipitation variable and recognized units.
- Data downloads and full front-end Vitest / Vite build are not executed in this offline builder. Run them on Windows.
- IMERG, SMAP, SoilGrids and yields require their actual source products and validation. No fabricated cells or coefficients.
