# S² FieldShift V1.7 QA report — 14 Nov 2026

## Executed locally in builder
- Isolated strict TypeScript typecheck for the agricultural and climate engine (`engine.ts`, `agronomy.ts`, `agroParameters.ts`, `decisionGate.ts`, `evidenceFrontier.ts`): **PASS**.
- TypeScript syntax/transpilation of `src` .ts/.tsx modules excluding declarations: **PASS**.
- Independently executed emitted ESM modules with the supplied NASA JSON: **PASS**. July 1–30 POWER = 168.53 mm, IMERG = 190.68999 mm; longest dry sequences = 3 / 5; generic FAO 30-day ETc with *user-assumed* ET0=5 mm/day: Millet 78.75 mm, Sorghum 72.5 mm.
- Confirmation that agronomic winner/reversal/regret are always null without calibrated criteria: **PASS**.
- Cowpea coefficient remains missing: **PASS**.

## Not executed here / blocked
- Full `npm test` and `npm run build`: **NOT EXECUTED** due to missing npm dependencies and unavailable local npm cache. Must pass on the user's Windows environment before release.
- Browser UX, mobile accessibility and public deployment: **NOT TESTED**.

## Scope disclaimer
The previous **illustrative synthetic** interactive frontier remains in the app for mathematical illustration. V1.7's new evidence-bounded panel does not produce field-level yield, soil fertility, profit or recommended rotation ranking. No future season-two climate is simulated.
