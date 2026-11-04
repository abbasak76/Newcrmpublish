# Phase 1 source integration evidence — b42

## Implemented in this increment
- Structured entity mention lookup now covers customers, staff, cheques, invoices, products, tasks, quotes, opportunities, cases, requests/onboarding applications, and warehouses when present in local AppState.
- Warehouse references route to the existing operations workspace.
- Regression test assertions added for opportunity, case, request, and warehouse lookup.

## Validation
- `npm test`: PASS (full configured suite, including the updated mention-engine test).
- `npm run audit:contracts`: PASS, static-only (12 SQL files, 55 tables, 53 tenant-scoped tables/RLS targets, 5 required views).
- Vite build/typecheck, browser E2E, IndexedDB offline/reload, mobile/accessibility runtime, SQL Server runtime, ERP and external messaging: NOT VERIFIED in this environment.

## Scope limitation
This increment closes a specific entity-coverage gap; it does not claim every form in the app is runtime-verified. Remaining work is listed in `REMAINING_ITEMS.md` and the unified `HANDOFF.md`.
