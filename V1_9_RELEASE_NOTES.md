# V1.9 — Full AVAILABLE NASA evidence integration

## Source files integrated (observed coverage, never extrapolated)
- `power_daily.csv`: **4018 days, 2015–2025**, precipitation, T2M/TMAX/TMIN, solar radiation and FAO-56 Hargreaves derived approximate ET0. Historical data time convention is not demonstrated to equal explicit UTC series. Its 2024 rainfall must not be directly subtracted from the separately re-requested UTC POWER/IMERG comparison.
- `kaolack_2024.json`: existing **122 matched UTC daily POWER + IMERG Final V07B** for June–Sep 2024 (retained unchanged).
- `S2_FieldShift_V2.5_Seasonal_Audit/seasonal_daily_comparison.csv`: **9 dated SMAP L4 measurements** with genuine non-null surface/root-zone values. Not a continuous 122-day SMAP record.
- `fieldshift_v28_smoke/pixel_values.csv`: **75 true georeferenced IMERG pixels** (5×5×3), Aug 1,2,3 2024 only. Actual spatial heatmap for these dates only, no invented map elsewhere.

## Analysis boundaries
- POWER long history allows annual rainfall and season comparison, temperature context and Hargreaves approximate ET0 screening; no 11-year IMERG history exists in the included files.
- Hargreaves temperature-only method uses latitude 14.15°N and FAO-56 radiation geometry; it is an **approximation requiring local validation**, not Penman–Monteith ETo, a soil deficit or irrigation advice.
- SMAP L4 may use IMERG as forcing, so it is not an independent rainfall validator.
- Plot soil properties, seed variety schedules, yield response, field boundaries, station rain gauges, full gridded seasonal history remain unavailable. Agricultural winner remains withheld.
- UI follows Krug (clear choices), Wathan & Schoger (visual hierarchy), Knaflic (meaningful chart interpretation) and Osmani (lightweight interactive charts/no mandatory map library).

## Run
`npm install` · `npm test` · `npm run build` · `npm run preview`

Production build unverified in this container unless explicitly documented otherwise.
