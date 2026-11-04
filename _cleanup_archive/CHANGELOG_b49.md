# Changelog b49 — Collection Determinism & Promise Exceptions

- Collection aging accepts an explicit reference date, enabling deterministic tests and consistent reports.
- Invalid or missing invoice due dates return zero overdue days instead of propagating `NaN`.
- Aging uses calendar-day boundaries to avoid time-of-day and daylight-saving drift.
- Operational exception center now includes promises explicitly marked `BROKEN`, not only pending promises whose due date passed.
- Added 8 assertions for deterministic aging, invalid dates, and stable summary calculations.
- Preserved existing collection engine and operational exception center; no accounting writes or parallel engines introduced.

## Validation
- `npm test`: run result recorded in `TEST_RESULTS_b49.md`.
- SQL contract audit: run result recorded in `TEST_RESULTS_b49.md`.
- Build and TypeScript require installed project dependencies; status recorded after execution.
