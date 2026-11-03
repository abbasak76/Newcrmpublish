# CHANGELOG — b50

## Release
- Product version: 0.12.24
- Release label: r11-cp9-b50-exception-access-scope
- Base: b49 collection determinism

## Changes
- Hardened the operational exception panel's visibility rules.
- Task exceptions are filtered by task record-level `tasks.VIEW` scope.
- Collection/financial exceptions are hidden unless the current user has `finance.VIEW` and passes record-level finance scope for the associated account.
- Active account context constrains the exception list to that account.
- Added static regression contracts for the three access boundaries and active-account filtering.

## Limits
- Client-side RBAC is a UX guard, not a security boundary. Backend authorization and SQL Server RLS remain mandatory for production.
- Full Vite build, TypeScript check, browser/mobile E2E, SQL Server runtime/RLS, ERP and delivery-provider tests are not claimed as passed.
