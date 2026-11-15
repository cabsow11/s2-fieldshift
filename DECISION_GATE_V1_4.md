# S² FieldShift V1.4 — Evidence-to-Decision Gate

## Why this version exists
V1.3 displayed an agronomic evidence diagnostic, but it only analyzed the first rotation in the selected comparison. V1.4 evaluates **both selected options**, with an explicit gate and source-specific NASA historical descriptors. It does **not** convert literature mentions into unverified numerical benefits.

## Verified behavior expected
- Hard exclusions: a repeated crop is not a two-crop rotation; a crop whose seeds are declared unavailable is excluded.
- Every other candidate remains **REQUIRES_FIELD_VERIFICATION**, even if it passes the lightweight illustrative screening.
- Data summaries: historical NASA POWER and IMERG reported separately, with strict missing-day checks.
- Qualitative evidence: ordered sequence distinctions retained, no invented soil effect.
- Action plan: available seed confirmation, soil measurements, varieties/timing, local rotation trials, economics, prioritized by blockers.
- Both selected candidate rotations appear in **Rotation Explorer** and **Decision Frontier**.
- Export JSON includes the same gate assessments.

## Non-claims and traceability
- This is not a crop yield, profit or agronomic validation model.
- The separate climate-linked water sensitivity and soil-care **indices remain synthetic** and must never be described as farm-measured results.
- Two NASA sources are not independent climate scenarios; historical observational disagreement is not ground truth.
- Literature citations identify context; the existing 8 references are not proof of transferable coefficients.
- No actual second-year rainfall was incorporated.

## QA / release
Run `npm install`, `npm test`, `npm run build` in the extracted directory. This archive is **not labeled certified** unless these checks and the manual browser journey succeed.
