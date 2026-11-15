# S² FieldShift — V1.5 + V1.6 Agronomic evidence and agroclimate

## Implemented
- Eight traceable crop-level rules across millet, groundnut, cowpea and sorghum, tied to the existing knowledge-base register and 8 references already exposed in V1.4.
- Distinguish documented cropping systems, crop-specific absence of calibration, unknown field soil factors and missing inputs.
- POWER and IMERG daily 30-day windows calculated separately from supplied original precipitation records, with strict completeness checks and no imputed days.
- Two selected rotations appear together in Rotation Explorer and Decision Frontier alongside observed data and missing inputs.
- Nine additional tests check unknown preservation, source separation, coverage, seed absence, crop-order evidence and non-predictive limitations.

## Scientific boundary
No numeric crop stress thresholds, Kc or yield impact were extracted as locally validated parameters from the 37-entry documentary register. Therefore `fieldRecommendation` remains `WITHHELD`. Literature evidence is not silently converted into scores. The V1.2 illustrative utility graph remains a separate synthetic model. Historical 2024 observations do not constitute two successive years of real weather.

## Research mapping
L03-001 Ndiaye et al (2024), sowing window rainfall; L03-002 Han et al (2022), sorghum onset methods; L03-003 Diongue et al (2022), millet-groundnut soil water; L03-004 sandy soil suitability (2026); L03-005 Diatta et al (2019), millet–mung bean intercrop (not cowpea rotation); L02-002 groundnut→millet experimental trial; L02-003 rotations and amendments; L03-009 groundnut drying/storage; L03-014 FAO-56; L03-015 FAO-66. Exact register entries preserved in internal project knowledge base.

## Evidence gate
- Production code and tests: see `src/evidenceClimate.ts`, `src/evidenceClimate.test.ts` and `src/EvidenceClimatePanel.tsx`.
- Re-run `npm install`, `npm test`, `npm run build` on Windows.
- No claim of field-scale agronomic certification.
