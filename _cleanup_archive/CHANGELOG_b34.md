# CHANGELOG b34 — Phase 2 ERP import persistence boundary

- Added `src/lib/erpImportService.ts` to route normalized ERP sales-order and invoice-mirror records through source-scoped idempotent merge logic into the existing Zustand persisted app state.
- Added serial same-tab import execution, source timestamp stale-update guard, missing-identity conflict accounting, and ERP-owned/read-only metadata for invoice mirrors.
- Added `tests/erpImportService.test.mjs` and included it in `npm test`.
- Updated Phase 2 evidence, status and handoff to record exact verified results and blockers.
- Verification: full `npm test` PASS; SQL static contract audit PASS. Typecheck/build/real browser IndexedDB/SQL Server/live ERP remain blocked or unverified as described in `STATUS_b34.md`.
