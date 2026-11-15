# V1.8 · Spatial honesty, temporal heatmap, and decision interpretation

## Implementation status
- OpenStreetMap embedded interactive basemap **only**, centered at the known Kaolack pilot coordinates. No rainfall color overlay, interpolation, artificial polygon or field boundary.
- 122 real daily values used for a **temporal** heatmap, with separate POWER / IMERG / absolute inter-product difference. Color bins are descriptive thresholds in mm/day, not drought/failure categories.
- Month/time selector, daily click details, accessible labels, exact source values, result summaries. The map requires internet; the NASA local JSON and calendar heatmap do not.
- Evidence-bounded interpretation cards on Climate Evidence, Rotation Explorer and Decision Frontier: explicitly no agronomic winner or made-up confidence band.
- No NASA logos or AI-generated images added.

## Grounding in the supplied design literature
- Adam Wathan & Steve Schoger, *Refactoring UI*: start from a useful feature, prioritize hierarchy, coherent spacing, limited accent palette; new atlas is functional before decorative.
- Steve Krug, *Don't Make Me Think, Revisited*: obvious tabs, month chooser, legible result summary, no unnecessary learning burden, explicit states.
- Cole Nussbaumer Knaflic, *Storytelling with Data*: context first, two products remain distinct, direct statement of what comparison means, date readout, reduce non-data ink.
- Addy Osmani, *Web Performance Engineering in the Age of AI*: map iframe lazy-loaded; no large mapping library bundled; actual performance requires Lighthouse on a published URL.

## Data governance
The stored NASA values are point/time series at 14.15 N, -16.08 W. They do NOT support spatial raster heatmaps across Kaolack. Real spatial maps require georeferenced grids and appropriate QA. The season-total source gap must never be called measurement error without a gauge truth source. No crop yield or soil-benefit rank is created.

## Validation
Run `npm install`, `npm test`, `npm run build`, `npm run preview` on Windows. Check interactive map availability, keyboard selection of dates, and that JSON loads offline (map tiles may not).
