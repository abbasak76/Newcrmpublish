# CHANGELOG b33 — Phase 2 only

- Added `src/lib/phase2Flow.ts` with source-scoped identity, idempotent external-record upsert semantics, negotiable ERP order filtering, invoice distribution classification, ERP request result helpers, and order CPQ evaluation using the existing CPQ engine.
- Integrated CPQ evaluation into local order approval and persisted the resulting snapshot on the local order.
- Extended local dispatch-plan records/UI to track linked invoice IDs and a distribution output number separately from order assignment.
- Added filtered unique SQL index for source-scoped ERP external order identity.
- Added `tests/phase2Flow.test.mjs` to `npm test`.
- Did not implement a fake ERP connector or claim live integration. SQL Server/build/type-check remain unverified due unavailable environment dependencies/services.
