# AKHAVAN CRM b26 release package

- Product version: `0.12.2`
- Release label: `r11-cp9-b26`
- Base: b24; includes additive b25 and b26 work.
- Includes: touch-drawn zone polygons on an interactive raster map; provider selection/test UI; ERP-only credit-note mirror model; local credit-note request workflow; guarded receivable reconciliation and conditional collection task priorities; UI scale settings; manual/automatic graphics quality; WebGL fallback on constrained devices; dynamic form draft autosave; screen-reader announcements for validation.
- `npm test`: PASS; 597 assertions. `audit-actions`: 77/77 guarded. SQL contract audit PASS static-only. Changed-file syntax transpilation PASS.
- Not verified: full TypeScript typecheck/build, actual network tile rendering, Chromium/Safari/iPhone, SQL Server runtime/RLS, API or ERP sync. The release is not represented as production-ready.
- Read `HANDOFF.md`, `STATUS_b26.md`, `NOT_DONE_b26.md`, `TEST_RESULTS_b26.md`, `REQUIREMENTS_TRACEABILITY_b26.md`, and `docs/08_MASTER_AUDIT_AND_TRACEABILITY_b26.md` first.
