/*
  AKHAVAN CRM — additive sales and dispatch extension.
  This migration adds CRM-owned negotiation/order and dispatch planning records only.
  Posted invoices remain read-only records in crm.InvoiceMirror; this migration does not issue invoices.
  Run after 001..006 in a disposable/test database first. Validate with 007 preflight after this migration.
*/
SET XACT_ABORT ON;
GO

/* Composite keys allow tenant-consistent FKs instead of relying on RLS alone. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.Account') AND name=N'UX_Account_Tenant_AccountId')
  CREATE UNIQUE INDEX UX_Account_Tenant_AccountId ON crm.Account(TenantId,AccountId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'core.AppUser') AND name=N'UX_AppUser_Tenant_UserId')
  CREATE UNIQUE INDEX UX_AppUser_Tenant_UserId ON core.AppUser(TenantId,UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.Quote') AND name=N'UX_Quote_Tenant_QuoteId')
  CREATE UNIQUE INDEX UX_Quote_Tenant_QuoteId ON crm.Quote(TenantId,QuoteId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.InvoiceMirror') AND name=N'UX_InvoiceMirror_Tenant_Id')
  CREATE UNIQUE INDEX UX_InvoiceMirror_Tenant_Id ON crm.InvoiceMirror(TenantId,InvoiceMirrorId);
GO

IF OBJECT_ID(N'crm.SalesOrder', N'U') IS NULL
BEGIN
  CREATE TABLE crm.SalesOrder (
    SalesOrderId uniqueidentifier NOT NULL CONSTRAINT DF_SalesOrder_Id DEFAULT NEWSEQUENTIALID(),
    TenantId uniqueidentifier NOT NULL,
    AccountId uniqueidentifier NOT NULL,
    OwnerUserId uniqueidentifier NULL,
    SupervisorUserId uniqueidentifier NULL,
    OrderNumber nvarchar(80) NOT NULL,
    StatusCode varchar(30) NOT NULL CONSTRAINT DF_SalesOrder_Status DEFAULT 'DRAFT',
    NegotiationStatusCode varchar(30) NOT NULL CONSTRAINT DF_SalesOrder_NegotiationStatus DEFAULT 'NOT_STARTED',
    CurrencyCode char(3) NOT NULL CONSTRAINT DF_SalesOrder_Currency DEFAULT 'IRR',
    OrderDate date NOT NULL CONSTRAINT DF_SalesOrder_Date DEFAULT CONVERT(date,SYSUTCDATETIME()),
    Subtotal decimal(19,4) NOT NULL CONSTRAINT DF_SalesOrder_Subtotal DEFAULT 0,
    DiscountTotal decimal(19,4) NOT NULL CONSTRAINT DF_SalesOrder_Discount DEFAULT 0,
    NetAmount decimal(19,4) NOT NULL CONSTRAINT DF_SalesOrder_Net DEFAULT 0,
    EstimatedProfit decimal(19,4) NULL,
    ProfitCompletenessCode varchar(20) NOT NULL CONSTRAINT DF_SalesOrder_ProfitCompleteness DEFAULT 'UNKNOWN',
    CreditCheckStatusCode varchar(30) NOT NULL CONSTRAINT DF_SalesOrder_Credit DEFAULT 'NOT_CHECKED',
    RiskFlagsJson nvarchar(max) NULL,
    SourceSystemCode varchar(40) NULL,
    ExternalOrderId nvarchar(200) NULL,
    SyncStatusCode varchar(30) NOT NULL CONSTRAINT DF_SalesOrder_Sync DEFAULT 'NOT_SENT',
    SourceModifiedAtUtc datetime2(3) NULL,
    CreatedByUserId uniqueidentifier NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_SalesOrder_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_SalesOrder_Updated DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT PK_SalesOrder PRIMARY KEY(SalesOrderId),
    CONSTRAINT UQ_SalesOrder_Tenant_Id UNIQUE(TenantId,SalesOrderId),
    CONSTRAINT FK_SalesOrder_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_SalesOrder_AccountTenant FOREIGN KEY(TenantId,AccountId) REFERENCES crm.Account(TenantId,AccountId),
    CONSTRAINT FK_SalesOrder_OwnerTenant FOREIGN KEY(TenantId,OwnerUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT FK_SalesOrder_SupervisorTenant FOREIGN KEY(TenantId,SupervisorUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT FK_SalesOrder_CreatorTenant FOREIGN KEY(TenantId,CreatedByUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT UQ_SalesOrder_Tenant_Number UNIQUE(TenantId,OrderNumber),
    CONSTRAINT CK_SalesOrder_Status CHECK(StatusCode IN ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','SENT_TO_ERP','CONFIRMED','FAILED','CANCELLED')),
    CONSTRAINT CK_SalesOrder_Negotiation CHECK(NegotiationStatusCode IN ('NOT_STARTED','SUGGESTED','IN_PROGRESS','ACCEPTED','REJECTED')),
    CONSTRAINT CK_SalesOrder_ProfitCompleteness CHECK(ProfitCompletenessCode IN ('KNOWN','PARTIAL','UNKNOWN')),
    CONSTRAINT CK_SalesOrder_Amounts CHECK(Subtotal>=0 AND DiscountTotal>=0 AND NetAmount>=0),
    CONSTRAINT CK_SalesOrder_RiskJson CHECK(RiskFlagsJson IS NULL OR ISJSON(RiskFlagsJson)=1)
  );
END;
GO

IF OBJECT_ID(N'crm.SalesOrderLine', N'U') IS NULL
BEGIN
  CREATE TABLE crm.SalesOrderLine (
    SalesOrderLineId uniqueidentifier NOT NULL CONSTRAINT DF_SalesOrderLine_Id DEFAULT NEWSEQUENTIALID(),
    TenantId uniqueidentifier NOT NULL,
    SalesOrderId uniqueidentifier NOT NULL,
    LineNumber int NOT NULL,
    ExternalProductId nvarchar(200) NOT NULL,
    ProductNameSnapshot nvarchar(250) NOT NULL,
    Quantity decimal(19,6) NOT NULL,
    UnitCode nvarchar(40) NULL,
    UnitPrice decimal(19,4) NOT NULL,
    DiscountAmount decimal(19,4) NOT NULL CONSTRAINT DF_SalesOrderLine_Discount DEFAULT 0,
    NetLineAmount decimal(19,4) NOT NULL,
    CostAmount decimal(19,4) NULL,
    MarginAmount AS (CASE WHEN CostAmount IS NULL THEN NULL ELSE NetLineAmount-CostAmount END) PERSISTED,
    RuleViolationsJson nvarchar(max) NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_SalesOrderLine_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_SalesOrderLine PRIMARY KEY(SalesOrderLineId),
    CONSTRAINT FK_SalesOrderLine_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_SalesOrderLine_OrderTenant FOREIGN KEY(TenantId,SalesOrderId) REFERENCES crm.SalesOrder(TenantId,SalesOrderId),
    CONSTRAINT UQ_SalesOrderLine_Number UNIQUE(SalesOrderId,LineNumber),
    CONSTRAINT CK_SalesOrderLine_Quantity CHECK(Quantity>0),
    CONSTRAINT CK_SalesOrderLine_Amounts CHECK(UnitPrice>=0 AND DiscountAmount>=0 AND NetLineAmount>=0 AND (CostAmount IS NULL OR CostAmount>=0)),
    CONSTRAINT CK_SalesOrderLine_RulesJson CHECK(RuleViolationsJson IS NULL OR ISJSON(RuleViolationsJson)=1)
  );
END;
GO

IF OBJECT_ID(N'crm.NegotiationScenario', N'U') IS NULL
BEGIN
  CREATE TABLE crm.NegotiationScenario (
    NegotiationScenarioId uniqueidentifier NOT NULL CONSTRAINT DF_NegotiationScenario_Id DEFAULT NEWSEQUENTIALID(),
    TenantId uniqueidentifier NOT NULL,
    SalesOrderId uniqueidentifier NULL,
    QuoteId uniqueidentifier NULL,
    ScenarioTypeCode varchar(20) NOT NULL,
    ProposedAmount decimal(19,4) NOT NULL,
    ProposedProfit decimal(19,4) NULL,
    ProfitCompletenessCode varchar(20) NOT NULL CONSTRAINT DF_NegotiationScenario_Profit DEFAULT 'UNKNOWN',
    ItemsJson nvarchar(max) NOT NULL,
    DiscountRulesAppliedJson nvarchar(max) NULL,
    CreditImpactJson nvarchar(max) NULL,
    Reason nvarchar(1500) NOT NULL,
    StatusCode varchar(20) NOT NULL CONSTRAINT DF_NegotiationScenario_Status DEFAULT 'SUGGESTED',
    CreatedByUserId uniqueidentifier NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_NegotiationScenario_Created DEFAULT SYSUTCDATETIME(),
    DecidedByUserId uniqueidentifier NULL,
    DecidedAtUtc datetime2(3) NULL,
    CONSTRAINT PK_NegotiationScenario PRIMARY KEY(NegotiationScenarioId),
    CONSTRAINT FK_NegotiationScenario_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_NegotiationScenario_OrderTenant FOREIGN KEY(TenantId,SalesOrderId) REFERENCES crm.SalesOrder(TenantId,SalesOrderId),
    CONSTRAINT FK_NegotiationScenario_QuoteTenant FOREIGN KEY(TenantId,QuoteId) REFERENCES crm.Quote(TenantId,QuoteId),
    CONSTRAINT FK_NegotiationScenario_CreatorTenant FOREIGN KEY(TenantId,CreatedByUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT FK_NegotiationScenario_DeciderTenant FOREIGN KEY(TenantId,DecidedByUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT CK_NegotiationScenario_Parent CHECK((SalesOrderId IS NOT NULL AND QuoteId IS NULL) OR (SalesOrderId IS NULL AND QuoteId IS NOT NULL)),
    CONSTRAINT CK_NegotiationScenario_Type CHECK(ScenarioTypeCode IN ('KEEP','INCREASE','ALTERNATIVE')),
    CONSTRAINT CK_NegotiationScenario_Status CHECK(StatusCode IN ('SUGGESTED','ACCEPTED','REJECTED','EXPIRED')),
    CONSTRAINT CK_NegotiationScenario_Profit CHECK(ProfitCompletenessCode IN ('KNOWN','PARTIAL','UNKNOWN')),
    CONSTRAINT CK_NegotiationScenario_ItemsJson CHECK(ISJSON(ItemsJson)=1),
    CONSTRAINT CK_NegotiationScenario_RulesJson CHECK(DiscountRulesAppliedJson IS NULL OR ISJSON(DiscountRulesAppliedJson)=1),
    CONSTRAINT CK_NegotiationScenario_CreditJson CHECK(CreditImpactJson IS NULL OR ISJSON(CreditImpactJson)=1),
    CONSTRAINT CK_NegotiationScenario_Amount CHECK(ProposedAmount>=0)
  );
END;
GO

IF OBJECT_ID(N'crm.DispatchPlan', N'U') IS NULL
BEGIN
  CREATE TABLE crm.DispatchPlan (
    DispatchPlanId uniqueidentifier NOT NULL CONSTRAINT DF_DispatchPlan_Id DEFAULT NEWSEQUENTIALID(),
    TenantId uniqueidentifier NOT NULL,
    PlanNumber nvarchar(80) NOT NULL,
    PlanDate date NOT NULL,
    ShiftCode nvarchar(40) NULL,
    VehicleExternalId nvarchar(200) NOT NULL,
    DriverExternalId nvarchar(200) NOT NULL,
    DispatcherUserId uniqueidentifier NULL,
    ZoneExternalId nvarchar(200) NULL,
    CapacityKg decimal(19,4) NULL,
    PlannedWeightKg decimal(19,4) NULL CONSTRAINT DF_DispatchPlan_Weight DEFAULT 0,
    EstimatedCost decimal(19,4) NULL,
    StatusCode varchar(20) NOT NULL CONSTRAINT DF_DispatchPlan_Status DEFAULT 'DRAFT',
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_DispatchPlan_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_DispatchPlan_Updated DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT PK_DispatchPlan PRIMARY KEY(DispatchPlanId),
    CONSTRAINT UQ_DispatchPlan_Tenant_Id UNIQUE(TenantId,DispatchPlanId),
    CONSTRAINT FK_DispatchPlan_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_DispatchPlan_DispatcherTenant FOREIGN KEY(TenantId,DispatcherUserId) REFERENCES core.AppUser(TenantId,UserId),
    CONSTRAINT UQ_DispatchPlan_Tenant_Number UNIQUE(TenantId,PlanNumber),
    CONSTRAINT CK_DispatchPlan_Status CHECK(StatusCode IN ('DRAFT','READY','LOADING','DISPATCHED','COMPLETED','CANCELLED')),
    CONSTRAINT CK_DispatchPlan_Capacity CHECK((CapacityKg IS NULL OR CapacityKg>=0) AND (PlannedWeightKg IS NULL OR PlannedWeightKg>=0) AND (EstimatedCost IS NULL OR EstimatedCost>=0))
  );
END;
GO

IF OBJECT_ID(N'crm.DispatchPlanLine', N'U') IS NULL
BEGIN
  CREATE TABLE crm.DispatchPlanLine (
    DispatchPlanLineId uniqueidentifier NOT NULL CONSTRAINT DF_DispatchPlanLine_Id DEFAULT NEWSEQUENTIALID(),
    TenantId uniqueidentifier NOT NULL,
    DispatchPlanId uniqueidentifier NOT NULL,
    InvoiceMirrorId uniqueidentifier NOT NULL,
    StopSequence int NOT NULL,
    PlannedWeightKg decimal(19,4) NULL,
    PlannedPackages decimal(19,4) NULL,
    DeliveryStatusCode varchar(30) NOT NULL CONSTRAINT DF_DispatchPlanLine_Status DEFAULT 'PLANNED',
    ExceptionReason nvarchar(1000) NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_DispatchPlanLine_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_DispatchPlanLine PRIMARY KEY(DispatchPlanLineId),
    CONSTRAINT FK_DispatchPlanLine_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
    CONSTRAINT FK_DispatchPlanLine_PlanTenant FOREIGN KEY(TenantId,DispatchPlanId) REFERENCES crm.DispatchPlan(TenantId,DispatchPlanId),
    CONSTRAINT FK_DispatchPlanLine_InvoiceTenant FOREIGN KEY(TenantId,InvoiceMirrorId) REFERENCES crm.InvoiceMirror(TenantId,InvoiceMirrorId),
    CONSTRAINT UQ_DispatchPlanLine_Stop UNIQUE(DispatchPlanId,StopSequence),
    CONSTRAINT UQ_DispatchPlanLine_Invoice UNIQUE(DispatchPlanId,InvoiceMirrorId),
    CONSTRAINT CK_DispatchPlanLine_Stop CHECK(StopSequence>0),
    CONSTRAINT CK_DispatchPlanLine_Amounts CHECK((PlannedWeightKg IS NULL OR PlannedWeightKg>=0) AND (PlannedPackages IS NULL OR PlannedPackages>=0)),
    CONSTRAINT CK_DispatchPlanLine_Status CHECK(DeliveryStatusCode IN ('PLANNED','LOADED','DISPATCHED','DELIVERED','PARTIAL','FAILED','RETURNED'))
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.SalesOrder') AND name=N'IX_SalesOrder_Tenant_Status_Date')
  CREATE INDEX IX_SalesOrder_Tenant_Status_Date ON crm.SalesOrder(TenantId,StatusCode,OrderDate DESC) INCLUDE(AccountId,OwnerUserId,NetAmount,CreditCheckStatusCode);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.SalesOrderLine') AND name=N'IX_SalesOrderLine_Tenant_Order')
  CREATE INDEX IX_SalesOrderLine_Tenant_Order ON crm.SalesOrderLine(TenantId,SalesOrderId,LineNumber);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.NegotiationScenario') AND name=N'IX_NegotiationScenario_Tenant_Order_Status')
  CREATE INDEX IX_NegotiationScenario_Tenant_Order_Status ON crm.NegotiationScenario(TenantId,SalesOrderId,StatusCode,CreatedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.DispatchPlan') AND name=N'IX_DispatchPlan_Tenant_Date_Status')
  CREATE INDEX IX_DispatchPlan_Tenant_Date_Status ON crm.DispatchPlan(TenantId,PlanDate,StatusCode);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.DispatchPlanLine') AND name=N'IX_DispatchPlanLine_Tenant_Invoice')
  CREATE INDEX IX_DispatchPlanLine_Tenant_Invoice ON crm.DispatchPlanLine(TenantId,InvoiceMirrorId);
GO

/* New tenant-scoped tables must be protected by the existing RLS policy as well. */
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE schema_id=SCHEMA_ID(N'security') AND name=N'TenantIsolationPolicy' AND is_enabled=1)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.security_predicates sp JOIN sys.tables t ON t.object_id=sp.target_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE sp.object_id=OBJECT_ID(N'security.TenantIsolationPolicy') AND s.name=N'crm' AND t.name=N'SalesOrder')
    ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.SalesOrder;
  IF NOT EXISTS (SELECT 1 FROM sys.security_predicates sp JOIN sys.tables t ON t.object_id=sp.target_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE sp.object_id=OBJECT_ID(N'security.TenantIsolationPolicy') AND s.name=N'crm' AND t.name=N'SalesOrderLine')
    ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.SalesOrderLine;
  IF NOT EXISTS (SELECT 1 FROM sys.security_predicates sp JOIN sys.tables t ON t.object_id=sp.target_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE sp.object_id=OBJECT_ID(N'security.TenantIsolationPolicy') AND s.name=N'crm' AND t.name=N'NegotiationScenario')
    ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.NegotiationScenario;
  IF NOT EXISTS (SELECT 1 FROM sys.security_predicates sp JOIN sys.tables t ON t.object_id=sp.target_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE sp.object_id=OBJECT_ID(N'security.TenantIsolationPolicy') AND s.name=N'crm' AND t.name=N'DispatchPlan')
    ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.DispatchPlan;
  IF NOT EXISTS (SELECT 1 FROM sys.security_predicates sp JOIN sys.tables t ON t.object_id=sp.target_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE sp.object_id=OBJECT_ID(N'security.TenantIsolationPolicy') AND s.name=N'crm' AND t.name=N'DispatchPlanLine')
    ALTER SECURITY POLICY security.TenantIsolationPolicy ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.DispatchPlanLine;
END;
GO
PRINT '008_sales_dispatch_extension.sql created/verified SalesOrder, negotiation, and dispatch schema. SQL runtime execution remains to be validated in the target SQL Server.';
GO

/* Phase 2: source-scoped ERP order idempotency. Visible OrderNumber is not a cross-system identity. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.SalesOrder') AND name=N'UX_SalesOrder_ExternalIdentity')
  CREATE UNIQUE INDEX UX_SalesOrder_ExternalIdentity
    ON crm.SalesOrder(TenantId,SourceSystemCode,ExternalOrderId)
    WHERE SourceSystemCode IS NOT NULL AND ExternalOrderId IS NOT NULL;
GO
