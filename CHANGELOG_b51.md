# CHANGELOG — b51

## Operational exception data-quality hardening
- Operational exception aggregation now excludes soft-deleted tasks using the shared `activeRecords` lifecycle helper.
- Malformed collection adapter rows are handled defensively: empty account IDs are ignored, duplicate account profiles are deduplicated, invalid numeric signals do not create misleading financial exceptions, and non-finite amounts are never exposed.
- Missing invoice arrays and promise arrays are handled safely.
- Added `tests/operationalExceptionDataQuality.test.mjs` (6 assertions) and wired it into `npm test`.
- Release metadata synchronized to `0.12.25` / `r11-cp9-b51-exception-data-quality`.

## Scope and limitations
- The exception center remains a read-only projection over existing task/collection engines; it does not create or post accounting records.
- This is client/source-side data-quality hardening, not a substitute for server-side validation, authorization, audit, or database constraints.
