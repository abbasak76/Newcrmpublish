# CHANGELOG b35 — first audit remediation increment

- Centralized Lead/Opportunity pipeline labels and IDs; reused them in lead, negotiation and dashboard views.
- Added additive SQL Server soft-delete columns and active-record indexes for existing critical CRM entities, with idempotent existence checks.
- Added contract tests for shared pipeline usage and migration structure.
- Preserved b34 Phase 2 work.
- Tests: `npm test` PASS; `npm run audit:contracts` PASS (static only).
- Not claimed: TypeScript/build, actual SQL Server migration execution, browser IndexedDB integration, live ERP integration, or full closure of the audit.
