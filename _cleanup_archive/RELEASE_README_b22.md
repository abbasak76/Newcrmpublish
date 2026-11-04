# AKHAVAN CRM b22 release package

- Product version: 0.11.8
- Release label: r11-cp9-b22
- Base: b21
- Primary change: zone-scoped collection report, assignee breakdown, outcome breakdown, CSV export, payment-source revalidation/deduplication, client-side task visibility scope, and explicit RBAC service wiring.
- Tests: npm test PASS (519 assertions across configured suites); action audit 76/76 guarded; SQL contract audit PASS in static-only mode.
- Build/typecheck are not confirmed: global `tsc --noEmit` is blocked by missing `vite/client`; `npm run build` is blocked because `vite` is not installed. No browser, iOS/Safari, SQL Server runtime, or ERP end-to-end test is claimed.
- See `STATUS_b22.md`, `NOT_DONE_b22.md`, `TEST_RESULTS_b22.md`, `RBAC_AUDIT_b22.md`, `REQUIREMENTS_TRACEABILITY_b22.md`, `HANDOFF.md`, and `docs/08_MASTER_AUDIT_AND_TRACEABILITY_b22.md`.
