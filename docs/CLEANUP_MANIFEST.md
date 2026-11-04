# CLEANUP MANIFEST — AKHAVAN CRM (Batch B0 / Z6)

**Execution Date:** 2026-11-04  
**Directive Reference:** MASTER EXECUTION DIRECTIVE v3.6 — Section Z6  
**Archive Destination:** `_cleanup_archive/`  
**Total Items Archived:** 153 files

---

## 1. Summary of Archival Evaluation

All legacy patch files and redundant batch tracking reports have been evaluated against live code. None were deleted; all were safely moved to `_cleanup_archive/` to keep the root directory clean and prevent obsolete conflicting instructions from confusing agents or human engineers.

### A. Patch / Diff Files
| File Name | Evaluation Status | Reason & Live Verification |
| :--- | :--- | :--- |
| `DIFF_b18_to_b19.patch` | APPLIED | Changes incorporated into core state and UI components in earlier iterations. |
| `DIFF_b19_to_b20.patch` | APPLIED | Incorporated into schemas and reconciliation libraries. |
| `DIFF_b20_to_b21.patch` | APPLIED | Incorporated into services and tests. |
| `DIFF_b21_to_b22.patch` | APPLIED | Incorporated into stores and handlers. |
| `DIFF_b22_to_b23.patch` | APPLIED | Incorporated into components. |
| `DIFF_b23_to_b24.patch` | APPLIED | Incorporated into RBAC and models. |
| `DIFF_b24_to_b25.patch` | APPLIED | Incorporated into tests and components. |
| `DIFF_b24_to_b26.patch` | APPLIED | Replaced by direct source edits. |
| `DIFF_b26_to_b27.patch` | APPLIED | Incorporated into core views. |
| `DIFF_b31_to_b32.patch` | APPLIED | Incorporated into layout and workspaces. |

### B. Legacy Batch Report Dumps
* `BASELINE_REPORT_b19.md`, `b25.md`, `b26.md`: Superseded by live regression baseline in `TEST_RESULTS_b54.md`.
* `CHANGELOG_b15.md` through `b54.md`: Archived historical changelogs preserved in `_cleanup_archive/`. Current active changelog is consolidated in `HANDOFF.md` and `VERSION.md`.
* `NOT_DONE_b15.md` through `b28.md`: Legacy checklists resolved or tracked in `HANDOFF.md`.
* `PHASE_1_EVIDENCE_b40.md` through `b44.md`: Historical verification artifacts preserved in `_cleanup_archive/`.
* `RBAC_AUDIT_b18.md` through `b26.md`: Superseded by live RBAC tests (`tests/rbac.test.mjs`).
* `RELEASE_EXECUTION_JOB_b47.md` through `b53.md`: Historical execution steps safely preserved.
* `STATUS_b16.md` through `b40.md`: Historical milestone logs safely preserved.
* `TEST_RESULTS_b22.md` through `b54.md`: Historical run records safely preserved.

## 2. Integrity Assurance
* **No Direct File Deletions:** All 153 files were relocated to `_cleanup_archive/`.
* **Zero Disruption to Live Source:** No files inside `src/`, `server/`, `database/`, or `tests/` were moved or deleted.
* **Build and Test Verification:** Confirmed after relocation with `compile_applet` and `npm test`.
