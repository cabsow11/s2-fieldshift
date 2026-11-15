# S² FieldShift V2.1.7 — Decision Value Audit + Causal Agronomic Incrementality

## Scientific scope
Two independent analytical modules are now connected to the React app's **Evidence & limits** section.

1. **Incremental Decision Value Audit** recomputes metrics from the bundled NASA datasets and a fixed illustrative field (Groundnut previous crop, loamy soil declared, all seeds available, rainfed): 122 matched days in the 2024 comparison, 4018 historical NASA POWER dates, 10 consecutive-season windows across 2015–2025, 12 eligible distinct-crop candidates, and 120 rotation × historical-window contexts. The count of 120 is NOT independent trials, statistically independent scenarios, distinct preferred choices, real-world gains, forecast quality, or causal effects. The V2.1.6 benchmark has zero observed soil-property profiles; structural source-gating is not a measured soil-health improvement.
2. **Causal Evidence Register + Identification Gate** stores documentary candidate records and produces failure reasons. Uploaded JSON cannot elevate itself to independently reviewed evidence. An external randomized study estimate can be *eligible for contextual review* only after external verification; the UI does not certify or quantitatively transport this effect. The Kaolack causal effect always remains unestimated in the current build.
3. **Randomized ITT estimation core** (`trialCausalEstimator.ts`) implements a simple difference of two assigned-arm means and a Neyman-style unadjusted SE and large-sample normal CI, only after an explicit externally audited assignment, verified source, complete followup and interference controls. This is a method implementation, not an analysis of actual crop trials. No observational design, cluster RCT, multiplicity, or transport analysis is claimed.

## Academic caveats
- POWER original 2015–2025 time convention is not the independently re-requested 2024 UTC matched series. Do not subtract unsynchronized yearly totals across the two extractions.
- Year-pair windows overlap. They are historical analogs, not independent forecasts or causal experiments.
- Rotations receive different *slot exposures* when reversed; this is not a calculated nitrogen transfer, soil-carbon response, yield or economic rotation-order effect.
- The causal gate never turns rainfall correlation, crop mechanism, meta-analysis averages or unverified source-file numbers into farm treatment effects.
- Identification conditions include well-defined treatment/comparator, assignment or confounding control appropriate to the design, consistency, overlap/positivity, interference, and population transportability.
- Uploaded registers are documentary and ALWAYS `independentSourceReviewed=false`, regardless of uploaded content. Independent review needs a separate auditable process.

## Installation
The patch contains `src/App.tsx` and new `src/` modules. **Prerequisite:** complete V2.1.6 source including `src/HistoricalRotationPanel.tsx`, `src/historicalRotation.ts`, `src/SoilHealthPanel.tsx`, and `src/soilHealth.ts`.
Copy over the local repository with directory structure preserved.
Run `npm test` and `npm run build` in the user environment. If both pass, `git add src && git commit -m "Add incremental decision value and causal evidence governance" && git push origin main`.
On Cloudflare check the new commit specifically and verify the new section in Evidence & limits. No direct changes were made to the existing deployed site.

## Reproducibility
`SCIENTIFIC_AUDIT_RESULTS.json` contains the executed core-smoke metrics; the prototype records analytical capability only. `smoke_cores.cjs` runs core smoke tests with the globally installed TypeScript compiler when npm/Vitest are not available. The UI JSX syntax was parsed successfully, but **a full npm/Vite/Vitest build was not available in this environment; production release is NOT certified**.

## Methodological bibliography
- NASA Space Apps Challenge 2026 — Field Shift: Adapting Farms with NASA Data, https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/
- Causal Inference Methods for Combining Randomized Trials and Observational Studies, Statistical Science 39(1), 2024, DOI 10.1214/23-STS889.
- A Review of Generalizability and Transportability, Annual Review of Statistics and Its Application, 2023, DOI 10.1146/annurev-statistics-042522-103837.
- Hernán et al. target trial methodological requirements; no target trial is assumed to be satisfied merely by loading climate observations.
