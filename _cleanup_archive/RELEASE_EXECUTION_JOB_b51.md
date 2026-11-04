# Release execution job b51

1. [x] Inspect existing lifecycle and operational exception aggregation before editing.
2. [x] Reuse shared `activeRecords` rather than creating another lifecycle engine.
3. [x] Filter soft-deleted tasks from exception output.
4. [x] Defend aggregation against missing account IDs, duplicate profiles, malformed numeric signals, missing arrays, and non-finite amounts.
5. [x] Add regression tests and include them in the main test chain.
6. [x] Synchronize package, app, metadata, and release contract versions.
7. [x] Run full configured `npm test` suite.
8. [x] Run static SQL Server contract audit.
9. [ ] Build/lint/browser/mobile/SQL runtime/ERP E2E — blocked by unavailable dependencies and external services; recorded in `TEST_RESULTS_b51.md`.
10. [x] Create completion matrix and update handoff/remaining work.
