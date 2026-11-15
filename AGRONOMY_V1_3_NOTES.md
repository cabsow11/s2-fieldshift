# S² FieldShift — V1.3 agronomic evidence diagnostic

## New functionality
- Agronomy module independent of synthetic decision-scoring fixtures.
- Field- and source-linked 30-day historical rainfall descriptors with missing-date validation.
- Order-specific references for Millet → Groundnut versus Groundnut → Millet; no claimed universal benefit.
- Explicit evidence and unknowns (soil laboratory factors, variety, crop stages, prices, yield calibration, and storage for groundnut).
- Visible evidence panel in Rotation Explorer and Decision Frontier and reference list in Evidence & Limits.
- Six additional unit tests.

## Important boundary
This is **not** a calibrated agricultural recommendation system. The previous V1.2 water tolerance index and soil-care numerical scores remain **synthetic**. A named reference is NOT an endorsement of a numeric parameter or generalization to Kaolack. The evidence engine deliberately returns `NOT_RANKABLE` for actual agronomic performance. No sourced local crop response coefficients were verified in the supplied material.

## References
The included 8 source entries are transcribed as topical metadata from the project's pre-existing `S2_FieldShift_Knowledge_Base_Consolidated_V1/LOT02_EVIDENCE_REGISTER.csv` and `LOT03_EVIDENCE_REGISTER.csv`; the reports themselves were previously partially reviewed and do not provide validated plot coefficients.

## Release QA
Run `npm install && npm test && npm run build`; do not publish as certified until those checks and a manual browser review pass. Preserve the functioning V1.2.1 as rollback.
