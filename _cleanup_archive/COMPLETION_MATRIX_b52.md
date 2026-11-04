# AKHAVAN CRM — Completion matrix b52

Status meanings: **DONE (source)** = implemented in current source with tests; **PARTIAL** = source capability exists but wider integration/acceptance remains; **BLOCKED EXTERNAL/ENV** = cannot verify without dependencies, services, credentials, or runtime infrastructure.

| Area | Status | Evidence / boundary |
|---|---|---|
| Task workflow, block/result/next action, local activity history | DONE (source) | `src/services/taskActivity.ts`, `src/services/taskWorkflow.ts`; workflow/activity tests. History is not immutable server audit. |
| Task SLA, attention ranking and capacity suggestions | PARTIAL | `src/services/taskIntelligence.ts`; no verified background scheduler or live notifications. |
| Operational exception center and data quality | DONE (source) | `src/services/operationalExceptionCenter.ts`; exception/data-quality tests. |
| Exception visibility scope | PARTIAL | `TasksWorkspace.tsx` checks existing client-side permissions; full page audit and server enforcement remain open. |
| Collection aging/promises and evidence | DONE (source) | deterministic aging, outcome/evidence services and regression tests; live ERP reconciliation not verified. |
| Record lifecycle/soft delete | PARTIAL | shared helpers exist; not every module/import adopts the policy yet. |
| ERP import idempotency and timestamp guard | DONE (source) | `src/lib/erpImportService.ts`, `tests/erpImportService.test.mjs`; malformed source timestamp is rejected. No server-side lock/DB unique constraint was runtime-tested. |
| Structured mentions across chat/forms | PARTIAL | mention engine and contract tests; all custom destinations/routes/ACL still need audit. |
| ERP context adapter | PARTIAL | in-memory TTL adapter contract only; no live ERP endpoint. |
| SQL Server schema/RLS contracts | PARTIAL | static audit PASS; SQL Server runtime policies, migrations and tenant isolation not executed. |
| Finance/receivables source of truth | PARTIAL | allocation/credit/reconciliation contracts exist; live accounting source not validated. |
| Sales → quote → invoice → dispatch → returns → settlement | PARTIAL | source contracts and modules exist; end-to-end external chain not verified. |
| Solar Ember UI and release metadata | PARTIAL | static contracts pass; production build and browser/device validation blocked. |
| Test suite | DONE (source tests) | `npm test` PASS. |
| Production build / TypeScript | BLOCKED ENV | `vite` and `vite/client` unavailable because dependencies are not installed. |
| Server authentication/RBAC, immutable audit, SLA worker, cross-device sync | BLOCKED EXTERNAL | requires selected/deployed backend. |
| ERP, maps/travel matrix, push, SMS/messenger, AI API | BLOCKED EXTERNAL | requires provider contracts, credentials, policy and sandbox/runtime verification. |

## Release acceptance
`npm test` and static SQL contract audit pass. Build/typecheck and runtime acceptance remain incomplete. Do not label this release production-ready.
