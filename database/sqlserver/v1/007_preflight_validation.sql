/*
  Static catalog preflight. Run only AFTER 001..006 in a non-production database first.
  This script verifies catalog wiring; it does not prove tenant isolation, business correctness,
  or that the schema matches the real ERP. SQL Server 2016+ is required for THROW/SESSION_CONTEXT.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.security_policies
  WHERE schema_id = SCHEMA_ID(N'security') AND name = N'TenantIsolationPolicy' AND is_enabled = 1
)
  THROW 51001, 'Preflight failed: TenantIsolationPolicy is missing or disabled.', 1;
GO
IF OBJECT_DEFINITION(OBJECT_ID(N'security.fn_TenantAccessPredicate')) NOT LIKE N'%SESSION_CONTEXT%TenantId%'
  THROW 51002, 'Preflight failed: tenant predicate does not reference SESSION_CONTEXT TenantId.', 1;
GO
/* Fail closed if a table has TenantId but is absent from the enabled RLS policy. */
IF EXISTS (
  SELECT 1
  FROM sys.tables t
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.columns c ON c.object_id = t.object_id AND c.name = N'TenantId'
  JOIN sys.types ty ON ty.user_type_id = c.user_type_id AND ty.name = N'uniqueidentifier'
  WHERE NOT EXISTS (
    SELECT 1 FROM sys.security_predicates sp
    JOIN sys.security_policies p ON p.object_id = sp.object_id
    WHERE p.schema_id = SCHEMA_ID(N'security') AND p.name = N'TenantIsolationPolicy'
      AND p.is_enabled = 1 AND sp.target_object_id = t.object_id
  )
)
  THROW 51003, 'Preflight failed: one or more TenantId tables are not protected by enabled RLS.', 1;
GO
/* Policy must not target a table without TenantId; such a policy would be invalid or misleading. */
IF EXISTS (
  SELECT 1
  FROM sys.security_predicates sp
  JOIN sys.security_policies p ON p.object_id = sp.object_id
  JOIN sys.tables t ON t.object_id = sp.target_object_id
  WHERE p.schema_id = SCHEMA_ID(N'security') AND p.name = N'TenantIsolationPolicy'
    AND p.is_enabled = 1
    AND NOT EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = t.object_id AND c.name = N'TenantId')
)
  THROW 51004, 'Preflight failed: RLS policy targets a table without TenantId.', 1;
GO
IF OBJECT_ID(N'analytics.vw_InvoiceBalance', N'V') IS NULL
 OR OBJECT_ID(N'analytics.vw_AccountReceivable', N'V') IS NULL
 OR OBJECT_ID(N'analytics.vw_FactSalesLine', N'V') IS NULL
 OR OBJECT_ID(N'analytics.vw_SalesKpiDaily', N'V') IS NULL
 OR OBJECT_ID(N'analytics.vw_SalesProfitCoverage', N'V') IS NULL
  THROW 51005, 'Preflight failed: one or more required finance/analytics views are missing.', 1;
GO
PRINT 'PASS: RLS catalog wiring and required semantic views exist.';
PRINT 'NOTICE: this is not a tenant-isolation or business-number integration test.';
GO
/*
  Review output: foreign keys between tenant-scoped tables that do not include TenantId
  in the FK column mapping. Results require DBA review; RLS alone is not a substitute for
  tenant-consistent relational constraints. This query intentionally reports, not mutates.
  It includes column mappings so the DBA can distinguish true tenant-owned relations from
  references to global lookup tables before preparing a composite-FK migration.
*/
SELECT
  QUOTENAME(ps.name) + N'.' + QUOTENAME(pt.name) AS ParentTable,
  fk.name AS ForeignKeyName,
  STUFF((SELECT N', ' + QUOTENAME(pc.name)
         FROM sys.foreign_key_columns fkc2
         JOIN sys.columns pc ON pc.object_id = fkc2.parent_object_id AND pc.column_id = fkc2.parent_column_id
         WHERE fkc2.constraint_object_id = fk.object_id
         ORDER BY fkc2.constraint_column_id
         FOR XML PATH(N''), TYPE).value(N'.', N'nvarchar(max)'), 1, 2, N'') AS ParentColumns,
  QUOTENAME(rs.name) + N'.' + QUOTENAME(rt.name) AS ReferencedTable,
  STUFF((SELECT N', ' + QUOTENAME(rc.name)
         FROM sys.foreign_key_columns fkc3
         JOIN sys.columns rc ON rc.object_id = fkc3.referenced_object_id AND rc.column_id = fkc3.referenced_column_id
         WHERE fkc3.constraint_object_id = fk.object_id
         ORDER BY fkc3.constraint_column_id
         FOR XML PATH(N''), TYPE).value(N'.', N'nvarchar(max)'), 1, 2, N'') AS ReferencedColumns,
  CASE WHEN EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns fkc
    JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
    JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
    WHERE fkc.constraint_object_id = fk.object_id AND pc.name = N'TenantId' AND rc.name = N'TenantId'
  ) THEN N'PASS: TenantId mapped' ELSE N'REVIEW: TenantId not mapped' END AS TenantMappingStatus,
  fk.is_disabled AS IsDisabled,
  fk.is_not_trusted AS IsNotTrusted
FROM sys.foreign_keys fk
JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
WHERE EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = pt.object_id AND c.name = N'TenantId')
  AND EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = rt.object_id AND c.name = N'TenantId')
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns fkc
    JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
    JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
    WHERE fkc.constraint_object_id = fk.object_id AND pc.name = N'TenantId' AND rc.name = N'TenantId'
  )
ORDER BY ParentTable, ForeignKeyName;
GO
