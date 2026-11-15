# FieldShift — Evidence-backed Parameter Governance (V2.1.8 candidate)

## Implemented
- Added an auditable registry of 12 agronomic and climatic parameter groups with source type, scientific reference, data status, consumer and explicit limitations.
- Registered NASA POWER/IMERG as historical scientific estimates, not measurements at a farm.
- Registered GAEZ and SoilGrids as **pending**: no invented point values or crop yield layers.
- Preserved the educational `DEFAULT_TOLERANCE` and `DEMO_SOIL_CARE` parameters but explicitly classified them as synthetic; **they have not been replaced by published numbers.**
- Added fail-closed checks prohibiting automatic transfer of example regional study results into crop response coefficients, and added five regression tests.
- Added `AgronomicEvidenceUpgradePanel` under Evidence & Limits, upstream of the decision/causal audit panel.

## Source bases
- User-provided S² FieldShift Agronomic Extraction Lot 01 (source inventory and evidence register; Araya et al. 2022).
- User-provided S² FieldShift Agronomic Extraction Lot 02 (91 PDF file inventory, 12 examined sources; Senghor 2023, Ndiaye 2026, Faye 2021/2023, Goudiaby 2024, Ramarohetra 2017, others). The lot explicitly says no universal crop coefficient can be certified from these extracts.
- ISRIC SoilGrids current official website states its REST API has been paused: https://isric.org/explore/soilgrids ; alternative downloads/WebDAV/WCS must be verified.
- FAO GAEZ v5 global suitability and attainable yield: https://www.fao.org/gaez/en ; https://data.fao.org/catalog/dataset/gaez-v5-master-config/resource/31abf121-1644-4473-8c1b-bfec83112749

## Validation and limits
- Standalone `tsc --noEmit --strict` of the new pure TypeScript registry: PASS.
- React/Vite build and full Vitest not independently run in this environment (npm dependencies not fully cached).
- No local soil attributes, measured yields, calibrated crop drought tolerances, causal effects or GAEZ raster values have been added.
- Do not say the software is agronomically calibrated. Do not assert a deployment without a successful Git push and Cloudflare build.

## Deployment
1. Extract the PATCH zip at the repository root, retaining src/ layout.
2. Run `npm test && npm run build` and inspect failures before publishing.
3. Commit new files and `src/App.tsx`, then push and validate Cloudflare output.
