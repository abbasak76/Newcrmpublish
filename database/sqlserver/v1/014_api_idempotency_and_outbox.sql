/* Idempotent API writes and transactional outbox indexes. Apply after migrations 001-013. */
SET XACT_ABORT ON;
GO
IF OBJECT_ID(N'integration.ApiIdempotency', N'U') IS NULL
BEGIN
  CREATE TABLE integration.ApiIdempotency (
    TenantId uniqueidentifier NOT NULL,
    UserId uniqueidentifier NOT NULL,
    RouteCode nvarchar(80) NOT NULL,
    IdempotencyKey nvarchar(128) NOT NULL,
    RequestHash char(64) NOT NULL,
    ResponseStatus smallint NOT NULL,
    ResponseJson nvarchar(max) NOT NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ApiIdempotency_Created DEFAULT SYSUTCDATETIME(),
    ExpiresAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ApiIdempotency_Expires DEFAULT DATEADD(day, 7, SYSUTCDATETIME()),
    CONSTRAINT PK_ApiIdempotency PRIMARY KEY (TenantId, UserId, RouteCode, IdempotencyKey),
    CONSTRAINT FK_ApiIdempotency_Tenant FOREIGN KEY (TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_ApiIdempotency_User FOREIGN KEY (UserId) REFERENCES core.AppUser(UserId),
    CONSTRAINT CK_ApiIdempotency_ResponseJson CHECK (ISJSON(ResponseJson)=1),
    CONSTRAINT CK_ApiIdempotency_Status CHECK (ResponseStatus BETWEEN 200 AND 499)
  );
  CREATE INDEX IX_ApiIdempotency_Expiry ON integration.ApiIdempotency(ExpiresAtUtc);
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'integration.OutboxMessage') AND name=N'IX_Outbox_Dispatch')
  CREATE INDEX IX_Outbox_Dispatch ON integration.OutboxMessage(StatusCode, NextAttemptAtUtc, CreatedAtUtc)
    INCLUDE (TenantId, EventId, EventType, ContractVersion, AggregateType, AggregateId, AttemptCount);
GO
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name=N'TenantIsolationPolicy' AND schema_id=SCHEMA_ID(N'security'))
BEGIN
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.ApiIdempotency;
END;
GO
