# AKHAVAN CRM — Completion matrix b51

Status meanings: **DONE (source)** = implemented in the current source with relevant tests; **PARTIAL** = some source capability exists but broader integration/coverage remains; **BLOCKED EXTERNAL** = cannot be validated or completed without runtime services, credentials, or infrastructure.

| Area | Status | Evidence / remaining boundary |
|---|---|---|
| Task workflow: block/result/next action, transitions and local activity history | DONE (source) | `src/services/taskActivity.ts`, `src/services/taskWorkflow.ts`; task workflow/activity tests. History is client-side, not immutable server audit. |
| Task SLA, attention ranking and capacity suggestions | PARTIAL | `src/services/taskIntelligence.ts`; background scheduler and live notifications are not present/verified. |
| Operational exception center | DONE (source) | `src/services/operationalExceptionCenter.ts`; task/collection exceptions, data-quality guards, deterministic ordering; tests in `tests/operationalExceptionCenter.test.mjs`, `tests/operationalExceptionDataQuality.test.mjs`. |
| Exception visibility scope | PARTIAL | b50 scoped task and finance exception visibility in `TasksWorkspace.tsx`; audit all pages and enforce permissions server-side remains open. |
| Collection aging and promises | DONE (source) | b49 deterministic reference-date and invalid-date handling; `tests/collectionDeterminism.test.mjs`. Does not establish ERP reconciliation. |
| Record soft-delete lifecycle helpers | PARTIAL | `src/lib/recordLifecycle.ts`; exception aggregation excludes soft-deleted tasks. App-wide adoption/import idempotency remains open. |
| Structured mentions across chat/forms | PARTIAL | mention engine and contract tests exist; custom form destinations, route access, and complete coverage still need audit. |
| ERP context adapter | PARTIAL | in-memory TTL/cache contract only; no live ERP connection or reconciliation run. |
| SQL Server schema/RLS contracts | PARTIAL | static audit passes; SQL Server runtime policies, tenant isolation and migrations have not been executed. |
| Finance/receivables truth | PARTIAL | Existing collection/credit/receivable logic and contract tests; live ERP/accounting source validation is blocked. |
| Sales → quote → invoice → dispatch → returns → settlement | PARTIAL | Source modules and integration contracts exist; end-to-end external-system chain has not been verified. |
| Solar Ember UI and release metadata | PARTIAL | Current tokens/atmosphere contracts pass; production build, browser and device validation are not certified. |
| Build / TypeScript / browser and mobile acceptance | BLOCKED ENVIRONMENT | `vite` executable and `vite/client` resolution missing; no browser/device E2E run. |
| Server authentication/RBAC, immutable audit, SLA worker, cross-device sync | BLOCKED EXTERNAL | Requires chosen backend and deployed services. |
| ERP, maps/travel matrix, PWA push, SMS/messenger delivery, AI API | BLOCKED EXTERNAL | Requires provider contracts, credentials, policies and sandbox/runtime verification. |

## Release acceptance
`npm test` and static SQL contract audit pass. Build/type-check and runtime acceptance are not complete. Do not label the product production-ready until the blocked acceptance items are run successfully.
