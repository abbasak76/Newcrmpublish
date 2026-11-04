# BASELINE REPORT — b25

- Source baseline: `AkhavanCRM-SolarEmber_r11-cp9_b24.zip`
- Base package version: `0.12.0 / r11-cp9-b24`
- Current package version: `0.12.1 / r11-cp9-b25`
- Change policy: additive only; existing files and workflows preserved except for the minimum necessary integration edits.
- Key changed/new files: `src/components/GeoZoneMapEditor.tsx`, `src/components/GeoIntelligenceWorkspace.tsx`, `src/components/FinanceWorkspace.tsx`, `src/lib/receivableReconciliation.ts`, `src/types.ts`, `tests/geoWorkspaceContracts.test.mjs`, `tests/receivableCredits.test.mjs`, `tests/creditNoteSqlContracts.test.mjs`, `package.json`, and b25 audit/handoff/status docs.
- Important discovery: SQL `crm.CreditNoteMirror`, `analytics.vw_InvoiceBalance`, `analytics.vw_AccountReceivable` and `CreditNoteMirror` RLS were already present in b24. b25 did not add a duplicate SQL table.
- Financial source safety: local credit-note requests are not accounting records and do not reduce receivables. Official credits must arrive as `ERP_MIRROR` records from backend synchronization.
- No source build or browser run was possible: `vite` and `vite/client` are absent; tile endpoint DNS resolution failed in this environment.
