# Backend continuation changelog — b54

## 0.12.30 — account create, idempotency and login lockout
- Added `POST /api/v1/accounts`, permission gated by `accounts.CREATE`.
- Account insert, audit event, outbox event and idempotency response are committed in one SQL transaction.
- SQL transaction application lock serializes idempotency keys; same-key/same-payload requests replay stored responses; different payloads return 409.
- Added migration 014 for tenant-isolated idempotency records and outbox dispatch index.
- Added migration 015 for persistent failed-login counters and a 15-minute lockout after repeated invalid credentials; successful login resets counters.
- Expanded backend static contract assertions.
- No live SQL Server, RLS, or ERP execution is claimed; integration deployment remains gated on a disposable SQL Server test environment.
