/* Server-side credentials and append-only audit foundation. Apply only after review in a non-production database. */
SET XACT_ABORT ON;
GO
IF SCHEMA_ID(N'security') IS NULL EXEC(N'CREATE SCHEMA security');
GO
IF OBJECT_ID(N'security.UserCredential', N'U') IS NULL
BEGIN
  CREATE TABLE security.UserCredential (
    TenantId uniqueidentifier NOT NULL,
    UserId uniqueidentifier NOT NULL,
    PasswordSaltHex varchar(128) NOT NULL,
    PasswordHashHex varchar(256) NOT NULL,
    HashAlgorithm varchar(20) NOT NULL CONSTRAINT DF_UserCredential_Algorithm DEFAULT 'scrypt',
    IsEnabled bit NOT NULL CONSTRAINT DF_UserCredential_Enabled DEFAULT 1,
    PasswordChangedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_UserCredential_Changed DEFAULT SYSUTCDATETIME(),
    FailedAttempts int NOT NULL CONSTRAINT DF_UserCredential_Failed DEFAULT 0,
    LockedUntilUtc datetime2(3) NULL,
    CONSTRAINT PK_UserCredential PRIMARY KEY(TenantId, UserId),
    CONSTRAINT FK_UserCredential_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_UserCredential_User FOREIGN KEY(UserId) REFERENCES core.AppUser(UserId),
    CONSTRAINT CK_UserCredential_Algorithm CHECK(HashAlgorithm='scrypt'),
    CONSTRAINT CK_UserCredential_Failed CHECK(FailedAttempts>=0)
  );
END;
GO
IF OBJECT_ID(N'security.AuditEvent', N'U') IS NULL
BEGIN
  CREATE TABLE security.AuditEvent (
    AuditEventId bigint IDENTITY(1,1) NOT NULL,
    TenantId uniqueidentifier NOT NULL,
    ActorUserId uniqueidentifier NULL,
    CorrelationId nvarchar(100) NOT NULL,
    EventType nvarchar(120) NOT NULL,
    EntityType nvarchar(100) NOT NULL,
    EntityId nvarchar(120) NULL,
    OutcomeCode varchar(20) NOT NULL,
    OccurredAtUtc datetime2(3) NOT NULL CONSTRAINT DF_AuditEvent_Occurred DEFAULT SYSUTCDATETIME(),
    DetailsJson nvarchar(max) NULL,
    CONSTRAINT PK_AuditEvent PRIMARY KEY(AuditEventId),
    CONSTRAINT FK_AuditEvent_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT CK_AuditEvent_Outcome CHECK(OutcomeCode IN ('SUCCESS','DENIED','FAILED')),
    CONSTRAINT CK_AuditEvent_Json CHECK(DetailsJson IS NULL OR ISJSON(DetailsJson)=1)
  );
  CREATE INDEX IX_AuditEvent_Tenant_Time ON security.AuditEvent(TenantId, OccurredAtUtc DESC);
END;
GO
/* Extend the existing tenant policy after the base 006 migration has created it. */
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name=N'TenantIsolationPolicy' AND schema_id=SCHEMA_ID(N'security'))
BEGIN
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON security.UserCredential,
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON security.AuditEvent;
END;
GO
/* Login bootstrap must be the only pre-authentication credential lookup. Restrict API principals to EXECUTE. */
CREATE OR ALTER PROCEDURE security.GetLoginCredential
  @TenantCode nvarchar(50),
  @UserName nvarchar(100)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP (1) t.TenantId, u.UserId, u.DisplayName, u.UserName,
    c.PasswordSaltHex, c.PasswordHashHex
  FROM core.Tenant AS t
  INNER JOIN core.AppUser AS u ON u.TenantId=t.TenantId
  INNER JOIN security.UserCredential AS c ON c.TenantId=u.TenantId AND c.UserId=u.UserId
  WHERE t.TenantCode=@TenantCode AND u.UserName=@UserName
    AND t.IsActive=1 AND u.IsActive=1 AND c.IsEnabled=1
    AND (c.LockedUntilUtc IS NULL OR c.LockedUntilUtc<=SYSUTCDATETIME());
END;
GO
