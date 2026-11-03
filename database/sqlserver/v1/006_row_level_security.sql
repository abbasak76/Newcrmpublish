/*
  Tenant isolation policy (SQL Server Row-Level Security).
  SECURITY REQUIREMENT: SESSION_CONTEXT must be set by a trusted server-side connection/session initializer.
  Never allow an untrusted browser to choose TenantId or execute arbitrary SQL.
  Test pooled-connection cleanup and fail-closed behavior before production.
*/
SET XACT_ABORT ON;
GO
IF SCHEMA_ID(N'security') IS NULL EXEC(N'CREATE SCHEMA security');
GO
CREATE OR ALTER FUNCTION security.fn_TenantAccessPredicate(@TenantId uniqueidentifier)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_securitypredicate_result
WHERE @TenantId = TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N'TenantId'));
GO
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name=N'TenantIsolationPolicy' AND schema_id=SCHEMA_ID(N'security'))
    DROP SECURITY POLICY security.TenantIsolationPolicy;
GO
CREATE SECURITY POLICY security.TenantIsolationPolicy
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.Tenant,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.Branch,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.Territory,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.Team,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.AppUser,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.Role,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.RolePermission,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON core.UserRole,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Account,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Contact,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Lead,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Opportunity,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Activity,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Task,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.TaskAssignmentHistory,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Quote,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.QuoteLine,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Note,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.CaseRecord,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.GroupRecord,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.GroupMember,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.GroupMessage,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.MessageMention,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Notification,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Attachment,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.AuditEvent,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.InternalRequest,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.KnowledgeArticle,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.Campaign,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.WorkflowDefinition,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.Connector,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.ConnectorRun,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.ExternalIdentityMap,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.FieldOwnership,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.InboundEnvelope,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.RawRecord,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON integration.OutboxMessage,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.ExternalProduct,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.InvoiceMirror,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.InvoiceLineMirror,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.PaymentMirror,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.PaymentAllocationMirror,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON crm.CreditNoteMirror,
ADD FILTER PREDICATE security.fn_TenantAccessPredicate(TenantId) ON analytics.DataQualityRun
WITH (STATE = ON, SCHEMABINDING = ON);
GO
/*
  Session bootstrap belongs to trusted backend only, conceptually:
    EXEC sys.sp_set_session_context @key=N'TenantId', @value=@AuthenticatedTenantId, @read_only=1;
  Do not accept @AuthenticatedTenantId from request JSON without resolving it from authenticated identity.
  Current scripts intentionally fail closed when TenantId is absent. Block predicates are omitted here because
  RLS block predicate behavior for multi-row ETL inserts must be tested with the actual connector service identity.
  Writes must still validate tenant ownership and run under a narrowly scoped service principal.
*/
