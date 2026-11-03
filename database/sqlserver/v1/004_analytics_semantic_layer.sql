/* Analytics semantic layer: facts are views over canonical records; no duplicate persisted KPI/sales tables. */
SET XACT_ABORT ON;
GO
CREATE TABLE analytics.KpiDefinition (
 KpiCode varchar(100) NOT NULL, KpiVersion int NOT NULL, NameFa nvarchar(200) NOT NULL, DefinitionFa nvarchar(1000) NOT NULL,
 FormulaSqlDescription nvarchar(1500) NOT NULL, GrainCode varchar(80) NOT NULL, SourceObjects nvarchar(1000) NOT NULL,
 OwnerRoleCode varchar(80) NOT NULL, RefreshExpectation varchar(40) NOT NULL, IsEnabled bit NOT NULL CONSTRAINT DF_Kpi_Enabled DEFAULT 1,
 RequiresCostData bit NOT NULL CONSTRAINT DF_Kpi_Cost DEFAULT 0, EffectiveFrom date NOT NULL, EffectiveTo date NULL, TestCaseJson nvarchar(max) NOT NULL,
 CONSTRAINT PK_KpiDefinition PRIMARY KEY(KpiCode,KpiVersion), CONSTRAINT CK_KpiDefinition_Dates CHECK(EffectiveTo IS NULL OR EffectiveTo>=EffectiveFrom), CONSTRAINT CK_KpiDefinition_Test CHECK(ISJSON(TestCaseJson)=1)
);
CREATE TABLE analytics.DataQualityRun (
 DataQualityRunId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, RuleCode varchar(100) NOT NULL, EntityType nvarchar(80) NOT NULL,
 StartedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_DataQuality_Started DEFAULT SYSUTCDATETIME(), FinishedAtUtc datetime2(3) NULL,
 EvaluatedCount bigint NOT NULL CONSTRAINT DF_DataQuality_Evaluated DEFAULT 0, FailedCount bigint NOT NULL CONSTRAINT DF_DataQuality_Failed DEFAULT 0,
 StatusCode varchar(20) NOT NULL, SampleJson nvarchar(max) NULL,
 CONSTRAINT PK_DataQualityRun PRIMARY KEY(DataQualityRunId), CONSTRAINT FK_DataQuality_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT CK_DataQuality_Status CHECK(StatusCode IN ('RUNNING','PASSED','FAILED','PARTIAL')),
 CONSTRAINT CK_DataQuality_Sample CHECK(SampleJson IS NULL OR ISJSON(SampleJson)=1)
);
GO
CREATE OR ALTER VIEW analytics.vw_FactSalesLine AS
SELECT il.TenantId, i.InvoiceDate AS DateKey, i.InvoiceMirrorId, il.InvoiceLineMirrorId, i.AccountId, i.SalesRepUserId, i.BranchId, i.TerritoryId,
       il.ExternalProductId, il.Quantity, il.NetLineAmount AS RealizedNetSalesAmount, il.DiscountAmount, il.TaxAmount, il.CostAmount,
       CASE WHEN i.IsVoided=0 AND i.StatusCode IN ('POSTED','CONFIRMED','CLOSED') THEN 1 ELSE 0 END AS IsRealized,
       CASE WHEN il.CostAmount IS NOT NULL THEN 1 ELSE 0 END AS HasCostData, i.CurrencyCode, i.SyncedAtUtc
FROM crm.InvoiceLineMirror il JOIN crm.InvoiceMirror i ON i.InvoiceMirrorId=il.InvoiceMirrorId AND i.TenantId=il.TenantId;
GO
CREATE OR ALTER VIEW analytics.vw_SalesKpiDaily AS
SELECT TenantId, DateKey, SalesRepUserId, BranchId, TerritoryId, CurrencyCode,
       SUM(CASE WHEN IsRealized=1 THEN RealizedNetSalesAmount ELSE 0 END) AS RealizedNetSales,
       SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN CostAmount ELSE 0 END) AS CostOfGoodsSoldKnown,
       SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN RealizedNetSalesAmount-CostAmount ELSE 0 END) AS GrossProfitKnown,
       SUM(CASE WHEN IsRealized=1 THEN 1 ELSE 0 END) AS RealizedLineCount,
       SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN 1 ELSE 0 END) AS LinesWithCostCount,
       MAX(SyncedAtUtc) AS LastSourceSyncAtUtc
FROM analytics.vw_FactSalesLine GROUP BY TenantId,DateKey,SalesRepUserId,BranchId,TerritoryId,CurrencyCode;
GO
/* Revenue/profit is not inferred from quote/opportunity values. Unknown costs stay unknown. */
CREATE OR ALTER VIEW analytics.vw_SalesProfitCoverage AS
SELECT TenantId, DateKey, SalesRepUserId, BranchId, TerritoryId, CurrencyCode,
       SUM(CASE WHEN IsRealized=1 THEN RealizedNetSalesAmount ELSE 0 END) AS RealizedNetSales,
       SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN RealizedNetSalesAmount ELSE 0 END) AS SalesWithKnownCost,
       SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN RealizedNetSalesAmount-CostAmount ELSE 0 END) AS GrossProfitOnKnownCostOnly,
       CAST(100.0*SUM(CASE WHEN IsRealized=1 AND HasCostData=1 THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN IsRealized=1 THEN 1 ELSE 0 END),0) AS decimal(6,2)) AS CostCoveragePct,
       MAX(SyncedAtUtc) AS LastSourceSyncAtUtc
FROM analytics.vw_FactSalesLine GROUP BY TenantId,DateKey,SalesRepUserId,BranchId,TerritoryId,CurrencyCode;
GO
