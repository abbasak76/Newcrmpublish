# Test Results — b22

Date: 2026-10-27

- `npm test`: PASS; all configured suites completed, including 13 assertions for `geoCollectionReporting` and 32 static workspace contract assertions. Total assertions based on suite output: 519.
- `node scripts/audit-actions.mjs`: PASS; 76 mutating handlers, 76 guarded, 0 unguarded in static audit.
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection or execution occurred.
- `tsc --noEmit --pretty false`: BLOCKED with `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build` / browser smoke / iPhone Safari: not verified in this environment because dependencies are absent.

The passing tests cover domain logic and static source contracts; they do not prove browser runtime, backend authorization, SQL Server RLS, or production storage security.
