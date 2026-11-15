# V1.7 — Evidence-bounded Agricultural Decision Frontier

This release adds an evidence-gated, explicitly non-calibrated agricultural panel to Rotation Explorer and Decision Frontier. The selected rotation pair is shared across views. Historical POWER and IMERG descriptors remain separate. Generic FAO Kc stage schedules are applied to the **first crop only** and only with an explicitly entered ET0 scenario. The engine does not convert precipitation to effective rainfall or crop stress, does not invent a second-season climate, and **never declares a field-level agricultural winner, reversal or regret** when the agronomic data are insufficient.

The older interactive synthetic frontier remains for method demonstration, visibly labelled as fictitious. It is not the V1.7 evidence-based result.

Tests: 8 new checks in src/evidenceFrontier.test.ts. Run `npm install && npm test && npm run build` before deploying.
