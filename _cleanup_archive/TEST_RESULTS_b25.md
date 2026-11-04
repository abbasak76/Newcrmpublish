# TEST RESULTS — b25

Execution performed on the b25 working tree, 2026-10-27.

- `npm test`: PASS; 587 assertions across the test suites (includes RBAC, finance, geo, credit-note reconciliation, SQL mirror contracts).
- `node scripts/audit-actions.mjs`: PASS; 77 mutating handlers, 77 guarded, 0 unguarded (static audit).
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection was made.
- TypeScript `transpileModule` syntax check: PASS for `GeoZoneMapEditor.tsx`, `GeoIntelligenceWorkspace.tsx`, `FinanceWorkspace.tsx`, `receivableReconciliation.ts`, `types.ts`.
- `tsc --noEmit`: BLOCKED by `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build`: not run to completion; Vite dependency is absent (`vite: not found` in the prior clean environment). No build success is claimed.
- Tile endpoint probe `https://tile.openstreetmap.org/5/17/12.png`: BLOCKED by environment DNS (`Could not resolve host`). The in-app provider test is implemented but has not been executed in a browser with network access.
- Chromium/Safari/iPhone touch tests, SQL Server runtime/RLS, API integration and ERP end-to-end: not executed.

The static UI contracts and domain tests do not prove browser rendering, tile availability, backend security or ERP reconciliation.
