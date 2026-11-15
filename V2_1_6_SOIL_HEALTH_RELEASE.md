# S² FieldShift V2.1.6 — Soil Health Evidence Engine

## Delivered
- Soil evidence engine added to Rotation Explorer without changing the already working NASA APIs or historical collector.
- Qualitative, order-sensitive mechanistic annotations: species diversification, legume-before-cereal transition, unavailable carbon trajectory and unavailable yield effects.
- CSV intake with provenance, coordinates, soil sample depth, measurement type and bounded values; optional q05/q95 per property for modelled soil uncertainty. Existing CSV template extended with optional CEC and uncertainty columns.
- Distinguishes no input vs sourced SoilGrids model vs user-provided laboratory/field records. A laboratory tag is a source declaration, not an independent verification.
- No prefilled SoilGrids values; no field observations invented; no crop yield, nitrogen credit, SOM increment or calibration claimed.

## Integration
New: `src/soilHealth.ts`, `src/SoilHealthPanel.tsx`, `src/soilHealth.test.ts`.
Changed: `src/App.tsx`, `src/additionalEvidence.ts`, `public/templates/soil_properties_TEMPLATE.csv`.

## Scientific governance
- SoilGrids official global coverage is ~250 m; its predictions are not farm-scale assays. Soil properties have depth, units, and where available 5th and 95th percentile prediction quantiles.
- CSV property values must use human units: pH dimensionless, sand/clay %, SOC and N g/kg, CEC cmol(c)/kg. Raw SoilGrids values are integer-scaled and MUST be converted using the official scale factors before import. In particular phh2o /10, sand /10, clay /10, soc /10, nitrogen /100, cec /10, depending on variable definitions.
- `depth_cm` is the center/depth reference supplied by the input provider; do not infer a whole soil profile from one depth value.
- Position-dependent evidence describes a potential mechanism. It does NOT estimate causal effects or an amount of N transferred to a succeeding crop.
- No full soil geospatial ingestion has been undertaken; users can import sourced CSVs after independently extracting them.

## Test and release gate
Before deploying, from the root of the Windows source project:
`npm test`
`npm run build`
If both pass, launch `npm run dev` and test Rotation Explorer > Soil Health Evidence Engine with no soil CSV (must say NO SOIL INPUT), one compatible sourced CSV (must show value / source / depth), and a reverse pair (mechanism text must differ).

In the current isolated environment, TypeScript engine-only compilation and a Node smoke calculation PASSED. Full React/Vite compilation and Vitest were NOT run due to unavailable npm dependency cache. This release is therefore NOT certified or deployed.

## Sources
ISRIC SoilGrids documentation: https://docs.isric.org/globaldata/soilgrids/
ISRIC scaling and intervals: https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html
FAO crop rotation mechanisms: https://www.fao.org/
