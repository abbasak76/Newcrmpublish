/* Persistent credential failure counters and successful-login reset. Apply after 013. */
SET XACT_ABORT ON;
GO
CREATE OR ALTER PROCEDURE security.RecordLoginFailure
  @TenantCode nvarchar(50),
  @UserName nvarchar(100)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE c
    SET FailedAttempts = CASE WHEN c.FailedAttempts >= 4 THEN 5 ELSE c.FailedAttempts + 1 END,
        LockedUntilUtc = CASE WHEN c.FailedAttempts >= 4 THEN DATEADD(minute, 15, SYSUTCDATETIME()) ELSE c.LockedUntilUtc END
  FROM security.UserCredential AS c
  INNER JOIN core.Tenant AS t ON t.TenantId=c.TenantId
  INNER JOIN core.AppUser AS u ON u.TenantId=c.TenantId AND u.UserId=c.UserId
  WHERE t.TenantCode=@TenantCode AND u.UserName=@UserName
    AND t.IsActive=1 AND u.IsActive=1 AND c.IsEnabled=1
    AND (c.LockedUntilUtc IS NULL OR c.LockedUntilUtc<=SYSUTCDATETIME());
END;
GO
CREATE OR ALTER PROCEDURE security.RecordLoginSuccess
  @TenantCode nvarchar(50),
  @UserName nvarchar(100)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE c
    SET FailedAttempts=0, LockedUntilUtc=NULL
  FROM security.UserCredential AS c
  INNER JOIN core.Tenant AS t ON t.TenantId=c.TenantId
  INNER JOIN core.AppUser AS u ON u.TenantId=c.TenantId AND u.UserId=c.UserId
  WHERE t.TenantCode=@TenantCode AND u.UserName=@UserName
    AND t.IsActive=1 AND u.IsActive=1 AND c.IsEnabled=1;
END;
GO
