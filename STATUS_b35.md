# STATUS — r11-cp9-b35-audit-remediation

## Implemented in this increment
- Centralized Lead and Opportunity pipeline stage labels/IDs in `src/config/pipeline.ts`; Leads, Negotiations and Dashboard now consume the shared configuration.
- Added SQL Server migration `database/sqlserver/v1/011_soft_delete_and_activity_indexes.sql`, which conditionally adds nullable `DeletedAtUtc` to the actual existing CRM tables Account, Lead, Opportunity, Activity, Task, Note, Quote, InvoiceMirror, SalesOrder and DispatchPlan; adds filtered indexes for active records and an active Activity history index. The migration is additive and does not physically delete data.
- Added `tests/auditRemediationContracts.test.mjs` to verify central stage configuration and migration contract.
- Preserved prior Phase 2 changes from b34.

## Verification
- `npm test`: PASS, including the new 15-assertion audit remediation contract test.
- `npm run audit:contracts`: PASS, 11 SQL files, 51 parsed table definitions/names, 49 tenant-scoped/RLS targets, 5 required views. Static source analysis only.
- Build/TypeScript: NOT VERIFIED / environment dependencies unavailable (`vite/client` missing; Vite not installed).
- SQL Server migration execution: NOT TESTED.
- Real browser IndexedDB: NOT VERIFIED.
- Live ERP end-to-end: NOT TESTED.

## Audit items not yet closed
- Soft-delete behavior is not yet enforced across all runtime queries/actions; this migration only adds persistence columns/indexes. Application-level filtering, restore/audit policy and SQL Server execution need follow-up.
- Lead-to-customer conversion integrity needs deeper domain mapping against current `crm.Account`/`crm.Lead` model; the generic `contacts/customers/deals` schema in the audit is not copied blindly because it does not match this project's SQL Server model.
- Activity/note filterable metadata and all required indexes need a query-by-query review; existing `crm.Activity` already has an account/time index.
- Dashboard widget isolation, large-list virtualization, form schema validation, double-submit prevention, optimistic updates, complete token cleanup, centralized API/error/toast handling, and mobile card-table review are not fully implemented by this increment.
- No `http://localhost:8000` occurrence was found in `src` during this pass; an API URL environment config was therefore not invented without an actual API client endpoint.

## Release decision
This is a partial audit-remediation increment, not a claim that the entire audit is closed. Do not apply migration 011 to production until it has been reviewed and executed on a disposable SQL Server database.
