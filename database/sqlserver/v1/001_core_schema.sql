/* AKHAVAN CRM SQL Server baseline v1.0
   CRM management layer only. ERP remains source-of-truth for posted invoices, stock and products.
   Run in a dedicated database after backup/review. Uses UTC datetime2; monetary amounts are decimal(19,4).
*/
SET XACT_ABORT ON;
GO
IF SCHEMA_ID(N'core') IS NULL EXEC(N'CREATE SCHEMA core');
IF SCHEMA_ID(N'crm') IS NULL EXEC(N'CREATE SCHEMA crm');
IF SCHEMA_ID(N'integration') IS NULL EXEC(N'CREATE SCHEMA integration');
IF SCHEMA_ID(N'analytics') IS NULL EXEC(N'CREATE SCHEMA analytics');
GO
CREATE TABLE core.Tenant (
 TenantId uniqueidentifier NOT NULL CONSTRAINT DF_Tenant_Id DEFAULT NEWSEQUENTIALID(),
 TenantCode nvarchar(50) NOT NULL, DisplayName nvarchar(200) NOT NULL,
 IndustryProfile varchar(40) NOT NULL CONSTRAINT DF_Tenant_Profile DEFAULT 'GENERAL',
 IsActive bit NOT NULL CONSTRAINT DF_Tenant_Active DEFAULT 1,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Tenant_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Tenant PRIMARY KEY (TenantId), CONSTRAINT UQ_Tenant_Code UNIQUE (TenantCode),
 CONSTRAINT CK_Tenant_Profile CHECK (IndustryProfile IN ('GENERAL','FMCG_DISTRIBUTION'))
);
CREATE TABLE core.Branch (
 BranchId uniqueidentifier NOT NULL CONSTRAINT DF_Branch_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 BranchCode nvarchar(50) NOT NULL, Name nvarchar(200) NOT NULL, IsActive bit NOT NULL CONSTRAINT DF_Branch_Active DEFAULT 1,
 CONSTRAINT PK_Branch PRIMARY KEY (BranchId), CONSTRAINT FK_Branch_Tenant FOREIGN KEY (TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT UQ_Branch_Tenant_Code UNIQUE (TenantId,BranchCode)
);
CREATE TABLE core.Territory (
 TerritoryId uniqueidentifier NOT NULL CONSTRAINT DF_Territory_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 BranchId uniqueidentifier NULL, TerritoryCode nvarchar(50) NOT NULL, Name nvarchar(200) NOT NULL, IsActive bit NOT NULL CONSTRAINT DF_Territory_Active DEFAULT 1,
 CONSTRAINT PK_Territory PRIMARY KEY (TerritoryId), CONSTRAINT FK_Territory_Tenant FOREIGN KEY (TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_Territory_Branch FOREIGN KEY (BranchId) REFERENCES core.Branch(BranchId), CONSTRAINT UQ_Territory_Tenant_Code UNIQUE(TenantId,TerritoryCode)
);
CREATE TABLE core.Team (
 TeamId uniqueidentifier NOT NULL CONSTRAINT DF_Team_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 BranchId uniqueidentifier NULL, TerritoryId uniqueidentifier NULL, TeamCode nvarchar(50) NOT NULL, Name nvarchar(200) NOT NULL,
 CONSTRAINT PK_Team PRIMARY KEY(TeamId), CONSTRAINT FK_Team_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_Team_Branch FOREIGN KEY(BranchId) REFERENCES core.Branch(BranchId), CONSTRAINT FK_Team_Territory FOREIGN KEY(TerritoryId) REFERENCES core.Territory(TerritoryId),
 CONSTRAINT UQ_Team_Tenant_Code UNIQUE(TenantId,TeamCode)
);
CREATE TABLE core.AppUser (
 UserId uniqueidentifier NOT NULL CONSTRAINT DF_AppUser_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 UserName nvarchar(100) NOT NULL, DisplayName nvarchar(200) NOT NULL, Email nvarchar(320) NULL, Phone nvarchar(40) NULL,
 BranchId uniqueidentifier NULL, TerritoryId uniqueidentifier NULL, TeamId uniqueidentifier NULL,
 IsActive bit NOT NULL CONSTRAINT DF_AppUser_Active DEFAULT 1, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_AppUser_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_AppUser PRIMARY KEY(UserId), CONSTRAINT FK_AppUser_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_AppUser_Branch FOREIGN KEY(BranchId) REFERENCES core.Branch(BranchId), CONSTRAINT FK_AppUser_Territory FOREIGN KEY(TerritoryId) REFERENCES core.Territory(TerritoryId),
 CONSTRAINT FK_AppUser_Team FOREIGN KEY(TeamId) REFERENCES core.Team(TeamId), CONSTRAINT UQ_AppUser_Tenant_UserName UNIQUE(TenantId,UserName)
);
CREATE TABLE core.Role (
 RoleId uniqueidentifier NOT NULL CONSTRAINT DF_Role_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 RoleCode nvarchar(80) NOT NULL, Name nvarchar(160) NOT NULL, IsSystem bit NOT NULL CONSTRAINT DF_Role_System DEFAULT 0,
 CONSTRAINT PK_Role PRIMARY KEY(RoleId), CONSTRAINT FK_Role_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_Role_Tenant_Code UNIQUE(TenantId,RoleCode)
);
CREATE TABLE core.Permission (
 PermissionCode nvarchar(120) NOT NULL, Description nvarchar(300) NOT NULL, CONSTRAINT PK_Permission PRIMARY KEY(PermissionCode)
);
CREATE TABLE core.RolePermission (
 TenantId uniqueidentifier NOT NULL, RoleId uniqueidentifier NOT NULL, PermissionCode nvarchar(120) NOT NULL,
 ScopeCode varchar(20) NOT NULL, FieldCode nvarchar(120) NOT NULL CONSTRAINT DF_RolePermission_Field DEFAULT N'', FieldAccess varchar(12) NOT NULL CONSTRAINT DF_RolePermission_Access DEFAULT 'SEE',
 CONSTRAINT PK_RolePermission PRIMARY KEY(TenantId,RoleId,PermissionCode,ScopeCode,FieldCode),
 CONSTRAINT FK_RolePermission_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_RolePermission_Role FOREIGN KEY(RoleId) REFERENCES core.Role(RoleId),
 CONSTRAINT FK_RolePermission_Permission FOREIGN KEY(PermissionCode) REFERENCES core.Permission(PermissionCode),
 CONSTRAINT CK_RolePermission_Scope CHECK(ScopeCode IN ('ORG','BRANCH','TERRITORY','TEAM','OWNER')),
 CONSTRAINT CK_RolePermission_Field CHECK(FieldAccess IN ('SEE','DO','HIDDEN'))
);
CREATE TABLE core.UserRole (
 TenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL, RoleId uniqueidentifier NOT NULL,
 ValidFromUtc datetime2(3) NOT NULL CONSTRAINT DF_UserRole_From DEFAULT SYSUTCDATETIME(), ValidToUtc datetime2(3) NULL,
 CONSTRAINT PK_UserRole PRIMARY KEY(TenantId,UserId,RoleId,ValidFromUtc), CONSTRAINT FK_UserRole_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_UserRole_User FOREIGN KEY(UserId) REFERENCES core.AppUser(UserId), CONSTRAINT FK_UserRole_Role FOREIGN KEY(RoleId) REFERENCES core.Role(RoleId)
);
GO
CREATE TABLE crm.Account (
 AccountId uniqueidentifier NOT NULL CONSTRAINT DF_Account_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 AccountCode nvarchar(80) NULL, Name nvarchar(250) NOT NULL, AccountType varchar(30) NOT NULL CONSTRAINT DF_Account_Type DEFAULT 'CUSTOMER',
 StatusCode varchar(30) NOT NULL CONSTRAINT DF_Account_Status DEFAULT 'ACTIVE', OwnerUserId uniqueidentifier NULL,
 BranchId uniqueidentifier NULL, TerritoryId uniqueidentifier NULL, TeamId uniqueidentifier NULL,
 Phone nvarchar(40) NULL, Email nvarchar(320) NULL, TaxOrNationalCode nvarchar(80) NULL,
 AddressLine nvarchar(500) NULL, City nvarchar(120) NULL, Province nvarchar(120) NULL, PostalCode nvarchar(30) NULL,
 CreditLimit decimal(19,4) NULL, CurrencyCode char(3) NOT NULL CONSTRAINT DF_Account_Currency DEFAULT 'IRR',
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Account_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Account_Updated DEFAULT SYSUTCDATETIME(),
 RowVersion rowversion NOT NULL,
 CONSTRAINT PK_Account PRIMARY KEY(AccountId), CONSTRAINT FK_Account_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId),
 CONSTRAINT FK_Account_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT FK_Account_Branch FOREIGN KEY(BranchId) REFERENCES core.Branch(BranchId),
 CONSTRAINT FK_Account_Territory FOREIGN KEY(TerritoryId) REFERENCES core.Territory(TerritoryId), CONSTRAINT FK_Account_Team FOREIGN KEY(TeamId) REFERENCES core.Team(TeamId),
 CONSTRAINT CK_Account_Type CHECK(AccountType IN ('CUSTOMER','LEAD','SUPPLIER','PARTNER','OTHER'))
);
CREATE UNIQUE INDEX UX_Account_Tenant_Code ON crm.Account(TenantId,AccountCode) WHERE AccountCode IS NOT NULL;
CREATE INDEX IX_Account_Scope ON crm.Account(TenantId,BranchId,TerritoryId,TeamId,OwnerUserId) INCLUDE(Name,StatusCode);
CREATE TABLE crm.Contact (
 ContactId uniqueidentifier NOT NULL CONSTRAINT DF_Contact_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NOT NULL,
 FullName nvarchar(200) NOT NULL, JobTitle nvarchar(120) NULL, Phone nvarchar(40) NULL, Email nvarchar(320) NULL, IsPrimary bit NOT NULL CONSTRAINT DF_Contact_Primary DEFAULT 0,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Contact_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Contact PRIMARY KEY(ContactId), CONSTRAINT FK_Contact_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Contact_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId)
);
CREATE TABLE crm.Lead (
 LeadId uniqueidentifier NOT NULL CONSTRAINT DF_Lead_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NULL,
 CompanyName nvarchar(250) NOT NULL, ContactName nvarchar(200) NULL, Phone nvarchar(40) NULL, StageCode varchar(30) NOT NULL,
 OwnerUserId uniqueidentifier NULL, Notes nvarchar(max) NULL, ConvertedAtUtc datetime2(3) NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Lead_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Lead PRIMARY KEY(LeadId), CONSTRAINT FK_Lead_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Lead_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Lead_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId)
);
CREATE TABLE crm.Opportunity (
 OpportunityId uniqueidentifier NOT NULL CONSTRAINT DF_Opportunity_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NOT NULL,
 Title nvarchar(250) NOT NULL, StageCode varchar(30) NOT NULL, ExpectedAmount decimal(19,4) NULL, CurrencyCode char(3) NOT NULL CONSTRAINT DF_Opportunity_Currency DEFAULT 'IRR',
 ExpectedCloseDate date NULL, ProbabilityPct decimal(5,2) NULL, OwnerUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Opportunity_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Opportunity PRIMARY KEY(OpportunityId), CONSTRAINT FK_Opportunity_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Opportunity_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Opportunity_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT CK_Opportunity_Probability CHECK(ProbabilityPct IS NULL OR ProbabilityPct BETWEEN 0 AND 100)
);
CREATE TABLE crm.Activity (
 ActivityId uniqueidentifier NOT NULL CONSTRAINT DF_Activity_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NULL, ContactId uniqueidentifier NULL,
 ActivityType varchar(30) NOT NULL, Subject nvarchar(250) NOT NULL, Description nvarchar(max) NULL, OutcomeCode varchar(40) NULL,
 StartedAtUtc datetime2(3) NULL, EndedAtUtc datetime2(3) NULL, OwnerUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Activity_Created DEFAULT SYSUTCDATETIME(),
 SourceCode varchar(40) NOT NULL CONSTRAINT DF_Activity_Source DEFAULT 'CRM', ExternalReference nvarchar(200) NULL,
 CONSTRAINT PK_Activity PRIMARY KEY(ActivityId), CONSTRAINT FK_Activity_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Activity_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Activity_Contact FOREIGN KEY(ContactId) REFERENCES crm.Contact(ContactId), CONSTRAINT FK_Activity_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT CK_Activity_Time CHECK(EndedAtUtc IS NULL OR StartedAtUtc IS NULL OR EndedAtUtc>=StartedAtUtc)
);
CREATE INDEX IX_Activity_Account_Time ON crm.Activity(TenantId,AccountId,StartedAtUtc DESC);
CREATE TABLE crm.Task (
 TaskId uniqueidentifier NOT NULL CONSTRAINT DF_Task_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NULL, OpportunityId uniqueidentifier NULL,
 Title nvarchar(250) NOT NULL, Description nvarchar(max) NULL, StatusCode varchar(30) NOT NULL CONSTRAINT DF_Task_Status DEFAULT 'OPEN', PriorityCode varchar(20) NOT NULL CONSTRAINT DF_Task_Priority DEFAULT 'NORMAL',
 CreatedByUserId uniqueidentifier NULL, OwnerUserId uniqueidentifier NULL, DueAtUtc datetime2(3) NULL, CompletedAtUtc datetime2(3) NULL,
 SlaDueAtUtc datetime2(3) NULL, EscalationLevel tinyint NOT NULL CONSTRAINT DF_Task_Escalation DEFAULT 0, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Task_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Task_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Task PRIMARY KEY(TaskId), CONSTRAINT FK_Task_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Task_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Task_Opportunity FOREIGN KEY(OpportunityId) REFERENCES crm.Opportunity(OpportunityId), CONSTRAINT FK_Task_Creator FOREIGN KEY(CreatedByUserId) REFERENCES core.AppUser(UserId), CONSTRAINT FK_Task_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId)
);
CREATE TABLE crm.TaskAssignmentHistory (
 TaskAssignmentHistoryId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, TaskId uniqueidentifier NOT NULL, FromUserId uniqueidentifier NULL, ToUserId uniqueidentifier NULL, ChangedByUserId uniqueidentifier NULL, Reason nvarchar(500) NULL, ChangedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_TaskAssignment_At DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_TaskAssignmentHistory PRIMARY KEY(TaskAssignmentHistoryId), CONSTRAINT FK_TaskAssignment_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_TaskAssignment_Task FOREIGN KEY(TaskId) REFERENCES crm.Task(TaskId)
);
CREATE TABLE crm.Quote (
 QuoteId uniqueidentifier NOT NULL CONSTRAINT DF_Quote_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, QuoteNumber nvarchar(80) NOT NULL, AccountId uniqueidentifier NOT NULL, OpportunityId uniqueidentifier NULL,
 StatusCode varchar(30) NOT NULL CONSTRAINT DF_Quote_Status DEFAULT 'DRAFT', CurrencyCode char(3) NOT NULL CONSTRAINT DF_Quote_Currency DEFAULT 'IRR', ValidUntil date NULL,
 Subtotal decimal(19,4) NOT NULL CONSTRAINT DF_Quote_Subtotal DEFAULT 0, DiscountTotal decimal(19,4) NOT NULL CONSTRAINT DF_Quote_Discount DEFAULT 0, TaxTotal decimal(19,4) NOT NULL CONSTRAINT DF_Quote_Tax DEFAULT 0, TotalAmount decimal(19,4) NOT NULL CONSTRAINT DF_Quote_Total DEFAULT 0,
 OwnerUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Quote_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Quote_Updated DEFAULT SYSUTCDATETIME(),
 ExternalHandoffStatus varchar(30) NOT NULL CONSTRAINT DF_Quote_Handoff DEFAULT 'NOT_SENT',
 CONSTRAINT PK_Quote PRIMARY KEY(QuoteId), CONSTRAINT FK_Quote_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Quote_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Quote_Opportunity FOREIGN KEY(OpportunityId) REFERENCES crm.Opportunity(OpportunityId), CONSTRAINT FK_Quote_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_Quote_Tenant_Number UNIQUE(TenantId,QuoteNumber), CONSTRAINT CK_Quote_Total CHECK(TotalAmount>=0)
);
CREATE TABLE crm.QuoteLine (
 QuoteLineId uniqueidentifier NOT NULL CONSTRAINT DF_QuoteLine_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, QuoteId uniqueidentifier NOT NULL, LineNumber int NOT NULL,
 ExternalProductId nvarchar(120) NULL, ProductNameSnapshot nvarchar(250) NOT NULL, Quantity decimal(19,4) NOT NULL, UnitCode nvarchar(40) NULL, UnitPrice decimal(19,4) NOT NULL,
 DiscountAmount decimal(19,4) NOT NULL CONSTRAINT DF_QuoteLine_Discount DEFAULT 0, TaxAmount decimal(19,4) NOT NULL CONSTRAINT DF_QuoteLine_Tax DEFAULT 0, LineTotal AS (Quantity*UnitPrice-DiscountAmount+TaxAmount) PERSISTED,
 CONSTRAINT PK_QuoteLine PRIMARY KEY(QuoteLineId), CONSTRAINT FK_QuoteLine_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_QuoteLine_Quote FOREIGN KEY(QuoteId) REFERENCES crm.Quote(QuoteId), CONSTRAINT UQ_QuoteLine_Number UNIQUE(QuoteId,LineNumber), CONSTRAINT CK_QuoteLine_Qty CHECK(Quantity>0)
);
CREATE TABLE crm.Note (
 NoteId uniqueidentifier NOT NULL CONSTRAINT DF_Note_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, AccountId uniqueidentifier NULL, EntityType nvarchar(60) NOT NULL, EntityId uniqueidentifier NULL,
 Body nvarchar(max) NOT NULL, AuthorUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Note_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Note PRIMARY KEY(NoteId), CONSTRAINT FK_Note_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Note_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Note_Author FOREIGN KEY(AuthorUserId) REFERENCES core.AppUser(UserId)
);
CREATE TABLE crm.CaseRecord (
 CaseId uniqueidentifier NOT NULL CONSTRAINT DF_Case_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, CaseNumber nvarchar(80) NOT NULL, AccountId uniqueidentifier NOT NULL,
 Subject nvarchar(250) NOT NULL, Description nvarchar(max) NULL, StatusCode varchar(30) NOT NULL, PriorityCode varchar(20) NOT NULL, OwnerUserId uniqueidentifier NULL,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Case_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Case_Updated DEFAULT SYSUTCDATETIME(), ClosedAtUtc datetime2(3) NULL,
 CONSTRAINT PK_CaseRecord PRIMARY KEY(CaseId), CONSTRAINT FK_Case_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Case_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_Case_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_Case_Tenant_Number UNIQUE(TenantId,CaseNumber)
);
CREATE TABLE crm.GroupRecord (
 GroupId uniqueidentifier NOT NULL CONSTRAINT DF_Group_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, GroupCode nvarchar(80) NOT NULL, Name nvarchar(200) NOT NULL, Description nvarchar(500) NULL, CreatedByUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Group_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_GroupRecord PRIMARY KEY(GroupId), CONSTRAINT FK_Group_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_Group_Tenant_Code UNIQUE(TenantId,GroupCode)
);
CREATE TABLE crm.GroupMember (
 TenantId uniqueidentifier NOT NULL, GroupId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL, MemberRole varchar(30) NOT NULL CONSTRAINT DF_GroupMember_Role DEFAULT 'MEMBER', JoinedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_GroupMember_Joined DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_GroupMember PRIMARY KEY(TenantId,GroupId,UserId), CONSTRAINT FK_GroupMember_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_GroupMember_Group FOREIGN KEY(GroupId) REFERENCES crm.GroupRecord(GroupId), CONSTRAINT FK_GroupMember_User FOREIGN KEY(UserId) REFERENCES core.AppUser(UserId)
);
CREATE TABLE crm.GroupMessage (
 MessageId uniqueidentifier NOT NULL CONSTRAINT DF_GroupMessage_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, GroupId uniqueidentifier NOT NULL, SenderUserId uniqueidentifier NOT NULL,
 Body nvarchar(max) NOT NULL, RelatedEntityType nvarchar(60) NULL, RelatedEntityId uniqueidentifier NULL, ReplyToMessageId uniqueidentifier NULL,
 CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_GroupMessage_Created DEFAULT SYSUTCDATETIME(), EditedAtUtc datetime2(3) NULL, DeletedAtUtc datetime2(3) NULL,
 CONSTRAINT PK_GroupMessage PRIMARY KEY(MessageId), CONSTRAINT FK_GroupMessage_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_GroupMessage_Group FOREIGN KEY(GroupId) REFERENCES crm.GroupRecord(GroupId), CONSTRAINT FK_GroupMessage_Sender FOREIGN KEY(SenderUserId) REFERENCES core.AppUser(UserId), CONSTRAINT FK_GroupMessage_Reply FOREIGN KEY(ReplyToMessageId) REFERENCES crm.GroupMessage(MessageId)
);
CREATE TABLE crm.MessageMention (
 MessageMentionId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, MessageId uniqueidentifier NOT NULL, MentionType varchar(20) NOT NULL, MentionedUserId uniqueidentifier NULL, MentionedGroupId uniqueidentifier NULL, MentionedAccountId uniqueidentifier NULL, DisplayText nvarchar(200) NOT NULL,
 CONSTRAINT PK_MessageMention PRIMARY KEY(MessageMentionId), CONSTRAINT FK_MessageMention_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_MessageMention_Message FOREIGN KEY(MessageId) REFERENCES crm.GroupMessage(MessageId)
);
CREATE TABLE crm.Notification (
 NotificationId uniqueidentifier NOT NULL CONSTRAINT DF_Notification_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, RecipientUserId uniqueidentifier NOT NULL, TypeCode varchar(60) NOT NULL, Title nvarchar(250) NOT NULL, Body nvarchar(1000) NULL,
 RelatedEntityType nvarchar(60) NULL, RelatedEntityId uniqueidentifier NULL, ReadAtUtc datetime2(3) NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Notification_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Notification PRIMARY KEY(NotificationId), CONSTRAINT FK_Notification_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Notification_User FOREIGN KEY(RecipientUserId) REFERENCES core.AppUser(UserId)
);
CREATE TABLE crm.Attachment (
 AttachmentId uniqueidentifier NOT NULL CONSTRAINT DF_Attachment_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, EntityType nvarchar(60) NOT NULL, EntityId uniqueidentifier NOT NULL,
 FileName nvarchar(260) NOT NULL, ContentType nvarchar(150) NULL, SizeBytes bigint NOT NULL, StorageKey nvarchar(500) NOT NULL, UploadedByUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Attachment_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Attachment PRIMARY KEY(AttachmentId), CONSTRAINT FK_Attachment_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Attachment_Uploader FOREIGN KEY(UploadedByUserId) REFERENCES core.AppUser(UserId), CONSTRAINT CK_Attachment_Size CHECK(SizeBytes>=0)
);
CREATE TABLE crm.AuditEvent (
 AuditEventId bigint IDENTITY(1,1) NOT NULL, TenantId uniqueidentifier NOT NULL, ActorUserId uniqueidentifier NULL, EntityType nvarchar(80) NOT NULL, EntityId nvarchar(100) NOT NULL, ActionCode varchar(50) NOT NULL,
 OccurredAtUtc datetime2(3) NOT NULL CONSTRAINT DF_AuditEvent_At DEFAULT SYSUTCDATETIME(), CorrelationId uniqueidentifier NULL, SourceCode varchar(40) NOT NULL CONSTRAINT DF_AuditEvent_Source DEFAULT 'CRM', BeforeJson nvarchar(max) NULL, AfterJson nvarchar(max) NULL, OutcomeCode varchar(30) NOT NULL CONSTRAINT DF_AuditEvent_Outcome DEFAULT 'SUCCESS',
 CONSTRAINT PK_AuditEvent PRIMARY KEY(AuditEventId), CONSTRAINT FK_AuditEvent_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_AuditEvent_Actor FOREIGN KEY(ActorUserId) REFERENCES core.AppUser(UserId), CONSTRAINT CK_AuditEvent_BeforeJson CHECK(BeforeJson IS NULL OR ISJSON(BeforeJson)=1), CONSTRAINT CK_AuditEvent_AfterJson CHECK(AfterJson IS NULL OR ISJSON(AfterJson)=1)
);
CREATE INDEX IX_AuditEvent_Entity ON crm.AuditEvent(TenantId,EntityType,EntityId,OccurredAtUtc DESC);
CREATE TABLE crm.InternalRequest (
 RequestId uniqueidentifier NOT NULL CONSTRAINT DF_InternalRequest_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, RequestNumber nvarchar(80) NOT NULL, RequestTypeCode nvarchar(80) NOT NULL, Title nvarchar(250) NOT NULL, Description nvarchar(max) NULL,
 StatusCode varchar(30) NOT NULL, RequesterUserId uniqueidentifier NOT NULL, AssigneeUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_InternalRequest_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_InternalRequest_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_InternalRequest PRIMARY KEY(RequestId), CONSTRAINT FK_InternalRequest_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_InternalRequest_Requester FOREIGN KEY(RequesterUserId) REFERENCES core.AppUser(UserId), CONSTRAINT FK_InternalRequest_Assignee FOREIGN KEY(AssigneeUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_InternalRequest_Number UNIQUE(TenantId,RequestNumber)
);
CREATE TABLE crm.KnowledgeArticle (
 ArticleId uniqueidentifier NOT NULL CONSTRAINT DF_KnowledgeArticle_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, Slug nvarchar(180) NOT NULL, Title nvarchar(250) NOT NULL, CategoryCode nvarchar(80) NOT NULL, Body nvarchar(max) NOT NULL,
 StatusCode varchar(20) NOT NULL CONSTRAINT DF_KnowledgeArticle_Status DEFAULT 'DRAFT', AuthorUserId uniqueidentifier NOT NULL, PublishedAtUtc datetime2(3) NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_KnowledgeArticle_Created DEFAULT SYSUTCDATETIME(), UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_KnowledgeArticle_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_KnowledgeArticle PRIMARY KEY(ArticleId), CONSTRAINT FK_KnowledgeArticle_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_KnowledgeArticle_Author FOREIGN KEY(AuthorUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_KnowledgeArticle_Slug UNIQUE(TenantId,Slug)
);
CREATE TABLE crm.Campaign (
 CampaignId uniqueidentifier NOT NULL CONSTRAINT DF_Campaign_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, CampaignCode nvarchar(80) NOT NULL, Name nvarchar(250) NOT NULL, Description nvarchar(max) NULL, StatusCode varchar(30) NOT NULL,
 TargetSegmentId uniqueidentifier NULL, StartsAtUtc datetime2(3) NULL, EndsAtUtc datetime2(3) NULL, OwnerUserId uniqueidentifier NULL, CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Campaign_Created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Campaign PRIMARY KEY(CampaignId), CONSTRAINT FK_Campaign_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_Campaign_Owner FOREIGN KEY(OwnerUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_Campaign_Code UNIQUE(TenantId,CampaignCode), CONSTRAINT CK_Campaign_Dates CHECK(EndsAtUtc IS NULL OR StartsAtUtc IS NULL OR EndsAtUtc>=StartsAtUtc)
);
CREATE TABLE crm.WorkflowDefinition (
 WorkflowId uniqueidentifier NOT NULL CONSTRAINT DF_Workflow_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, WorkflowCode nvarchar(100) NOT NULL, Name nvarchar(250) NOT NULL, TriggerCode varchar(80) NOT NULL, DefinitionJson nvarchar(max) NOT NULL, IsEnabled bit NOT NULL CONSTRAINT DF_Workflow_Enabled DEFAULT 0, Version int NOT NULL CONSTRAINT DF_Workflow_Version DEFAULT 1, UpdatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Workflow_Updated DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_WorkflowDefinition PRIMARY KEY(WorkflowId), CONSTRAINT FK_Workflow_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_Workflow_Code UNIQUE(TenantId,WorkflowCode), CONSTRAINT CK_Workflow_Json CHECK(ISJSON(DefinitionJson)=1)
);
GO
