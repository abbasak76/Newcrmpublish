# Test results — b52

- `npm test`: PASS; full configured suite completed, including ERP import regression tests.
- `tests/erpImportService.test.mjs`: PASS with malformed timestamp assertions included.
- `npm run audit:contracts`: PASS, static only: 12 SQL files, 55 raw CREATE TABLE definitions, 53 tenant-scoped/RLS targets, 5 required views.
- `npm run build`: BLOCKED (exit 127), `vite: not found`; dependencies are not installed in this workspace.
- `npm run lint`: BLOCKED (exit 2), TypeScript cannot resolve `vite/client` due to missing installed dependencies.
- SQL Server runtime/RLS, ERP sandbox, browser/mobile E2E, PWA/push/messenger delivery: NOT RUN; no configured external services/credentials in this environment.

This is a source/test release, not a production acceptance certificate.
