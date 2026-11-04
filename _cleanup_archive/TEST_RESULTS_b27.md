# TEST RESULTS — b27

Execution performed on the b27 working tree, 2026-10-27.

- `npm test`: PASS; 608 assertions across the existing suites plus 11 new assertions for atmosphere motion, reduced-motion, low graphics and release metadata.
- `node scripts/audit-actions.mjs`: PASS; 77 mutating handlers, 77 guarded, 0 unguarded (static audit).
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection was made.
- `npm run lint`: BLOCKED, `TS2688: Cannot find type definition file for 'vite/client'` because dependencies are not installed in this environment.
- `npm run build`: BLOCKED, `vite: not found`.
- iPhone/Safari rendering, GPU/thermal/battery performance, map tile availability, SQL Server runtime/RLS, API integration and ERP end-to-end: not executed.

Static tests do not prove visual fidelity or device-level performance. Do not treat this build as production-ready.
