# S² FieldShift V2.1.4 — ALL IN ONE / Harmony regional batch & resume

## What is actually implemented

- Retains complete React/Vite application and previous NASA observation assets.
- Resumable monthly Harmony IMERG V07B regional ingestion with 23:59:59 inclusive final day (avoids next-day boundary overlap).
- Bounded polling, persistent job IDs, no repeated submissions for pending jobs, downloaded subsets checked for date/coordinates/units/positive valid-cell count, checksums, one record per date.
- Partially successful Harmony jobs are accepted ONLY for those dates whose regional NetCDF passed validation. Missing dates are reported and can be retried individually with `--retry-missing`.
- Does not assume that an archive is complete because a job reached 100% progress.
- Explicit `plan`, `run`, `audit`, `publish` modes; publish writes to `public/data/earthdata_connected.json` for the existing React PublishedEarthdata widget. **The publication might be large for 11 years of pixel grids**; use server-side cloud storage for production-scale service.

## Windows usage

Extract ZIP to Desktop. Preserve existing `earthdata_archive` by COPYING it into the new project directory, keeping the original intact. Python dependencies: `python -m pip install harmony-py xarray netCDF4 numpy`.

1. `01_PLAN_HISTORIQUE.cmd` — audit the requested period, without network.
2. `02_COLLECTER_UN_MOIS.cmd` — first January 2015, one job budget.
3. `03_CONTINUER_HISTORIQUE.cmd` — advance through at most four requests per execution; rerun as needed; if one job remains pending it is resumed next time.
4. `04_AUDITER_HISTORIQUE.cmd` — date-by-date validation of accumulated records.
5. `05_PUBLIER_DANS_SITE.cmd` — includes only *validated dates* in the static site, with incomplete coverage explicitly shown.
6. `VALIDER_SITE.cmd` — npm tests and production build on Windows.

**Seven real NASA IMERG regional NetCDF files dated 2015-01-01 through 2015-01-07, supplied by the user, are included and migrated into `earthdata_archive/harmony_batch` with the validated 441 pixel observations. Each pixel has been cross-compared to the original NetCDF on the model's machine. The frontend initial `public/data/earthdata_connected.json` includes them and marks 2015–2025 overall INCOMPLETE. The remaining 4,011 dates are NOT included.**

For existing archives larger than seven days, copy your original archive's files into the extracted project, preserving the `harmony_batch` folder. The current batch code recognizes indexed validated days and avoids repeating them. No other historic archive is claimed to be migrated.

## Security and science

Credentials requested at run time and never included in the ZIP, diagnostic or data files. Exact dates, source version and collected region are preserved. No fake spatial observations, predicted future climate or plot-level agronomic superiority. QA is limited to local tests; real NASA batch and npm/Vite build must be run on the user's network-enabled Windows environment.
