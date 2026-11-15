# V1.6.1 — Agronomic Parameterization & Uncertainty (14 November 2026)

## What has changed
- Verbatim FAO *Crop Water Needs* generic Kc values for millet, groundnut and sorghum; documented stage-duration examples and **whole-season** indicative water-needs ranges. Source: https://www.fao.org/4/S2022E/s2022e07.htm (Tables 7, 8, 14).
- Cowpea deliberately remains **NOT_ESTABLISHED**, not substituted with generic beans.
- Independent observed NASA POWER/IMERG precipitation on selected 30-day historical window.
- An OPTIONAL user-typed, constant ET0 scenario reveals ETc=Kc×ET0 *only* as an explicit experiment. Blank by default, no ETc number.
- No rain–ETc subtraction interpreted as plant deficit, yield, soil water or soil fertility; no new agronomic ranking.
- UI component placed within the evidence-climate comparison on both Rotation Explorer and Decision Frontier; extra Vitest tests.

## Important methodology
These FAO tables are **generic illustrative figures, not specific FAO-56 locally adjusted coefficients**; FAO notes dependence on humidity and wind. The stage Kc is treated as a piecewise-constant stage representative for display only. A proper FAO-56 calculation would require validated local dates, daily ET0 (e.g. computed from suitable NASA POWER weather variables), climatic Kc adjustment, and a soil water balance if inferring field stress. The two conceptual rotation years do not represent two observed years. Do not invent nutrient/yield improvements.

## Gates
Run `npm install`, `npm test`, `npm run build`, `npm run preview` locally. Only a full successful run and browser smoke-test can authorize deployment. npm vulnerabilities in dev test dependencies should be handled separately without blind --force.
