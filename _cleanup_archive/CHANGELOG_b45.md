# CHANGELOG b45 — Task activity trail

- Added `src/services/taskActivity.ts` as the shared append-only activity helper for task lifecycle events; no parallel task engine was introduced.
- Integrated activity entries into task creation, editing/reassignment, completion and reopening in `TasksWorkspace.tsx`.
- `TaskCard` now shows the latest activity, timestamp, summary/details and event count when history exists.
- Added `tests/taskActivity.test.mjs` for append behavior, immutability, event-ID idempotency and latest-event selection.
- Boundaries: history remains in local app state and can be altered by a client; server-side immutable audit, actor identity enforcement and cross-device synchronization require backend phase.
