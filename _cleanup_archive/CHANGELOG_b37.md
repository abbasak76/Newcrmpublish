# Changelog — r11-cp9-b37-task-intelligence

- Added centralized operational capacity/SLA/scoring configuration.
- Added task urgency scoring, task categorization, workload checks, next-slot suggestions, overflow/delegation proposals, SLA deadline assignment and regional mission grouping.
- Added task creation capacity warning and authorized manager override path in Tasks Workspace.
- Added task hierarchy/access evaluation helpers and on-demand ERP context adapter contract with bounded in-memory TTL cache.
- Added multi-entity mention search and structured mention references in the task title form.
- Added SQL Server migration 012 for hierarchy, workload limits, task ACL, mention links, and context-cache persistence with tenant RLS extension.
- Added tests for task intelligence, mention resolution, task access, ERP context cache, and architecture contracts.
- Static SQL audit: 12 SQL files, 55 tables, 53 tenant-scoped/RLS targets, 5 required views. No SQL Server runtime execution claimed.
