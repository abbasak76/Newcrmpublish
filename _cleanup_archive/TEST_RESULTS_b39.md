# TEST RESULTS b39

- `npm test`: PASS (exit 0).
- `npm run audit:contracts`: PASS (exit 0).
- SQL audit is static only; no database connection or SQL execution.

## npm test output (tail)
```text

> react-example@0.12.13 test
> node --experimental-strip-types tests/rbac.test.mjs && node --experimental-strip-types tests/reminders.test.mjs && node --experimental-strip-types tests/policy.test.mjs && node --experimental-strip-types tests/receipt.test.mjs && node --experimental-strip-types tests/onboarding.test.mjs && node --experimental-strip-types tests/financeRequests.test.mjs && node --experimental-strip-types tests/negotiationEngine.test.mjs && node tests/quoteLifecycle.test.mjs && node tests/rbacScopeContracts.test.mjs && node --experimental-strip-types tests/operationsEngine.test.mjs && node --experimental-strip-types tests/operationsSeed.test.mjs && node --experimental-strip-types tests/rbac-configurability.test.mjs && node --experimental-strip-types tests/geoIntelligence.test.mjs && node tests/geoWorkspaceContracts.test.mjs && node --experimental-strip-types tests/collectionTaskOutcome.test.mjs && node --experimental-strip-types tests/collectionTaskEvidence.test.mjs && node --experimental-strip-types tests/geoCollectionReporting.test.mjs && node --experimental-strip-types tests/receivableReconciliation.test.mjs && node --experimental-strip-types tests/receivableCredits.test.mjs && node tests/creditNoteSqlContracts.test.mjs && node tests/accessibilityContracts.test.mjs && node tests/atmosphereContracts.test.mjs && node tests/domainIntegrationContracts.test.mjs && node --experimental-strip-types tests/phase2Flow.test.mjs && node --experimental-strip-types tests/erpImportService.test.mjs && node tests/auditRemediationContracts.test.mjs && node --experimental-strip-types tests/recordLifecycle.test.mjs && node --experimental-strip-types tests/taskIntelligence.test.mjs && node --experimental-strip-types tests/mentionEngine.test.mjs && node --experimental-strip-types tests/taskAccessEngine.test.mjs && node --experimental-strip-types tests/erpContextService.test.mjs && node tests/taskArchitectureContracts.test.mjs && node tests/universalMentionsChat.test.mjs

PASS: 191 assertions, 140 matrix combos (inactive-user deny sweep)
PASS: 22 assertions (reminders)
PASS: 9 assertions (policy/cpq)
PASS: 29 assertions (receipt flow)
PASS: 58 assertions (onboarding)
PASS: 22 assertions (finance requests)
PASS: 17 assertions (negotiation engine + CPQ cost completeness)
PASS: 10 assertions (quote lifecycle contracts)
PASS: 8 assertions (RBAC scope and identity contracts)
operationsEngine: PASS (32 assertions)
operationsSeed: PASS (16 assertions)
operationsSeed FMCG: PASS (7 assertions)
operationsSeed expanded finance: PASS (9 assertions)
PASS: 13 assertions (configurable RBAC profiles, geo access, scopes, hierarchy, direct supervisor and cycle safeguards)
PASS: 14 assertions (GeoJSON polygon validation, point-in-polygon, geometry versioning, metric source semantics)
PASS: 46 assertions (geo routing/RBAC/scope, touch map/provider controls, credit-note workflow and collection reporting)
PASS: 11 assertions (collection task outcome validation and payment-source integrity)
PASS: 6 assertions (collection task evidence type and size validation)
PASS: 21 assertions (zone collection report aggregation and CSV export)
PASS: 20 assertions (receivable allocation reconciliation and explicit credit-source blocker)
PASS: 16 assertions (posted credit notes, balances, source validation, overdue priorities and blocked ranking)
PASS: 20 assertions after approved/voided/source-isolation cases
PASS: 6 assertions (ERP credit-note mirror, canonical balance view and tenant RLS contract)
PASS: 10 assertions (UI scale, graphics quality, form autosave privacy guard and screen-reader announcements)
PASS: 11 assertions (iOS-style atmosphere, reduced motion, low graphics and release metadata)
PASS: domain integration traceability and non-production boundaries
phase2Flow tests passed
erpImportService tests passed
PASS: 15 assertions (shared pipeline config and additive SQL Server soft-delete/index migration contracts)
PASS: additional lifecycle, lead conversion and form submit contracts
PASS: 10 record lifecycle assertions
taskIntelligence.test.mjs: PASS
mentionEngine.test.mjs: PASS
taskAccessEngine.test.mjs: PASS
erpContextService.test.mjs: PASS
taskArchitectureContracts.test.mjs: PASS (13 architecture assertions)
universalMentionsChat.test.mjs: PASS (9 cross-surface contracts)
(node:15467) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15478) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15489) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15500) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15511) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15522) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15533) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15566) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15577) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15588) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15599) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15621) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15632) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15643) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15654) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15665) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15720) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15731) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15753) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15764) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15775) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15786) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:15797) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

```

## Static SQL contract audit
```text

> react-example@0.12.13 audit:contracts
> node scripts/audit-sqlserver-contracts.mjs

AKHAVAN CRM SQL Server contract audit
{
  "sqlFiles": 12,
  "rawCreateTableDefinitions": 55,
  "uniqueRawTableNames": 55,
  "rawDefinitionCountMatchesParsedTables": true,
  "tables": 55,
  "tenantScopedTables": 53,
  "rlsTargets": 53,
  "requiredViews": 5,
  "mode": "static-only; no database connection or SQL execution"
}
Result: PASS (static checks only; database runtime/security tests remain required)

```
