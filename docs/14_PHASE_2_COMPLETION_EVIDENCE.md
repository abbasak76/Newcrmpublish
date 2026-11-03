# Phase 2 and Audit Remediation — Implementation Evidence (b35)

> This document keeps Phase 2 evidence and the first audit-remediation increment distinct. Passing local tests do not mean that SQL Server, a browser IndexedDB transaction, or a live ERP connection has been exercised.

## b35 audit remediation additions
- `src/config/pipeline.ts` centralizes Lead and Opportunity stage IDs and labels. `LeadsWorkspace`, `NegotiationsWorkspace`, and `DashboardWorkspace` consume this shared vocabulary. This addresses duplicated stage definitions; it does not complete the audit's entire hardcode/design-token review.
- `database/sqlserver/v1/011_soft_delete_and_activity_indexes.sql` conditionally adds nullable `DeletedAtUtc` to the project's actual SQL Server entities: `crm.Account`, `crm.Lead`, `crm.Opportunity`, `crm.Activity`, `crm.Task`, `crm.Note`, `crm.Quote`, `crm.InvoiceMirror`, `crm.SalesOrder`, and `crm.DispatchPlan`. It adds filtered active-row indexes and an active activity-history index. It is additive and does not physically delete records.
- Important limitation: adding the column is not equivalent to implementing end-to-end soft-delete semantics. Runtime read filters, permissions for delete/restore, audit events, and SQL Server execution are still required. Do not apply this migration to production without review and a disposable SQL Server test.
- The supplied audit's example PostgreSQL tables (`contacts`, `deals`, `users`, `JSONB`, `GENERATED ALWAYS AS IDENTITY`) were not copied directly because this project uses a different SQL Server schema and existing RBAC/domain tables. `crm.Activity` already had an account/time index, so the migration adds a filtered live-history index rather than duplicating the generic example blindly.
- Source scan found no `http://localhost:8000` in `src`; no hypothetical API endpoint configuration was added without a real API client to wire it into.
- The project already includes reusable `EmptyState` and `Skeleton` components. Their existence alone does not prove all screens use loading/error/empty states consistently.
- Not yet fully applied: complete dashboard widget isolation/memoization, virtual scrolling for all large lists, React Hook Form/Zod across all forms, all double-submit guards, optimistic rollback for all stage changes, comprehensive design-token cleanup, and centralized API error/toast handling. No dependencies were added just to satisfy a generic audit recommendation without validating the existing implementation.

## b34 Phase 2 code changes retained

Only Phase 2 from `docs/12_EXECUTION_HANDOFF_PLAN.md` was worked on. Phase 3 task workflow and Phase 4 general quality/RBAC expansion were not started. This evidence distinguishes local code from external ERP/SQL execution.

## Baseline audit findings
- Canonical domain rules are in `docs/11_CANONICAL_SALES_DISTRIBUTION_FLOWS.md`.
- SQL Server mirror already exists: `crm.InvoiceMirror` / `crm.InvoiceLineMirror` in `database/sqlserver/v1/003_external_mirror_and_finance.sql`; invoice identity is unique by `(TenantId, SourceSystemCode, ExternalInvoiceId)`.
- CRM-owned negotiation orders and order lines exist in `database/sqlserver/v1/008_sales_dispatch_extension.sql` as `crm.SalesOrder` and `crm.SalesOrderLine`; before this phase, the schema had an external order ID but no unique source-scoped index on it.
- Dispatch plan and invoice relationship exists in SQL through `crm.DispatchPlanLine` → `crm.InvoiceMirror`; the local workspace previously exposed order assignment as the primary dispatch relationship.
- Existing integration control-plane tables are in `002_integration_schema.sql`: Connector, ConnectorRun, ExternalIdentityMap, FieldOwnership, InboundEnvelope, RawRecord and OutboxMessage. No configured operational ERP connector or ERP credentials are included in the source bundle.
- CPQ implementation is `src/lib/cpqEngine.ts` (`calculatePriceWaterfall`, `calculateQuoteLineMargin`, `canEditQuoteLines`). Previously the operations order approval path checked risk but did not persist a CPQ calculation snapshot on the order.

## Phase 2 code changes

5. `src/lib/erpImportService.ts` (b34 addition)
   - Adds the persisted app-store import boundary for ERP sales orders and ERP invoice mirrors. It normalizes source-scoped identity, applies idempotent upsert, rejects missing identity, skips older source versions, counts duplicate-key conflicts, and serializes calls in the same browser tab.
   - `importErpIntoApp` delegates to the existing Zustand store and persistence path. It is callable by a future/configured connector adapter; the source package still has no live ERP connector or credentials, so no live integration is claimed.
   - Invoice imports are explicitly marked `isErpMirror` and `readOnlySource: 'ERP'`; this does not create official invoices.
6. `tests/erpImportService.test.mjs` and `package.json` (b34 addition)
   - Covers repeat import without duplicate order rows, source isolation, stale update rejection, missing identity, invoice mirror flags, and serialized adapter commits. These are Node-level service tests, not actual browser IndexedDB tests.
1. `src/lib/phase2Flow.ts`
   - Adds source-scoped external identity keys (tenant + source system + entity type + external ID).
   - Adds idempotent upsert contract for repeated ERP imports, rejects records without stable source identity, detects pre-existing duplicate identity conflicts, ignores stale source versions and preserves CRM-owned fields when omitted from incoming source payload.
   - Adds the active negotiable ERP-order predicate (excludes void/cancelled and invoiced orders).
   - Adds invoice distribution classification. An invoice is `IN_DISTRIBUTION` only when it is linked to a plan with a non-empty distribution output number; no plan/output means `NOT_YET_IN_DISTRIBUTION`. Voided/cancelled or unidentifiable invoices remain `UNKNOWN`.
   - Adds pending/succeeded/failed ERP change-request response state helpers. These are domain contracts only; no live ERP call is claimed.
   - Adds order CPQ evaluation using the existing `calculatePriceWaterfall` engine; it validates order lines and returns a price snapshot without issuing an invoice.
2. `src/components/OperationsControlWorkspace.tsx`
   - Order approval now runs the existing CPQ engine through `evaluateOrderCpq`, blocks invalid order lines and stores the evaluated snapshot/status/time on the local order before approval is completed.
   - Dispatch plan UI now records invoice IDs separately from order IDs, exposes the distribution output number, and offers invoice-to-plan linking. The UI warns/rejects a local link when no output number is present and warns against assigning an invoice to multiple plans with an output number.
   - All local changes are audited as local state. This does not imply ERP state was changed.
3. `database/sqlserver/v1/008_sales_dispatch_extension.sql`
   - Adds an idempotent filtered unique index on `(TenantId, SourceSystemCode, ExternalOrderId)` when source and external ID are present. Visible order numbers are not used as a cross-ERP global key.
4. `tests/phase2Flow.test.mjs` and `package.json`
   - Adds repeat-import, stale update, missing identity, source namespace, active-order filter, distribution output rule, ERP response status and order CPQ assertions.

## Test evidence
- `npm test`: PASS, including existing tests and both `phase2Flow` and `erpImportService` test suites.
- `npm run audit:contracts`: PASS as a static-only audit (51 SQL tables parsed, 49 tenant-scoped/RLS targets, 5 required views). It does not connect to SQL Server.
- `node --experimental-strip-types tests/phase2Flow.test.mjs`: PASS.
- `npm run lint`: NOT PASS / BLOCKED before project type-checking because `vite/client` type definitions are absent (`TS2688`).
- Vite build: BLOCKED because Vite is not installed in the working environment (`vite: not found`).
- Browser IndexedDB integration: NOT VERIFIED; Chromium test runner hangs in this environment. Node-level tests do not substitute for actual IndexedDB transaction testing.
- SQL Server migration execution: NOT TESTED; no SQL Server connection/environment was provided.
- ERP live import/export, concurrent sync, timeout-after-success retry, live invoice pull and ERP response round-trip: NOT TESTED; no configured adapter/credentials/API endpoint exists in this source package.

## Remaining external blockers (not code-phase scope drift)
- A real ERP connector contract and configuration must be supplied to execute import/export. The local source cannot truthfully claim successful ERP send/fetch without it.
- SQL index/migration must be executed against a disposable SQL Server database and existing data checked for duplicate source identities before rollout.
- Current local UI still has no configured ERP connector or UI-triggered live sync. `importErpIntoApp` is the app-store boundary for an adapter, not a network connector. Same-tab serialization is not a distributed lock, and actual browser IndexedDB behavior remains unverified.

## Rollback
Revert commit `phase2: connect order CPQ and invoice dispatch links` or apply `DIFF_b32_to_b33_phase2.patch` in reverse. The SQL index is additive and can be dropped by name only after confirming no production integration depends on it.


## b35 verification
- `npm test`: PASS, including `tests/auditRemediationContracts.test.mjs` (15 assertions).
- `npm run audit:contracts`: PASS, static only; 11 SQL files, 51 table definitions/names, 49 tenant-scoped/RLS targets, 5 required views.
- TypeScript/build, real browser IndexedDB, SQL Server migration execution, and live ERP remain NOT VERIFIED/NOT TESTED for the reasons recorded in `STATUS_b35.md`.
