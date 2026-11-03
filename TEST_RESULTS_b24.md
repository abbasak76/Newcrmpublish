# Test Results — b24

Date: 2026-10-27

- `npm test`: PASS; 553 assertions based on configured suite output. Includes 20 assertions for receivable reconciliation, 21 collection-report assertions, and 38 Geo workspace static contract assertions.
- `node scripts/audit-actions.mjs`: PASS; 76 mutating handlers, 76 guarded, 0 unguarded in static audit.
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection or execution occurred.
- Syntax transpilation of changed TS/TSX files: PASS; this is not a full typecheck.
- `tsc --noEmit --pretty false`: BLOCKED with `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build`: BLOCKED because `vite: not found`.
- Browser smoke, iPhone Safari, SQL Server runtime/RLS, backend/API and ERP integration: not executed.

Receivable reconciliation is explicitly non-authoritative because the current model has no Credit Note/credit-adjustment source. Do not use its pre-credit outstanding values for financial decisions or collection ranking.
