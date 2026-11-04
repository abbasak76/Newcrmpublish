# Test Results — b23

Date: 2026-10-27

- `npm test`: PASS; 531 assertions based on configured suite output. Includes 21 assertions for collection report aggregation/CSV/date filtering and 36 static Geo workspace contract assertions.
- `node scripts/audit-actions.mjs`: PASS; 76 mutating handlers, 76 guarded, 0 unguarded in static audit.
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection or execution occurred.
- TypeScript syntax transpilation of changed TS/TSX files: PASS; this is syntax/transpile only, not full typecheck.
- `tsc --noEmit --pretty false`: BLOCKED with `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build`: BLOCKED because `vite: not found`.
- Browser smoke, iPhone Safari, SQL Server runtime/RLS, backend/API and ERP integration: not executed.

The current reporting is client-side and local-state only; it is not an official accounting statement or production-secure reporting endpoint.
