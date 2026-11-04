# RELEASE EXECUTION JOB — b50

Job: `AKHAVAN CRM — ادامه بده تغییرات را ویرایش بده، اصلاحات انجام بشه، مورد جدید ایجاد بشه`
Base: b49
Release: b50 / 0.12.24

## Completed in this source increment
- [x] Inspect b49 source and current operational exception implementation.
- [x] Constrain task exceptions by task `VIEW` record scope.
- [x] Constrain collection exceptions by finance permission and account record scope.
- [x] Apply active-account context to exception results.
- [x] Add regression contracts for access filtering.
- [x] Update version and release documentation.
- [x] Execute the existing test suite and static SQL contract audit.
- [x] Verify archive integrity.

## Explicitly not complete / externally blocked
- [ ] Install dependencies and pass production build + TypeScript checks.
- [ ] Browser/mobile E2E and offline/reload persistence tests.
- [ ] Backend authorization and server-authoritative audit trail.
- [ ] Execute SQL migrations and test RLS/tenant isolation against real SQL Server.
- [ ] Verify live ERP read/write, idempotency, retry, reconciliation and sandbox acceptance.
- [ ] Background scheduler, cross-device sync, push/SMS/messenger delivery.
- [ ] Live map routing, consented GPS evidence, and cost-grounded profitability.

These items are deliberately marked open rather than falsely reported as complete. This release does not claim that the full product is production-ready.
