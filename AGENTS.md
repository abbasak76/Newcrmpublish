# AKHAVAN CRM — AI Agent & Developer Execution Manual (AGENTS.md)

**Document Version:** 1.0  
**Status:** Mandatory Engineering Execution Guide  
**Required Pre-Reading:** Any AI agent or developer MUST read `INSTRUCTIONS.md` and `PROJECT_KNOWLEDGE.md` prior to executing tasks in this codebase.

---

## 1. Design System & User Experience Laws

### Solar Ember Design System
* **Locale & Layout:** Persian (fa-IR) first, strictly Right-to-Left (`dir="rtl"`), Vazirmatn Persian typography with Inter for alphanumeric codes.
* **Palette Discipline:**
  * **Brand Primary:** Blue (`#2563EB`, scale `--color-primary-50` through `--color-primary-800`). All primary buttons, active tabs, links, and system indicators use this primary blue.
  * **Plum / Cherry (`#71364B`):** Strictly restricted to two specific surfaces: (a) The "Yar" smart suggestion card, and (b) The hamburger drawer panel background. Never apply `#71364B` to standard buttons or random borders.
  * **Semantic Tokens:** Success (`#16A34A`), Warning (`#D97706`), Danger (`#DC2626`), Info (`#2563EB`), AI Accent (`#7C3AED`).
* **Responsive Layouts:**
  * Clean edge-to-edge mobile container width without double nested margins. Workspaces standardize on `w-full space-y-4 px-1 py-1 sm:px-3 sm:py-3 pb-24`.
  * Desktop layouts scale gracefully up to `max-w-6xl w-full mx-auto`.
* **Zero Visual Clutter:** Avoid heavy saturated gradients, random card background colors, or unstyled borders.

### The Four Mandatory UI States
Every data-driven component or view MUST explicitly handle all four lifecycle states:
1. **Loading State:** Render structured skeletons (`Skeleton`, `CardSkeleton`) that mirror the real dimensions and shape of the forthcoming content.
2. **Empty State:** Use the `EmptyState` component with a relevant icon, explanatory title, supportive caption, and an actionable primary button to create or reset.
3. **Error State:** Human-readable Persian error message, an actionable "Retry" / "تلاش مجدد" trigger, and preservation of user inputs where applicable.
4. **Success / Data State:** Clean presentation of records, real KPI metrics, and operational actions.

### Accessibility (a11y)
* Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
* Semantic HTML form inputs with connected `<label>` elements.
* Minimum touch targets of 44x44px for all mobile interactive controls.
* High-contrast text readability (avoiding light gray text on white cards).
* ARIA live regions (`LiveAnnouncer`) for screen readers on dynamic state updates.
* Respect for user motion preferences (`prefers-reduced-motion`).

---

## 2. Engineering Quality, Security & Performance

### The Immutable Chain of Data Custody
A feature is never considered working merely because a UI input captured a keystroke. Every state change must complete the unbroken chain:

$$\text{User Input} \xrightarrow{\text{1. Validate}} \text{Dynamic Engine} \xrightarrow{\text{2. Mutate}} \text{Zustand State} \xrightarrow{\text{3. Persist}} \text{IndexedDB} \xrightarrow{\text{4. Link}} \text{Entity Graph} \xrightarrow{\text{5. Read-Back}} \text{Live UI View}$$

1. **Validation:** Input sanitized and validated against schema constraints.
2. **State Mutation:** Pure immutable updates via Immer/Zustand.
3. **Persistence:** Written to IndexedDB local storage.
4. **Relational Integrity:** Foreign keys (`accountId`, `quoteId`, etc.) and mention references properly linked.
5. **Read-Back Verification:** Data successfully reloaded and rendered in UI lists and dossiers.

### Security Directives
* **Server-Authoritative RBAC:** Client UI hiding (`canOn(...)`) is for UX convenience only. Sensitive mutations must be validated against the active user's permissions and scope in the service layer.
* **Zero Credential Exposure:** Never expose ERP API secrets, private encryption keys, or service tokens in client-side bundles or `.env` files.
* **Audit Trail:** All destructive actions, quote approvals, credit note creations, and status shifts must log an immutable entry into `state.auditLogs`.

### Performance Rules
* Debounce all high-frequency search and filter inputs by at least 250ms.
* Prevent wasteful re-renders using `useMemo` for derived lists and timelines.
* Virtualize or paginate lists exceeding 100 records.
* Avoid adding heavy npm dependencies without explicit justification and verifying bundle footprint.

---

## 3. Backlog Tracking & Task State Classification

Every feature, ticket, or backlog item in `HANDOFF.md` and changelogs must be categorized using one of these strict states:

| Status Code | Meaning | Requirements to Qualify |
| :--- | :--- | :--- |
| **DONE & VERIFIED** | Completed and Proven | Implemented in source, accessible via UI/routing, validated with passing automated test assertions. |
| **IMPLEMENTED, NOT VERIFIED** | Coded but Unproven | Code written, but automated tests or end-to-end verification have not yet been executed. |
| **PARTIAL** | In Progress | Part of the workflow is functional; sub-tasks remain incomplete. |
| **BLOCKED** | Impeded | Cannot proceed due to a specific external dependency, missing backend API, or missing decision. |
| **NOT STARTED** | Backlog | Defined in scope, but development has not yet begun. |
| **NOT APPLICABLE** | Out of Scope | Formally documented as excluded from the current phase with architectural rationale. |

### Strict Rule for Marking Tasks as "DONE"
A task may **ONLY** be marked as `DONE & VERIFIED` when all seven conditions are met:
1. Code is fully implemented in the source files.
2. Feature is reachable via active navigation or valid routes.
3. Integrated with relevant data models, stores, and central engines.
4. Persistence and read-back have been confirmed.
5. RBAC security checks and input validations are enforced.
6. Relevant unit/contract tests have run and passed.
7. Documentation and `HANDOFF.md` have been updated with exact evidence.

---

## 4. Standard 6-Phase Development Protocol

When assigned any development task, follow this exact sequence:

```
[Phase 1: Understand] -> [Phase 2: Scope] -> [Phase 3: Implement] -> [Phase 4: Test] -> [Phase 5: Audit Diff] -> [Phase 6: Deliver]
```

### Phase 1: Understand Live State
* Inspect `INSTRUCTIONS.md`, `PROJECT_KNOWLEDGE.md`, and `HANDOFF.md`.
* Locate the existing workspaces, components, and service engines involved.
* Inspect git status and existing test files.

### Phase 2: Define Scope & Acceptance Criteria
* Articulate the precise expected behavior in 2-3 clear acceptance criteria.
* Identify any edge cases (e.g. empty states, permission denied, offline mode).

### Phase 3: Implement Incrementally
* Write clean, idiomatic TypeScript and Tailwind CSS code.
* Reuse existing engines (`DynamicFormRenderer`, `RBACService`, `receiptFlow`, `jalali`).
* Do not introduce breaking regressions in neighboring components.

### Phase 4: Test & Verify
* Run the relevant test suite via `npm test -- --run` or targeted test runners.
* Run compilation check (`compile_applet`) to verify zero build errors.
* Fix any failing assertions or lint issues before proceeding.

### Phase 5: Audit Diff & Quality Gate
* Review the git diff to ensure no stray debug statements, unused imports, or unexpected changes were introduced.
* Verify mobile responsiveness and RTL text direction.

### Phase 6: Deliver & Handoff
* Update `HANDOFF.md` with the new verified state.
* Provide a concise, professional completion report summarizing changes, files, test proof, and remaining items.

---

## 5. Final Release Acceptance Checklist

Prior to considering any release or milestone complete, verify every item on this checklist:

- [ ] **Build Compilation:** `npm run build` or `compile_applet` succeeds with 0 errors.
- [ ] **Typecheck:** Zero fatal TypeScript type errors in production files.
- [ ] **Automated Tests:** All test suites in `tests/` pass with 100% success rate.
- [ ] **Central Form Integration:** Forms utilize `DynamicFormRenderer` and centralized schemas.
- [ ] **Mention System:** Mention triggers and preview cards functional in chat and notes.
- [ ] **Persistence:** Verified writing to and reading from local IndexedDB storage.
- [ ] **Deduplication:** Foreign keys and external IDs verified for zero duplicate generation.
- [ ] **RBAC & Security:** Capabilities and scopes properly enforced on views and actions.
- [ ] **Sales & Finance Cycles:** Quote CPQ, order progression, invoices, and cheques operate consistently.
- [ ] **4 UI States:** Loading, Empty, Error, and Success verified for new views.
- [ ] **Responsive & Mobile Viewport:** No double-padding, side margins clipped, or horizontal page overflow.
- [ ] **Accessibility:** Keyboard navigation, visible focus indicators, and touch targets $\ge 44\text{px}$.
- [ ] **Documentation Sync:** `HANDOFF.md` and `VERSION.md` updated with exact verification evidence.
- [ ] **Infrastructure Boundaries:** Clean separation between local mock fixtures and live backend endpoints.
