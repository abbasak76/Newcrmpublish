/*
  AKHAVAN CRM — tenant RLS coverage for additive sales/dispatch tables.
  This migration must run after 008_sales_dispatch_extension.sql because those tables do not exist in 006.
  Static contract only; validate this migration against a disposable SQL Server before production.
*/
SET XACT_ABORT ON;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_predicates sp
  INNER JOIN sys.security_policies p ON p.object_id = sp.object_id
  WHERE p.name = N'TenantIsolationPolicy'
    AND SCHEMA_NAME(p.schema_id) = N'security'
    AND sp.target_object_id = OBJECT_ID(N'crm.SalesOrder')
)
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.SalesOrder;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_predicates sp
  INNER JOIN sys.security_policies p ON p.object_id = sp.object_id
  WHERE p.name = N'TenantIsolationPolicy'
    AND SCHEMA_NAME(p.schema_id) = N'security'
    AND sp.target_object_id = OBJECT_ID(N'crm.SalesOrderLine')
)
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.SalesOrderLine;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_predicates sp
  INNER JOIN sys.security_policies p ON p.object_id = sp.object_id
  WHERE p.name = N'TenantIsolationPolicy'
    AND SCHEMA_NAME(p.schema_id) = N'security'
    AND sp.target_object_id = OBJECT_ID(N'crm.NegotiationScenario')
)
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.NegotiationScenario;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_predicates sp
  INNER JOIN sys.security_policies p ON p.object_id = sp.object_id
  WHERE p.name = N'TenantIsolationPolicy'
    AND SCHEMA_NAME(p.schema_id) = N'security'
    AND sp.target_object_id = OBJECT_ID(N'crm.DispatchPlan')
)
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.DispatchPlan;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_predicates sp
  INNER JOIN sys.security_policies p ON p.object_id = sp.object_id
  WHERE p.name = N'TenantIsolationPolicy'
    AND SCHEMA_NAME(p.schema_id) = N'security'
    AND sp.target_object_id = OBJECT_ID(N'crm.DispatchPlanLine')
)
  ALTER SECURITY POLICY security.TenantIsolationPolicy
    ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.DispatchPlanLine;
GO
