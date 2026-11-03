# Changelog b48 — Operational Exception Center

- Added `operationalExceptionCenter.ts`, a unified read-only aggregation contract that reuses existing task and collection engines.
- Integrated operational exceptions into Tasks Workspace: task blockers, overdue receivables, high collection risk, bounced cheques, and overdue collection promises.
- Exception cards show severity and recommended action; task entries open the existing task workflow. Non-task items are informational and do not pretend to post accounting changes.
- Added 7 assertions for cross-domain exception aggregation and priority.
- Version synchronized to 0.12.22 / r11-cp9-b48.

## Validation caveats
- Node test suite is expected to validate domain contracts; Vite build and TypeScript require project dependencies, which were not available at start of this work.
- Collection exception rows depend on the existing collection engine profiles and are only as current as the source state. No live ERP sync or server-side audit is claimed.
