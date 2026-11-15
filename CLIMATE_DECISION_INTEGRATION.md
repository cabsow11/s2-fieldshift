# Climate × Decision Bridge — competition development

## What was implemented
- Real 122-day POWER UTC and IMERG 2024 rainfall series loaded from `public/data/kaolack_2024.json`.
- Selectable sowing-date window of 30 days (2024 historical, NOT a 2026 forecast).
- Wet-day threshold (1–10 mm/day); independent longest dry-spell and rainfall calculations per NASA source.
- Four editable **synthetic assumptions** for crop-specific tolerated dry-spell length (defaults Millet 6, Groundnut 7, Cowpea 5, Sorghum 8 days). These numbers are *invented illustration inputs*, not claims about crop physiology. They must be replaced with properly sourced and calibrated crop/variety/stage-specific parameters before any practical advice.
- An intentionally simple synthetic proxy: `100 × assumed_tolerance / (assumed_tolerance + observed_longest_dry_spell)`; the two crop positions use the **same historical 2024 analog** and are averaged. A rotation with the reverse crop order therefore has the same proxy score: **no unsupported temporal agronomic benefit is invented**.
- The score is computed separately for POWER/IMERG and minimax regret is computed over only `YES` alternatives. `NO` and `UNKNOWN` never win the screening. Repeating the identical crop in both seasons is excluded as not being a rotation, without claiming it is biologically impossible.
- Weather evidence and illustrative screening can be exported, together with assumptions.

## Scientifically critical restrictions
- 2024 daily gridded precipitation estimates are not station truth or a 2026 forecast.
- These proxy scores are **neither crop survival probabilities nor modeled yields nor a calibrated suitability score**.
- The 2024 rainfall window is not evidence of second-year 2025 or future weather. Two positions in the displayed rotation reuse a single historical analog.
- Soil texture is recorded but a crop-soil suitability model is NOT implemented. `YES` means entered constraints passed, nothing more.
- This step does **not** establish a valid empirical NASA-driven Decision Reversal Frontier. The standalone frontier remains synthetic and labeled as such.
- The appropriate eventual path is historical multi-year windows, spatial/ground validation, parameterized crop-stage water response and field-scale validation.

## Practical demonstration
1. Run `npm install && npm run dev`.
2. Open `My field`, set seed availability and a soil texture (illustrative inputs).
3. Open `Rotation explorer`; inspect POWER and IMERG longest dry spells for July 2024.
4. Change the date, dry-day threshold or assumed tolerances: scenario scores and regrets update directly.
5. Set soil to Unknown or seeds to No: affected candidates are not ranked.
6. Open `Decision frontier` to see source-connected climate evidence **separate from** a clearly synthetic reversal fixture.

## Validation
- Unit tests added in `src/engine.test.ts` for scenario specificity, unknown exclusion, missing-date handling and reversal symmetry.
- `npm test` and `npm run build` must be executed in the user's Windows environment if dependency installation is unavailable in the build environment.

## Disclosure
Generated and edited with ChatGPT assistance, reviewed as an exploratory demonstration. Retain attribution in the NASA project submission.
