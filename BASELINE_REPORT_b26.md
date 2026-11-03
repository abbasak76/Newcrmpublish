# BASELINE REPORT — b26

- Source baseline: `AkhavanCRM-SolarEmber_r11-cp9_b24.zip`
- Current package version: `0.12.2 / r11-cp9-b26`
- Includes the b25 map/credit reconciliation work plus b26 accessibility, performance-mode and form-draft safeguards. Changes are additive; prior feature files remain in the package.
- Key new/changed files: `src/components/GeoZoneMapEditor.tsx`, `src/components/LiveAnnouncer.tsx`, `src/components/shared/DynamicFormRenderer.tsx`, `src/components/SettingsWorkspace.tsx`, `src/components/AtmosphereLayer.tsx`, `src/App.tsx`, `src/components/GeoIntelligenceWorkspace.tsx`, `src/components/FinanceWorkspace.tsx`, `src/lib/receivableReconciliation.ts`, `src/types.ts` and tests.
- SQL `CreditNoteMirror`, canonical invoice-balance views and RLS already existed in b24; no duplicate SQL source was created.
- `npm test`: 595 assertions PASS; `audit-actions`: 77/77 guarded; `audit:contracts`: static-only PASS; syntax transpilation for ten changed files PASS.
- `tsc --noEmit` blocked by missing `vite/client`; `npm run build` blocked by missing `vite`; tile endpoint DNS probe failed; browser/Safari/iPhone/SQL runtime/ERP end-to-end not executed.
