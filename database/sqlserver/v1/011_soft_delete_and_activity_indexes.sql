/*
  AKHAVAN CRM — additive soft-delete support for operationally critical entities.
  This migration intentionally targets the actual SQL Server model (crm.Account,
  crm.Lead, crm.Opportunity, crm.Activity, crm.Task, crm.Note, crm.Quote,
  crm.InvoiceMirror, crm.SalesOrder, crm.DispatchPlan), not the generic PostgreSQL
  table names in the audit example. It does not physically delete records or
  change existing RLS policies. Application queries must explicitly exclude
  DeletedAtUtc IS NOT NULL where applicable before this is treated as enforced.
*/
SET XACT_ABORT ON;
GO
DECLARE @targets TABLE (SchemaName sysname NOT NULL, TableName sysname NOT NULL);
INSERT INTO @targets (SchemaName, TableName) VALUES
 (N'crm',N'Account'), (N'crm',N'Lead'), (N'crm',N'Opportunity'),
 (N'crm',N'Activity'), (N'crm',N'Task'), (N'crm',N'Note'), (N'crm',N'Quote'),
 (N'crm',N'InvoiceMirror'), (N'crm',N'SalesOrder'), (N'crm',N'DispatchPlan');
DECLARE @schema sysname, @table sysname, @qualified nvarchar(300), @sql nvarchar(max);
DECLARE target_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT SchemaName, TableName FROM @targets;
OPEN target_cursor;
FETCH NEXT FROM target_cursor INTO @schema, @table;
WHILE @@FETCH_STATUS = 0
BEGIN
  SET @qualified = QUOTENAME(@schema) + N'.' + QUOTENAME(@table);
  IF OBJECT_ID(@qualified, N'U') IS NOT NULL AND COL_LENGTH(@schema + N'.' + @table, N'DeletedAtUtc') IS NULL
  BEGIN
    SET @sql = N'ALTER TABLE ' + @qualified + N' ADD DeletedAtUtc datetime2(3) NULL;';
    EXEC sys.sp_executesql @sql;
  END;
  IF OBJECT_ID(@qualified, N'U') IS NOT NULL
  BEGIN
    DECLARE @indexName sysname = N'IX_' + @table + N'_Active_Tenant';
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(@qualified) AND name = @indexName)
    BEGIN
      SET @sql = N'CREATE INDEX ' + QUOTENAME(@indexName) + N' ON ' + @qualified + N'(TenantId, DeletedAtUtc) WHERE DeletedAtUtc IS NULL;';
      EXEC sys.sp_executesql @sql;
    END;
  END;
  FETCH NEXT FROM target_cursor INTO @schema, @table;
END;
CLOSE target_cursor;
DEALLOCATE target_cursor;
GO
/* Activity query path already carries StartedAtUtc; add a filtered index for live activity history. */
IF OBJECT_ID(N'crm.Activity', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'crm.Activity') AND name=N'IX_Activity_Active_Account_Time')
  CREATE INDEX IX_Activity_Active_Account_Time ON crm.Activity(TenantId,AccountId,StartedAtUtc DESC) WHERE DeletedAtUtc IS NULL;
GO
