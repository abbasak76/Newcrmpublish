# CHANGELOG — b52

## ERP import timestamp validation
- `normalizeRecord` now rejects supplied `sourceModifiedAtUtc` values that cannot be parsed as a valid timestamp.
- Invalid timestamp rows are counted as import conflicts and cannot insert or overwrite an ERP mirror.
- Added regression assertions to `tests/erpImportService.test.mjs` for malformed timestamp rejection and unchanged state.
- Release metadata synchronized to `0.12.26` / `r11-cp9-b52-erp-import-timestamp-guard`.

## Scope and limitations
- This protects the source-side import planner only. It does not establish a live ERP connection, server-side idempotency, distributed locking, or database uniqueness constraints.
