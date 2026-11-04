# AKHAVAN CRM b24 release package

- Product version: 0.12.0
- Release label: r11-cp9-b24
- Base: b23
- Changes: zone collection report (summary/detail/date range); payment deduplication; financial allocation integrity diagnostics for selected-zone customers; explicit guard that pre-credit balances are not authoritative or used for collection ranking.
- Tests: npm test PASS (553 assertions based on suite output); action audit 76/76 guarded; SQL contract audit PASS static-only; syntax transpilation PASS.
- Build/typecheck not confirmed: missing `vite` and `vite/client`; no browser, iPhone Safari, SQL Server runtime or ERP end-to-end test is claimed.
- Credit-note source remains unmodeled; receivable diagnostic is intentionally non-authoritative.
