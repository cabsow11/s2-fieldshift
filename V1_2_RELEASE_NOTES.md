# S² FieldShift V1.2 — Competition integration

## Implemented

1. Guided **Load illustrative farm scenario** button changes *assumed* soil and seed answers. Does not verify actual farm conditions.
2. Rotation Explorer accepts two user-selected eligible rotations; synthetic soil attributes can be edited per crop.
3. Decision Frontier now evaluates the **same selected pair** under historical NASA POWER and GPM IMERG inputs; new two source-specific interactive line charts.
4. Exact preference reversals (or no reversal), and minimax regret are computed using identical options. Export includes selected pair, linked model, and assumptions.
5. Separate independent algebraic example remains below, labeled secondary.
6. Added Vitest coverage in `src/linkedDecision.test.ts`.

## Scientific limitation

POWER / IMERG are historical, partly related products, not future scenarios. Synthetic dry-spell tolerance and soil-care attributes do not constitute field-scale agronomic evidence. This remains an educational decision-method demonstrator, **not a crop-yield or soil-health predictive system**.

## Run on Windows

```cmd
npm install
npm test
npm run build
npm run dev
```

The source ZIP contains no `node_modules`. New user action: in Rotation Explorer, click **Load illustrative farm scenario** then **Compare in Decision Frontier**.

### Development verification
- TSX AST parse: passed in artifact construction environment.
- Engine isolated numerical checks: passed.
- Full React build + Vitest: **must be run on user's Windows**. npm registry unavailable in construction environment.
