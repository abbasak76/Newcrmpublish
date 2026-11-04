# Changelog b36

- Introduced shared lifecycle predicates/helpers for soft-deleted CRM records.
- Excluded deleted leads, accounts and opportunities from primary lists; excluded deleted opportunities from dashboard stage counts.
- Made lead-to-account conversion idempotent across retries and stale callbacks using `sourceLeadId` / `convertedAccountId` links.
- Added duplicate-submit lock and pending-state feedback to `DynamicFormRenderer` without introducing a parallel form engine or dependencies.
- Added lifecycle tests and contract assertions.
- No live SQL Server, browser IndexedDB, or ERP connection was available; those verifications remain open.
