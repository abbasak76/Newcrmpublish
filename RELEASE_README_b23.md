# AKHAVAN CRM b23 release package

- Product version: 0.11.9
- Release label: r11-cp9-b23
- Base: b22
- Changes: zone collection report by assignee/outcome; task/customer drill-down; summary and detailed CSV exports; inclusive date filter; payment deduplication and revalidation; RBAC scope applied before report aggregation.
- Tests: npm test PASS (531 assertions based on suite output); action audit 76/76 guarded; SQL contract audit PASS static-only; syntax transpilation PASS.
- Build/typecheck not confirmed: missing `vite` and `vite/client`; no browser, iPhone Safari, SQL Server runtime or ERP end-to-end test is claimed.
- See `STATUS_b23.md`, `NOT_DONE_b23.md`, `TEST_RESULTS_b23.md`, `RBAC_AUDIT_b23.md`, `REQUIREMENTS_TRACEABILITY_b23.md`, `HANDOFF.md` and `docs/08_MASTER_AUDIT_AND_TRACEABILITY_b23.md`.
