# STATUS — r11-cp9-b36-lifecycle-integrity

## Implemented in this increment
- Added shared `recordLifecycle.ts` helpers for active filtering, soft-delete marking, and explicit restoration; these helpers preserve record identity and never physically delete records.
- Lead list, customer list, opportunity pipeline, and dashboard opportunity counts now ignore records marked deleted.
- Lead conversion reuses an existing linked account (`convertedAccountId` or `sourceLeadId`) rather than creating another customer on retry; conversion metadata and audit event are recorded on first conversion.
- Shared dynamic form renderer now locks submission while an asynchronous handler is pending and disables submit/cancel controls during that interval.
- Added lifecycle unit tests and audit contract assertions.

## Verification
- `npm test`: PASS (all configured test scripts).
- `npm run audit:contracts`: pending for this increment.
- `npm run lint` / `npm run build`: not yet verified; current environment previously lacked Vite/type dependencies.
- SQL Server migration execution, browser IndexedDB, and live ERP round-trip: not verified; no live connection details are available.

## Remaining audit boundaries (not to be reported as complete)
- The shared soft-delete helpers are not yet wired into every record type/action and do not provide a complete admin restore UI. Existing SQL migration has not been run against SQL Server.
- Review all direct entity lookups and secondary views for deleted-record leakage; current increment covers primary lead/customer/opportunity lists and dashboard opportunity counts only.
- Full database referential integrity, unique constraints, and lead-conversion transaction guarantees require the future SQL Server-backed API; the current persisted client store cannot provide database-level atomicity.
- Full pagination/virtualization for large lists, isolated dashboard widget rendering, global error/toast consolidation, and responsive conversion of every table remain open.
- Build/type-check and real browser/integration validation remain required before production acceptance.
