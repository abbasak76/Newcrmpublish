/* Integration control plane, source mirror and external identity map. Never store secrets in these tables. */
SET XACT_ABORT ON;
GO
CREATE TABLE integration.Connector (
 ConnectorId uniqueidentifier NOT NULL CONSTRAINT DF_Connector_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, ConnectorCode nvarchar(80) NOT NULL, DisplayName nvarchar(200) NOT NULL,
 SystemCode varchar(40) NOT NULL, DirectionCode varchar(20) NOT NULL, BaseUrl nvarchar(500) NULL, ContractVersion varchar(30) NOT NULL, AuthProfileKey nvarchar(160) NULL,
 StatusCode varchar(30) NOT NULL CONSTRAINT DF_Connector_Status DEFAULT 'NOT_CONFIGURED', IsEnabled bit NOT NULL CONSTRAINT DF_Connector_Enabled DEFAULT 0,
 TimeoutMs int NOT NULL CONSTRAINT DF_Connector_Timeout DEFAULT 10000, MaxRetries tinyint NOT NULL CONSTRAINT DF_Connector_Retries DEFAULT 3, RateLimitPerMinute int NULL,
 LastAttemptAtUtc datetime2(3) NULL, LastSuccessAtUtc datetime2(3) NULL, LastFailureAtUtc datetime2(3) NULL, LastErrorCode nvarchar(100) NULL, LastErrorMessage nvarchar(1000) NULL,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Connector_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Connector_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Connector PRIMARY KEY(ConnectorId), CONSTRAINT FK_Connector_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_Connector_Code UNIQUE(TenantId,ConnectorCode),
 CONSTRAINT CK_Connector_Direction CHECK(DirectionCode IN ('INBOUND','OUTBOUND','BIDIRECTIONAL')), CONSTRAINT CK_Connector_Status CHECK(StatusCode IN ('NOT_CONFIGURED','DISABLED','READY','CONNECTED','DEGRADED','FAILED','RATE_LIMITED')),
 CONSTRAINT CK_Connector_Timeout CHECK(TimeoutMs BETWEEN 100 AND 120000), CONSTRAINT CK_Connector_Retries CHECK(MaxRetries<=10), CONSTRAINT CK_Connector_Rate CHECK(RateLimitPerMinute IS NULL OR RateLimitPerMinute>0)
);
CREATE TABLE integration.ConnectorRun (
 ConnectorRunId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, ConnectorId uniqueidentifier NOT NULL, CorrelationId uniqueidentifier NOT NULL,
 OperationCode varchar(80) NOT NULL, ContractVersion varchar(30) NOT NULL, StartedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ConnectorRun_Started DEFAULT SYSUTCDATETIME(), FinishedAtUtc datetime2(3) NULL,
 OutcomeCode varchar(30) NOT NULL, HttpStatusCode smallint NULL, AttemptCount tinyint NOT NULL CONSTRAINT DF_ConnectorRun_Attempts DEFAULT 1, IsRetryable bit NOT NULL CONSTRAINT DF_ConnectorRun_Retryable DEFAULT 0,
 ErrorCode nvarchar(100) NULL, ErrorMessage nvarchar(1500) NULL, RequestHash varbinary(32) NULL, ResponseHash varbinary(32) NULL, RecordsRead int NOT NULL CONSTRAINT DF_ConnectorRun_Read DEFAULT 0, RecordsWritten int NOT NULL CONSTRAINT DF_ConnectorRun_Written DEFAULT 0,
 CONSTRAINT PK_ConnectorRun PRIMARY KEY(ConnectorRunId), CONSTRAINT FK_ConnectorRun_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_ConnectorRun_Connector FOREIGN KEY(ConnectorId) REFERENCES integration.Connector(ConnectorId), CONSTRAINT CK_ConnectorRun_Outcome CHECK(OutcomeCode IN ('RUNNING','SUCCEEDED','PARTIAL','FAILED','TIMED_OUT','RATE_LIMITED','CANCELLED'))
);
CREATE INDEX IX_ConnectorRun_Latest ON integration.ConnectorRun(TenantId,ConnectorId,StartedAtUtc DESC);
CREATE TABLE integration.ExternalIdentityMap (
 ExternalIdentityMapId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, SourceSystemCode varchar(40) NOT NULL, EntityType nvarchar(80) NOT NULL,
 LocalEntityId uniqueidentifier NOT NULL, ExternalRecordId nvarchar(200) NOT NULL, ExternalParentId nvarchar(200) NULL, ExternalVersion nvarchar(100) NULL,
 SourceModifiedAtUtc datetime2(3) NULL, LastSeenAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ExternalMap_Seen DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_ExternalIdentityMap PRIMARY KEY(ExternalIdentityMapId), CONSTRAINT FK_ExternalMap_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT UQ_ExternalMap_External UNIQUE(TenantId,SourceSystemCode,EntityType,ExternalRecordId), CONSTRAINT UQ_ExternalMap_Local UNIQUE(TenantId,SourceSystemCode,EntityType,LocalEntityId)
);
CREATE TABLE integration.FieldOwnership (
 TenantId uniqueidentifier NOT NULL, EntityType nvarchar(80) NOT NULL, FieldName nvarchar(120) NOT NULL, OwnerSystemCode varchar(40) NOT NULL,
 WritePolicy varchar(20) NOT NULL, ConflictPolicy varchar(30) NOT NULL, IsRequired bit NOT NULL CONSTRAINT DF_FieldOwnership_Required DEFAULT 0, Notes nvarchar(500) NULL,
 CONSTRAINT PK_FieldOwnership PRIMARY KEY(TenantId,EntityType,FieldName), CONSTRAINT FK_FieldOwnership_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT CK_FieldOwnership_Write CHECK(WritePolicy IN ('SOURCE_ONLY','CRM_ONLY','MERGE','READ_ONLY')), CONSTRAINT CK_FieldOwnership_Conflict CHECK(ConflictPolicy IN ('SOURCE_WINS','CRM_WINS','LATEST_TIMESTAMP','MANUAL_REVIEW','REJECT'))
);
CREATE TABLE integration.InboundEnvelope (
 InboundEnvelopeId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, ConnectorId uniqueidentifier NOT NULL, SourceSystemCode varchar(40) NOT NULL,
 ExternalEventId nvarchar(200) NULL, EventType nvarchar(120) NOT NULL, ContractVersion varchar(30) NOT NULL, ReceivedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Inbound_Received DEFAULT SYSUTCDATETIME(),
 PayloadJson nvarchar(max) NOT NULL, PayloadHash varbinary(32) NULL, ProcessingStatus varchar(20) NOT NULL CONSTRAINT DF_Inbound_Status DEFAULT 'RECEIVED', ProcessedAtUtc datetime2(3) NULL, ErrorCode nvarchar(100) NULL, ErrorMessage nvarchar(1500) NULL,
 CONSTRAINT PK_InboundEnvelope PRIMARY KEY(InboundEnvelopeId), CONSTRAINT FK_Inbound_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Inbound_Connector FOREIGN KEY(ConnectorId) REFERENCES integration.Connector(ConnectorId),
 CONSTRAINT CK_Inbound_Json CHECK(ISJSON(PayloadJson)=1), CONSTRAINT CK_Inbound_Status CHECK(ProcessingStatus IN ('RECEIVED','VALIDATED','PROCESSED','RETRY','DEAD_LETTER','REJECTED'))
);
CREATE UNIQUE INDEX UX_Inbound_Idempotency ON integration.InboundEnvelope(TenantId,ConnectorId,ExternalEventId) WHERE ExternalEventId IS NOT NULL;
CREATE TABLE integration.RawRecord (
 RawRecordId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, SourceSystemCode varchar(40) NOT NULL, EntityType nvarchar(80) NOT NULL, ExternalRecordId nvarchar(200) NOT NULL,
 SourceModifiedAtUtc datetime2(3) NULL, IngestedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_RawRecord_Ingested DEFAULT SYSUTCDATETIME(), PayloadJson nvarchar(max) NOT NULL, PayloadHash varbinary(32) NULL, TransformStatus varchar(20) NOT NULL CONSTRAINT DF_RawRecord_Status DEFAULT 'PENDING', TransformError nvarchar(1500) NULL,
 CONSTRAINT PK_RawRecord PRIMARY KEY(RawRecordId), CONSTRAINT FK_RawRecord_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT CK_RawRecord_Json CHECK(ISJSON(PayloadJson)=1), CONSTRAINT CK_RawRecord_Status CHECK(TransformStatus IN ('PENDING','MAPPED','REJECTED','RETRY'))
);
CREATE INDEX IX_RawRecord_Processing ON integration.RawRecord(TenantId,SourceSystemCode,TransformStatus,IngestedAtUtc);
CREATE TABLE integration.OutboxMessage (
 OutboxMessageId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, EventId uniqueidentifier NOT NULL CONSTRAINT DF_Outbox_Event DEFAULT NEWSEQUENTIALID(), EventType nvarchar(120) NOT NULL,
 ContractVersion varchar(30) NOT NULL, AggregateType nvarchar(80) NOT NULL, AggregateId nvarchar(100) NOT NULL, PayloadJson nvarchar(max) NOT NULL,
 StatusCode varchar(20) NOT NULL CONSTRAINT DF_Outbox_Status DEFAULT 'PENDING', AttemptCount tinyint NOT NULL CONSTRAINT DF_Outbox_Attempts DEFAULT 0, NextAttemptAtUtc datetime2(3) NULL,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Outbox_Created DEFAULT SYSUTCDATETIME(), PublishedAtUtc datetime2(3) NULL, LastError nvarchar(1500) NULL,
 CONSTRAINT PK_OutboxMessage PRIMARY KEY(OutboxMessageId), CONSTRAINT FK_Outbox_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_Outbox_Event UNIQUE(TenantId,EventId), CONSTRAINT CK_Outbox_Json CHECK(ISJSON(PayloadJson)=1), CONSTRAINT CK_Outbox_Status CHECK(StatusCode IN ('PENDING','PUBLISHING','PUBLISHED','RETRY','DEAD_LETTER'))
);
GO
