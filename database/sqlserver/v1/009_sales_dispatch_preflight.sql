/* Run after 008_sales_dispatch_extension.sql. Catalog checks only; not a substitute for data/security integration tests. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO
IF OBJECT_ID(N'crm.SalesOrder',N'U') IS NULL
 OR OBJECT_ID(N'crm.SalesOrderLine',N'U') IS NULL
 OR OBJECT_ID(N'crm.NegotiationScenario',N'U') IS NULL
 OR OBJECT_ID(N'crm.DispatchPlan',N'U') IS NULL
 OR OBJECT_ID(N'crm.DispatchPlanLine',N'U') IS NULL
  THROW 51020, 'Sales/dispatch preflight failed: one or more expected tables are missing.', 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.security_policies WHERE schema_id=SCHEMA_ID(N'security') AND name=N'TenantIsolationPolicy' AND is_enabled=1)
  THROW 51021, 'Sales/dispatch preflight failed: enabled TenantIsolationPolicy is missing.', 1;
GO
IF EXISTS (
  SELECT v.SchemaName, v.TableName
  FROM (VALUES (N'crm',N'SalesOrder'),(N'crm',N'SalesOrderLine'),(N'crm',N'NegotiationScenario'),(N'crm',N'DispatchPlan'),(N'crm',N'DispatchPlanLine')) v(SchemaName,TableName)
  WHERE NOT EXISTS (
    SELECT 1 FROM sys.security_predicates sp
    JOIN sys.security_policies p ON p.object_id=sp.object_id
    JOIN sys.tables t ON t.object_id=sp.target_object_id
    JOIN sys.schemas s ON s.schema_id=t.schema_id
    WHERE p.schema_id=SCHEMA_ID(N'security') AND p.name=N'TenantIsolationPolicy' AND p.is_enabled=1
      AND s.name=v.SchemaName AND t.name=v.TableName AND sp.predicate_type_desc=N'FILTER'
  )
)
  THROW 51022, 'Sales/dispatch preflight failed: one or more new tables lack a filter predicate in tenant RLS.', 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_SalesOrder_AccountTenant' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_SalesOrderLine_OrderTenant' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_NegotiationScenario_QuoteTenant' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_DispatchPlanLine_InvoiceTenant' AND is_disabled=0 AND is_not_trusted=0)
  THROW 51023, 'Sales/dispatch preflight failed: required tenant-consistent foreign keys are missing, disabled, or untrusted.', 1;
GO
PRINT 'PASS: sales/dispatch catalog, RLS predicate presence, and required FK constraints exist.';
PRINT 'NOTICE: execute in target SQL Server; runtime tenant-isolation and workflow tests are still required.';
GO
