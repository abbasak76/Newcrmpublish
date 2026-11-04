# Release Job b48 — «ادامه بده»

## 10 phases / 60 tracked tasks
1. [DONE] Re-open b47 source and inspect task/collection contracts.
2. [DONE] Define a single read-only cross-domain exception model.
3. [DONE] Reuse existing task exception evaluator.
4. [DONE] Accept collection profiles from the existing collection engine rather than duplicating receivable calculations.
5. [DONE] Add overdue receivable exceptions.
6. [DONE] Add high/critical collection risk exceptions.
7. [DONE] Add bounced cheque exceptions.
8. [DONE] Add overdue promise-to-pay exceptions.
9. [DONE] Sort by severity and amount, and explain recommended action.
10. [DONE] Integrate the unified queue into Tasks Workspace.
11. [DONE] Task exception cards open the existing workflow; non-task cards are informational.
12. [DONE] Avoid claiming accounting mutation from the exception panel.
13. [DONE] Add unit tests for unified exception output.
14. [DONE] Add 7 focused assertions.
15. [DONE] Add new test to npm test script.
16. [DONE] Synchronize package version.
17. [DONE] Synchronize metadata release.
18. [DONE] Synchronize app version constants.
19. [DONE] Update release contract test.
20. [DONE] Update version document.
21. [DONE] Add changelog.
22. [DONE] Add test-result report.
23. [DONE] Add this job ledger.
24. [DONE] Document the aggregation as read-only.
25. [DONE] Document no live ERP claim.
26. [DONE] Keep existing task/collection engines as sources.
27. [DONE] Preserve task click-through workflow.
28. [DONE] Show severity in queue.
29. [DONE] Show suggested next action for collection exceptions.
30. [DONE] Handle missing task title/identifier safely.
31. [DONE] Filter closed tasks from operational queue.
32. [DONE] Keep all generated exception IDs domain-prefixed.
33. [DONE] Keep amounts optional when not available.
34. [DONE] Include source provenance per exception.
35. [DONE] Sort critical before high and medium.
36. [DONE] Add bounced cheque count context.
37. [DONE] Add overdue invoice count context.
38. [DONE] Add days-overdue context.
39. [DONE] Add overdue promise detection.
40. [DONE] Ensure invalid promise dates do not create exceptions.
41. [DONE] Keep task exceptions actionable and collection exceptions non-mutating.
42. [DONE] Update UI empty state copy.
43. [DONE] Update UI title to operational exception center.
44. [DONE] Remove obsolete task-only queue variable from workspace.
45. [DONE] Add collection profile memoization.
46. [DONE] Add exception aggregation memoization.
47. [DONE] Avoid new parallel calculation engine.
48. [DONE] Avoid new database schema for derived queue.
49. [DONE] Keep external integration credentials out of source.
50. [DONE] Run focused unit test (PASS).
51. [DONE] Run full test suite once; found stale b47 release expectation.
52. [DONE] Update stale release expectation.
53. [DONE] Rerun full test suite after contract update (PASS).
54. [DONE] Run SQL contract audit (static PASS).
55. [BLOCKED_EXTERNAL] Vite build until dependencies are installed.
56. [BLOCKED_EXTERNAL] Full TypeScript lint until dependencies are installed.
57. [BLOCKED_EXTERNAL] Browser/mobile regression in a browser environment.
58. [BLOCKED_EXTERNAL] Live ERP receivables and cheque source verification.
59. [BLOCKED_EXTERNAL] Server-side authorization/audit verification.
60. [DONE] Package a release only after rerunning local checks.

No pending item will be described as complete until its check is actually run.
