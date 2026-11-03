# Test results — b54 backend continuation 0.12.30
Date: 2026-10-29

| Check | Result | Evidence / limitation |
|---|---|---|
| `npm test` | PASS | Complete configured test suite, including backend security contracts; exit code 0. |
| `node tests/backendSecurityContracts.test.mjs` | PASS | Static assertions cover auth, tenant context, permission gates, account create, idempotency, outbox, audit and lockout procedures. |
| `npm run audit:contracts` | PASS | Static SQL audit: 15 SQL files, 58 tables, 56 tenant-scoped tables, 56 RLS targets, 5 required views. Does not execute SQL. |
| `npm run audit:source` | PASS | Static import graph: 129 source files, 121 reachable, 8 candidates retained for manual/dynamic review. |
| `npm run lint` | BLOCKED | TypeScript cannot find `vite/client`; local dependency installation is incomplete. |
| `npm run build` | BLOCKED | Local `vite` executable returns permission denied; environment dependency tree is not a valid build environment. |
| SQL Server migrations / RLS | NOT RUN | No SQL Server endpoint or credentials supplied. |
| Auth API / idempotency concurrency | NOT RUN LIVE | No SQL Server instance available. Static contract tests are not runtime proof. |
| ERP / browser / mobile E2E | NOT RUN | No configured ERP sandbox or browser test environment. |

## Release boundary
Do not describe this as production-ready. Apply migrations 013–015 only in a disposable/test SQL Server environment after DBA review. Validate procedure execution permissions, `SESSION_CONTEXT`, RLS negative cross-tenant tests, application-lock behavior, account/outbox atomicity, lockout behavior, and least-privilege SQL grants. The outbox event is queued, not delivered to ERP.
