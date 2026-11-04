# AKHAVAN CRM b25 release package

- Product version: `0.12.1`
- Release label: `r11-cp9-b25`
- Base: b24; additive changes only.
- Includes: real raster tile map UI centered on Iran, touch/pointer polygon drawing and provider test UI; read-only ERP CreditNote mirror model; separate local credit-note request workflow; receivable reconciliation and conditional customer/task priority ranking.
- `npm test`: PASS; 587 assertions. `audit-actions`: 77/77 guarded. SQL contract audit PASS static-only. Changed-file syntax transpilation PASS.
- Not verified: full TypeScript typecheck/build, actual network tile rendering, Chromium/Safari/iPhone, SQL Server runtime/RLS, API or ERP sync. The release is not represented as production-ready.
- Read `HANDOFF.md`, `STATUS_b25.md`, `NOT_DONE_b25.md`, `TEST_RESULTS_b25.md`, `REQUIREMENTS_TRACEABILITY_b25.md`, and `docs/08_MASTER_AUDIT_AND_TRACEABILITY_b25.md` first.
