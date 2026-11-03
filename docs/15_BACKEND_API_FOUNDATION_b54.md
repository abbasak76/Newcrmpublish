# Backend API foundation — b54 continuation

Date: 2026-10-29. Base source: b54 bundle (package version 0.12.27); resulting release 0.12.30.

## Implemented in source
- Added an Express API entry point at `server/index.mjs` with live/readiness health checks, correlation IDs, bounded JSON bodies, no-store responses, and sanitized errors.
- Added server-side bearer token issuance/verification using HMAC-SHA256, expiry/audience/issuer checks, and constant-time signature comparison.
- Added scrypt password verification and a tenant/user credential table in SQL migration `013_server_identity_and_audit.sql`.
- Added a controlled pre-authentication credential lookup procedure, tenant context initialization within SQL transactions, permission guard, and a tenant-scoped read-only accounts endpoint.
- Added a security/audit schema migration and static backend contract test.
- Added an authenticated `POST /api/v1/accounts` create path guarded by `accounts.CREATE`; account insert, audit event, outbox event, and idempotency response are committed in one SQL transaction.
- Added SQL-transaction-scoped application locking for idempotency keys; same-key/same-payload requests replay the stored response, while same-key/different-payload requests return 409.
- Added migration `014_api_idempotency_and_outbox.sql` with tenant-isolated idempotency records and an outbox dispatch index.
- Added migration `015_persistent_login_lockout.sql` and wired persistent failed-login counters with a 15-minute lockout after repeated failures; successful login resets the counter.

## API routes
- `GET /health/live`: process liveness; no secrets or database details.
- `GET /health/ready`: database/configuration readiness; returns 503 when not ready.
- `POST /api/v1/auth/login`: `{ tenantCode, userName, password }`; returns a 1-hour bearer token on success.
- `GET /api/v1/accounts?take=25&cursor=`: authenticated, permission-guarded, tenant-scoped read endpoint.
- `POST /api/v1/accounts`: authenticated, permission-guarded write endpoint. Requires `Idempotency-Key` (8–128 safe characters) and accepts `{ name, accountCode?, phone?, email?, ownerUserId? }`. Creates CRM account + audit + outbox atomically; outbox status means queued for integration, not confirmed ERP delivery.

## Required rollout sequence
1. Install dependencies and run `npm test`, `npm run audit:contracts`, `npm run build`, and `npm run lint`.
2. Review migration order and SQL Server version; apply migrations 001–013 only in a disposable/test database after backup and DBA review.
3. Create a least-privilege SQL principal. Grant only required operations, including `EXECUTE` on `security.GetLoginCredential`; do not use `sa`/sysadmin for the API.
4. Provision password hashes out-of-band with a cryptographically random salt and Node `scrypt`; never store or transmit plaintext passwords in migration files.
5. Verify `SESSION_CONTEXT` behavior with pooled connections and negative two-tenant RLS tests. Confirm that `WITH EXECUTE AS OWNER` credential lookup has the intended permissions under the actual deployment principal.
6. Add distributed rate limiting, token revocation/rotation, CSRF/CORS policy appropriate to deployment, and security monitoring before production exposure.
7. Add distributed rate limiting, token revocation/rotation, CSRF/CORS policy appropriate to deployment, and security monitoring before production exposure.
8. Implement and operate an outbox dispatcher with bounded retries, dead-letter review, ERP adapter contracts, and reconciliation before claiming external delivery.
9. Add further use cases only after mapping existing frontend workflows and validating permission catalog seeds against actual migration data.

## Explicit limitations
- This is a minimal backend foundation, not a completed production backend. Account read and a first account-create write path are implemented in source; distributed rate limiting, token revocation, broad audit coverage, outbox dispatcher, offline API sync, and ERP provider remain unimplemented.
- No SQL Server instance or ERP sandbox credentials were supplied, so no migration was executed and no live database/RLS/ERP claim is made.
- Frontend is not yet migrated to this API; existing local-state flows must not be described as server-backed.
- Login depends on migration 013 and the controlled stored procedure. Validate module execution/RLS interaction in SQL Server before use.
