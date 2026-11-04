# CHANGELOG b44 — Task triage queue

- Added SLA triage counters for breached, at-risk and unscheduled active tasks in `TasksWorkspace`.
- Added toggleable SLA filters with an explicit clear-filter action and accessible `aria-pressed` state.
- Replaced due-date-only ordering with the existing `rankTasksForAttention` engine, keeping risk-first ranking in the primary task queue.
- Reused existing SLA and task-intelligence services; no parallel engine or automatic reassignment was introduced.
- Added `tests/taskTriageWorkspaceContracts.test.mjs` and included it in `npm test`.
- The counters are client-side derived from current state; there is no background scheduler or server-enforced escalation in this increment.
