# V1.8 QA report — truthful scope

Date: 2026-11-14

## Completed in this environment
- Original NASA data unchanged: 122 days, POWER 756.85 mm, IMERG 636.98497 mm.
- Daily absolute inter-product gap maximum 74.985 mm on 2024-08-05; not a measurement error.
- Month grouping: June 30, July 31, August 31, September 30.
- TypeScript compiler `transpileModule` with diagnostic reporting: App.tsx, ClimateAtlas.tsx, atlas.test.ts parsed with zero syntax diagnostics.
- No generated geographic rainfall grid; explicitly point locator plus temporal heatmap.

## Not executed here
- `npm test` and `npm run build` blocked because npm registry is unreachable from this runtime. The user must run these locally on Windows. No claim of final QA certification.
- Browser visual test and mobile/performance Lighthouse audit remain outstanding.

## Expected checks on user's machine
1. `npm install`, `npm test`, `npm run build`, `npm run preview`.
2. Climate Evidence: map centers Kaolack, layers switch POWER/IMERG/|DIFFERENCE|, month selector and individual day readout consistent.
3. Offline scenario: local NASA data and temporal heatmap still load; OSM base map may not.
4. Rotation/Decision screens: badges must not claim agronomic ranking or validated crop confidence.
5. Cross-source gap is not an accuracy estimate against gauges.
