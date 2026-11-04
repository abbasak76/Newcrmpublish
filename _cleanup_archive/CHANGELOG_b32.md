# Changelog b32

## Phase 1 — source stabilization
- Fixed SQL audit parsing for indented closing parentheses, resolving the 51-vs-46 counting discrepancy.
- Added audit output for raw table definitions, unique names, and parsed/raw count consistency.
- Added `010_sales_dispatch_rls.sql` to add tenant RLS filter predicates for five sales/dispatch tables created in migration 008.
- Removed hardcoded profile email and phone fallbacks.
- Persisted map provider/custom XYZ template/attribution through `state.settings.mapConfig`.
- Added configurable organization country profile selector to locale settings.
- Synchronized package and app release metadata to `0.12.7 / r11-cp9-b32`.
- Added phase 1 evidence and explicit blockers.

## Validation
- `npm test`: PASS (all 23 configured test scripts).
- `node scripts/audit-sqlserver-contracts.mjs`: PASS, static only.
- Dependency installation timed out; `npm run lint` failed with missing `vite/client` type definitions and `npm run build` failed because `vite` is not installed.
- SQL Server and real device/browser checks not performed.
