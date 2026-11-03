# TEST RESULTS — b26

Execution performed on the b26 working tree, 2026-10-27.

- `npm test`: PASS; 597 assertions across RBAC, finance, geo, credit reconciliation, SQL mirror contracts and accessibility/form draft contracts.
- `node scripts/audit-actions.mjs`: PASS; 77 mutating handlers, 77 guarded, 0 unguarded (static audit).
- `npm run audit:contracts`: PASS static-only; 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. No SQL Server connection was made.
- TypeScript `transpileModule` syntax check: PASS for `App.tsx`, `SettingsWorkspace.tsx`, `AtmosphereLayer.tsx`, `DynamicFormRenderer.tsx`, `LiveAnnouncer.tsx`, `Modal.tsx`, `LightHighwayCanvas.tsx`, `GeoZoneMapEditor.tsx`, `GeoIntelligenceWorkspace.tsx`, `FinanceWorkspace.tsx`, `receivableReconciliation.ts`, `types.ts`.
- `tsc --noEmit`: BLOCKED by `TS2688: Cannot find type definition file for 'vite/client'`.
- `npm run build`: BLOCKED (`vite: not found`).
- Tile endpoint probe `https://tile.openstreetmap.org/5/17/12.png`: BLOCKED by environment DNS (`Could not resolve host`). In-app provider test exists but has not run in a network-enabled browser.
- Chromium/Safari/iPhone touch tests, SQL Server runtime/RLS, API integration and ERP end-to-end: not executed.

Static UI contracts and domain tests do not prove browser rendering, tile availability, backend security, ERP reconciliation, or device-level accessibility.
