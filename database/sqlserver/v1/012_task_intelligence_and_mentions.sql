/* Additive task-intelligence model. Run only after backup and SQL Server preflight. */
SET XACT_ABORT ON;
GO
IF COL_LENGTH(N'core.AppUser', N'ManagerUserId') IS NULL
    ALTER TABLE core.AppUser ADD ManagerUserId uniqueidentifier NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_AppUser_Manager')
    ALTER TABLE core.AppUser ADD CONSTRAINT FK_AppUser_Manager FOREIGN KEY(ManagerUserId) REFERENCES core.AppUser(UserId);
GO
IF COL_LENGTH(N'crm.Task', N'TaskKindCode') IS NULL
    ALTER TABLE crm.Task ADD TaskKindCode varchar(20) NOT NULL CONSTRAINT DF_Task_Kind DEFAULT 'GENERAL';
IF COL_LENGTH(N'crm.Task', N'UrgencyScore') IS NULL
    ALTER TABLE crm.Task ADD UrgencyScore tinyint NULL;
IF COL_LENGTH(N'crm.Task', N'ParentTaskId') IS NULL
    ALTER TABLE crm.Task ADD ParentTaskId uniqueidentifier NULL;
IF COL_LENGTH(N'crm.Task', N'EstimatedMinutes') IS NULL
    ALTER TABLE crm.Task ADD EstimatedMinutes int NULL;
IF COL_LENGTH(N'crm.Task', N'RouteRegionCode') IS NULL
    ALTER TABLE crm.Task ADD RouteRegionCode nvarchar(100) NULL;
IF COL_LENGTH(N'crm.Task', N'IsDeleted') IS NULL
    ALTER TABLE crm.Task ADD IsDeleted bit NOT NULL CONSTRAINT DF_Task_IsDeleted DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_Task_ParentTask')
    ALTER TABLE crm.Task ADD CONSTRAINT FK_Task_ParentTask FOREIGN KEY(ParentTaskId) REFERENCES crm.Task(TaskId);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_Task_UrgencyScore')
    ALTER TABLE crm.Task ADD CONSTRAINT CK_Task_UrgencyScore CHECK(UrgencyScore IS NULL OR UrgencyScore BETWEEN 0 AND 100);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_Task_Kind')
    ALTER TABLE crm.Task ADD CONSTRAINT CK_Task_Kind CHECK(TaskKindCode IN ('FINANCE','LOGISTICS','SALES','GENERAL'));
GO
IF OBJECT_ID(N'crm.TaskWorkloadConfig', N'U') IS NULL
CREATE TABLE crm.TaskWorkloadConfig (
 TaskWorkloadConfigId bigint IDENTITY(1,1) NOT NULL,
 TenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL,
 MaxDailyTasks smallint NOT NULL CONSTRAINT DF_TaskWorkload_Tasks DEFAULT 12,
 MaxDailyScore smallint NOT NULL CONSTRAINT DF_TaskWorkload_Score DEFAULT 100,
 WorkingHoursStart time(0) NOT NULL CONSTRAINT DF_TaskWorkload_Start DEFAULT '08:00',
 WorkingHoursEnd time(0) NOT NULL CONSTRAINT DF_TaskWorkload_End DEFAULT '17:00',
 WorkingDaysMask tinyint NOT NULL CONSTRAINT DF_TaskWorkload_Days DEFAULT 127,
 EffectiveFrom date NOT NULL CONSTRAINT DF_TaskWorkload_From DEFAULT CONVERT(date,SYSUTCDATETIME()),
 EffectiveTo date NULL, UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_TaskWorkload_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_TaskWorkloadConfig PRIMARY KEY(TaskWorkloadConfigId),
 CONSTRAINT FK_TaskWorkload_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_TaskWorkload_User FOREIGN KEY(UserId) REFERENCES core.AppUser(UserId),
 CONSTRAINT CK_TaskWorkload_Limits CHECK(MaxDailyTasks BETWEEN 1 AND 100 AND MaxDailyScore BETWEEN 1 AND 1000),
 CONSTRAINT CK_TaskWorkload_Hours CHECK(WorkingHoursEnd>WorkingHoursStart),
 CONSTRAINT CK_TaskWorkload_Dates CHECK(EffectiveTo IS NULL OR EffectiveTo>=EffectiveFrom)
);
CREATE UNIQUE INDEX UX_TaskWorkload_UserEffective ON crm.TaskWorkloadConfig(TenantId,UserId,EffectiveFrom);
GO
IF OBJECT_ID(N'crm.TaskAccessGrant', N'U') IS NULL
CREATE TABLE crm.TaskAccessGrant (
 TaskAccessGrantId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, TaskId uniqueidentifier NULL,
 ViewerUserId uniqueidentifier NOT NULL, TargetUserId uniqueidentifier NOT NULL,
 AccessLevel varchar(20) NOT NULL, GrantSource varchar(20) NOT NULL CONSTRAINT DF_TaskAccess_Source DEFAULT 'MANUAL',
 GrantedByUserId uniqueidentifier NOT NULL, GrantedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_TaskAccess_At DEFAULT SYSUTCDATETIME(),
 ExpiresAtUtc datetime2(3) NULL, RevokedAtUtc datetime2(3) NULL,
 CONSTRAINT PK_TaskAccessGrant PRIMARY KEY(TaskAccessGrantId),
 CONSTRAINT FK_TaskAccess_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_TaskAccess_Task FOREIGN KEY(TaskId) REFERENCES crm.Task(TaskId),
 CONSTRAINT FK_TaskAccess_Viewer FOREIGN KEY(ViewerUserId) REFERENCES core.AppUser(UserId),
 CONSTRAINT FK_TaskAccess_Target FOREIGN KEY(TargetUserId) REFERENCES core.AppUser(UserId),
 CONSTRAINT FK_TaskAccess_Grantor FOREIGN KEY(GrantedByUserId) REFERENCES core.AppUser(UserId),
 CONSTRAINT CK_TaskAccess_Level CHECK(AccessLevel IN ('METRICS_ONLY','FULL_DETAILS')),
 CONSTRAINT CK_TaskAccess_Source CHECK(GrantSource IN ('MANUAL','ASSIGNMENT','MENTION','MANAGER')),
 CONSTRAINT CK_TaskAccess_Expiry CHECK(ExpiresAtUtc IS NULL OR ExpiresAtUtc>GrantedAtUtc)
);
CREATE INDEX IX_TaskAccess_Viewer ON crm.TaskAccessGrant(TenantId,ViewerUserId,RevokedAtUtc,ExpiresAtUtc) INCLUDE(TargetUserId,AccessLevel,TaskId);
GO
IF OBJECT_ID(N'crm.TaskMention', N'U') IS NULL
CREATE TABLE crm.TaskMention (
 TaskMentionId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, TaskId uniqueidentifier NOT NULL,
 EntityType varchar(30) NOT NULL, EntityId nvarchar(200) NOT NULL, SourceSystemCode varchar(40) NOT NULL,
 DisplayText nvarchar(250) NOT NULL, CreatedByUserId uniqueidentifier NOT NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_TaskMention_At DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_TaskMention PRIMARY KEY(TaskMentionId),
 CONSTRAINT FK_TaskMention_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_TaskMention_Task FOREIGN KEY(TaskId) REFERENCES crm.Task(TaskId),
 CONSTRAINT FK_TaskMention_User FOREIGN KEY(CreatedByUserId) REFERENCES core.AppUser(UserId),
 CONSTRAINT CK_TaskMention_Type CHECK(EntityType IN ('CUSTOMER','STAFF','CHECK','INVOICE','PRODUCT','WAREHOUSE','TASK','QUOTE','DOCUMENT')),
 CONSTRAINT CK_TaskMention_Source CHECK(SourceSystemCode IN ('CRM','ERP','WMS','UNKNOWN'))
);
CREATE INDEX IX_TaskMention_Task ON crm.TaskMention(TenantId,TaskId,EntityType);
CREATE INDEX IX_TaskMention_Entity ON crm.TaskMention(TenantId,SourceSystemCode,EntityType,EntityId);
GO
IF OBJECT_ID(N'integration.ContextCache', N'U') IS NULL
CREATE TABLE integration.ContextCache (
 ContextCacheId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, SourceSystemCode varchar(40) NOT NULL,
 EntityType varchar(40) NOT NULL, EntityId nvarchar(200) NOT NULL, ContextKind varchar(40) NOT NULL,
 PayloadJson nvarchar(max) NOT NULL, FetchedAtUtc datetime2(3) NOT NULL, ExpiresAtUtc datetime2(3) NOT NULL,
 SourceVersion nvarchar(100) NULL, CorrelationId uniqueidentifier NOT NULL,
 CONSTRAINT PK_ContextCache PRIMARY KEY(ContextCacheId),
 CONSTRAINT FK_ContextCache_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT CK_ContextCache_Json CHECK(ISJSON(PayloadJson)=1),
 CONSTRAINT CK_ContextCache_Times CHECK(ExpiresAtUtc>FetchedAtUtc)
);
CREATE UNIQUE INDEX UX_ContextCache_Key ON integration.ContextCache(TenantId,SourceSystemCode,EntityType,EntityId,ContextKind);
CREATE INDEX IX_ContextCache_Expiry ON integration.ContextCache(TenantId,ExpiresAtUtc);
GO
/* Extend existing tenant isolation policy; do not expose these new tables outside SESSION_CONTEXT scope. */
GO
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name=N'TenantIsolationPolicy' AND schema_id=SCHEMA_ID(N'security'))
BEGIN
 IF NOT EXISTS (SELECT 1 FROM sys.security_predicates WHERE target_object_id=OBJECT_ID(N'crm.TaskWorkloadConfig'))
  ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.TaskWorkloadConfig;
 IF NOT EXISTS (SELECT 1 FROM sys.security_predicates WHERE target_object_id=OBJECT_ID(N'crm.TaskAccessGrant'))
  ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.TaskAccessGrant;
 IF NOT EXISTS (SELECT 1 FROM sys.security_predicates WHERE target_object_id=OBJECT_ID(N'crm.TaskMention'))
  ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.TaskMention;
 IF NOT EXISTS (SELECT 1 FROM sys.security_predicates WHERE target_object_id=OBJECT_ID(N'integration.ContextCache'))
  ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.ContextCache;
END;
GO
