# S² FieldShift — Competition Implementation

New React + TypeScript codebase created 14 November 2026. This implementation is independent of the exploratory V0.1 UI. It reuses **public NASA historical observations and design requirements**, not the prior app source code.

## Windows CMD

```cmd
npm install
npm run dev
```
Then open the localhost address shown. For validation:

```cmd
npm test
npm run build
```

## Contents
- Original application UI, field profile, POWER/IMERG observation visualizations, crop sequence explorer, educational reversal frontier and evidence register.
- `public/data/kaolack_2024.json`: 122 daily observations from the previously prepared UTC comparison, June–September 2024. This is **historical** and **gridded**, not station truth or a 2026 forecast.
- Decision scores are **fictional educational fixtures**. No agronomic efficacy, yield or local validation is claimed.

## Attribution and AI statement
Developed with ChatGPT assistance for code, visual design and QA. Prior scientific question, datasets selection and decision frontier concept provided by the S2 FieldShift team. Historical observations sourced from NASA POWER and NASA GPM IMERG, using team's preparatory extracts. In a NASA Space Apps submission, list this assistance clearly and mark AI-generated graphics appropriately. No official NASA graphics are bundled.

## Boundaries
No implicit crop-specific suitability claims. `YES` means that **only entered hard constraints** passed. Soil in this illustrative UI does not define crop-specific scientific thresholds. All locally unvalidated agronomic rankings are withheld; a separate synthetic demonstration explains decision sensitivity.

## Climate-to-decision extension (14 November)
See `CLIMATE_DECISION_INTEGRATION.md`. The Rotation Explorer now uses real 2024 NASA rainfall as a climate input to synthetic, user-adjustable crop dry-spell sensitivity assumptions, with separate POWER and IMERG scores and source-scenario minimax regret. It does **not** establish agronomic crop ranking or forecast year 2. The standalone frontier graphic remains an illustrative fixture.


## V1.4: Agricultural decision readiness gate
See `DECISION_GATE_V1_4.md` for evidence gates, unknowns and demonstration boundaries.


V1.5+V1.6: see `EVIDENCE_ENGINE_V1_5_V1_6.md`. New source-preserving crop knowledge and 30-day historical NASA diagnostic, integrated into rotation and frontier screens.


## V1.6.1 — Generic FAO crop-water parameterization
See `V1_6_1_RELEASE_NOTES.md`. Select two rotations, then the new FAO parameters panel shows reference crop stages for the first selected crop; optional ET0 is explicitly a user scenario. No actual crop deficit or yield is computed.


## V1.7 evidence-bounded decision comparison
Open **Rotation Explorer** or **Decision Frontier**. The new panel identifies the selected crop pair, two historical NASA rainfall readings and optional FAO generic reference ETc for each **first crop** if a user explicitly enters ET0. It intentionally returns **no agronomic winner or reversal** when local yield, soil, second-season and crop-water response data are unavailable. Synthetic educational curves elsewhere are not agricultural claims. See `V1_7_RELEASE_NOTES.md` and `QA_REPORT.md`.


**V2.0:** See `V2_0_RELEASE_NOTES.md` for ten genuine IMERG spatial dates, CSV evidence ingestion and explicit missing-data boundaries.

## V2.1 Connected Earthdata (new)

Source-linked backend endpoints in `functions/api` run on **Cloudflare Pages**, not Vite local preview. `Climate Evidence → Official Live Data Gateway` shows live POWER UTC responses and NASA CMR catalogs. `scripts/sync_earthdata.py` provides authenticated, resumable NASA Earthdata extraction for all requested IMERG/SMAP historical dates; do not claim completion until its coverage reports are COMPLETE. See `docs/CONNECTED_DATA_V2_1.md`.


See V2_1_4_README.md for the updated regional IMERG collector, 7 authentic included days, coverage checks, and Windows commands.
