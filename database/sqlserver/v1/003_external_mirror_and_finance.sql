/* Canonical read-only mirrors of ERP/accounting facts. These are NOT CRM-created invoices/payments. */
SET XACT_ABORT ON;
GO
CREATE TABLE crm.ExternalProduct (
 ExternalProductKey uniqueidentifier NOT NULL CONSTRAINT DF_ExternalProduct_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 SourceSystemCode varchar(40) NOT NULL, ExternalProductId nvarchar(200) NOT NULL, SKU nvarchar(100) NULL, ProductName nvarchar(250) NOT NULL,
 BaseUnitCode nvarchar(40) NULL, IsActive bit NOT NULL CONSTRAINT DF_ExternalProduct_Active DEFAULT 1, SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ExternalProduct_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_ExternalProduct PRIMARY KEY(ExternalProductKey), CONSTRAINT FK_ExternalProduct_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT UQ_ExternalProduct_Source UNIQUE(TenantId,SourceSystemCode,ExternalProductId)
);
CREATE TABLE crm.InvoiceMirror (
 InvoiceMirrorId uniqueidentifier NOT NULL CONSTRAINT DF_InvoiceMirror_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 SourceSystemCode varchar(40) NOT NULL, ExternalInvoiceId nvarchar(200) NOT NULL, ExternalAccountId nvarchar(200) NOT NULL, AccountId uniqueidentifier NULL,
 InvoiceNumber nvarchar(100) NOT NULL, InvoiceDate date NOT NULL, DueDate date NULL, CurrencyCode char(3) NOT NULL CONSTRAINT DF_InvoiceMirror_Currency DEFAULT 'IRR',
 NetAmount decimal(19,4) NOT NULL, TaxAmount decimal(19,4) NOT NULL CONSTRAINT DF_InvoiceMirror_Tax DEFAULT 0, GrossAmount decimal(19,4) NOT NULL,
 StatusCode varchar(30) NOT NULL, IsVoided bit NOT NULL CONSTRAINT DF_InvoiceMirror_Voided DEFAULT 0, SalesRepExternalId nvarchar(200) NULL, SalesRepUserId uniqueidentifier NULL,
 BranchExternalId nvarchar(200) NULL, BranchId uniqueidentifier NULL, TerritoryId uniqueidentifier NULL, SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_InvoiceMirror_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_InvoiceMirror PRIMARY KEY(InvoiceMirrorId), CONSTRAINT FK_InvoiceMirror_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_InvoiceMirror_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT FK_InvoiceMirror_Rep FOREIGN KEY(SalesRepUserId) REFERENCES core.AppUser(UserId), CONSTRAINT UQ_InvoiceMirror_Source UNIQUE(TenantId,SourceSystemCode,ExternalInvoiceId), CONSTRAINT CK_InvoiceMirror_Gross CHECK(GrossAmount>=0)
);
CREATE INDEX IX_InvoiceMirror_Account_Due ON crm.InvoiceMirror(TenantId,AccountId,DueDate) INCLUDE(GrossAmount,StatusCode,IsVoided);
CREATE TABLE crm.InvoiceLineMirror (
 InvoiceLineMirrorId uniqueidentifier NOT NULL CONSTRAINT DF_InvoiceLineMirror_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 SourceSystemCode varchar(40) NOT NULL, ExternalInvoiceLineId nvarchar(200) NOT NULL, ExternalInvoiceId nvarchar(200) NOT NULL,
 InvoiceMirrorId uniqueidentifier NOT NULL, ExternalProductId nvarchar(200) NULL, ProductNameSnapshot nvarchar(250) NOT NULL,
 Quantity decimal(19,4) NOT NULL, UnitCode nvarchar(40) NULL, NetUnitPrice decimal(19,4) NOT NULL, NetLineAmount decimal(19,4) NOT NULL,
 CostAmount decimal(19,4) NULL, DiscountAmount decimal(19,4) NOT NULL CONSTRAINT DF_InvoiceLineMirror_Discount DEFAULT 0, TaxAmount decimal(19,4) NOT NULL CONSTRAINT DF_InvoiceLineMirror_Tax DEFAULT 0,
 SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_InvoiceLineMirror_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_InvoiceLineMirror PRIMARY KEY(InvoiceLineMirrorId), CONSTRAINT FK_InvoiceLineMirror_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_InvoiceLineMirror_Invoice FOREIGN KEY(InvoiceMirrorId) REFERENCES crm.InvoiceMirror(InvoiceMirrorId), CONSTRAINT UQ_InvoiceLineMirror_Source UNIQUE(TenantId,SourceSystemCode,ExternalInvoiceLineId)
);
CREATE INDEX IX_InvoiceLineMirror_Invoice ON crm.InvoiceLineMirror(TenantId,InvoiceMirrorId);
CREATE TABLE crm.PaymentMirror (
 PaymentMirrorId uniqueidentifier NOT NULL CONSTRAINT DF_PaymentMirror_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 SourceSystemCode varchar(40) NOT NULL, ExternalPaymentId nvarchar(200) NOT NULL, ExternalAccountId nvarchar(200) NULL, AccountId uniqueidentifier NULL,
 PaymentDate date NOT NULL, Amount decimal(19,4) NOT NULL, CurrencyCode char(3) NOT NULL CONSTRAINT DF_PaymentMirror_Currency DEFAULT 'IRR',
 MethodCode varchar(30) NOT NULL, StatusCode varchar(30) NOT NULL, ReferenceNumber nvarchar(150) NULL, IsVoided bit NOT NULL CONSTRAINT DF_PaymentMirror_Voided DEFAULT 0,
 SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_PaymentMirror_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_PaymentMirror PRIMARY KEY(PaymentMirrorId), CONSTRAINT FK_PaymentMirror_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_PaymentMirror_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT UQ_PaymentMirror_Source UNIQUE(TenantId,SourceSystemCode,ExternalPaymentId)
);
CREATE TABLE crm.PaymentAllocationMirror (
 PaymentAllocationMirrorId uniqueidentifier NOT NULL CONSTRAINT DF_AllocationMirror_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL,
 SourceSystemCode varchar(40) NOT NULL, ExternalAllocationId nvarchar(200) NOT NULL, ExternalPaymentId nvarchar(200) NOT NULL, ExternalInvoiceId nvarchar(200) NOT NULL,
 PaymentMirrorId uniqueidentifier NOT NULL, InvoiceMirrorId uniqueidentifier NOT NULL, AllocatedAmount decimal(19,4) NOT NULL, AllocationDate date NOT NULL,
 IsReversed bit NOT NULL CONSTRAINT DF_AllocationMirror_Reversed DEFAULT 0, SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_AllocationMirror_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_PaymentAllocationMirror PRIMARY KEY(PaymentAllocationMirrorId), CONSTRAINT FK_AllocationMirror_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_AllocationMirror_Payment FOREIGN KEY(PaymentMirrorId) REFERENCES crm.PaymentMirror(PaymentMirrorId), CONSTRAINT FK_AllocationMirror_Invoice FOREIGN KEY(InvoiceMirrorId) REFERENCES crm.InvoiceMirror(InvoiceMirrorId), CONSTRAINT UQ_AllocationMirror_Source UNIQUE(TenantId,SourceSystemCode,ExternalAllocationId)
);
CREATE INDEX IX_AllocationMirror_Invoice ON crm.PaymentAllocationMirror(TenantId,InvoiceMirrorId,IsReversed) INCLUDE(AllocatedAmount);
CREATE TABLE crm.CreditNoteMirror (
 CreditNoteMirrorId uniqueidentifier NOT NULL CONSTRAINT DF_CreditNoteMirror_Id DEFAULT NEWSEQUENTIALID(), TenantId uniqueidentifier NOT NULL, SourceSystemCode varchar(40) NOT NULL,
 ExternalCreditNoteId nvarchar(200) NOT NULL, InvoiceMirrorId uniqueidentifier NULL, AccountId uniqueidentifier NULL, CreditDate date NOT NULL, Amount decimal(19,4) NOT NULL,
 StatusCode varchar(30) NOT NULL, IsVoided bit NOT NULL CONSTRAINT DF_CreditNoteMirror_Voided DEFAULT 0, SourceModifiedAtUtc datetime2(3) NULL, SyncedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_CreditNoteMirror_Synced DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_CreditNoteMirror PRIMARY KEY(CreditNoteMirrorId), CONSTRAINT FK_CreditNoteMirror_Tenant FOREIGN KEY(TenantId) REFERENCES core.Tenant(TenantId), CONSTRAINT FK_CreditNoteMirror_Invoice FOREIGN KEY(InvoiceMirrorId) REFERENCES crm.InvoiceMirror(InvoiceMirrorId), CONSTRAINT FK_CreditNoteMirror_Account FOREIGN KEY(AccountId) REFERENCES crm.Account(AccountId), CONSTRAINT UQ_CreditNoteMirror_Source UNIQUE(TenantId,SourceSystemCode,ExternalCreditNoteId)
);
GO
/* Single source for finance summaries. Never persist a second outstanding-balance table. */
CREATE OR ALTER VIEW analytics.vw_InvoiceBalance AS
SELECT i.TenantId, i.InvoiceMirrorId, i.AccountId, i.InvoiceNumber, i.InvoiceDate, i.DueDate, i.CurrencyCode,
       i.GrossAmount AS InvoiceGrossAmount,
       COALESCE(a.AllocatedAmount,0) AS ValidAllocatedAmount,
       COALESCE(c.CreditAmount,0) AS ValidCreditAmount,
       i.GrossAmount - COALESCE(a.AllocatedAmount,0) - COALESCE(c.CreditAmount,0) AS OutstandingAmount,
       CASE WHEN i.DueDate < CONVERT(date,SYSUTCDATETIME()) AND i.GrossAmount - COALESCE(a.AllocatedAmount,0) - COALESCE(c.CreditAmount,0) > 0 THEN 1 ELSE 0 END AS IsOverdue,
       i.SalesRepUserId, i.BranchId, i.TerritoryId, i.StatusCode, i.IsVoided, i.SyncedAtUtc
FROM crm.InvoiceMirror i
OUTER APPLY (SELECT SUM(pa.AllocatedAmount) AS AllocatedAmount FROM crm.PaymentAllocationMirror pa JOIN crm.PaymentMirror p ON p.PaymentMirrorId=pa.PaymentMirrorId AND p.TenantId=pa.TenantId WHERE pa.TenantId=i.TenantId AND pa.InvoiceMirrorId=i.InvoiceMirrorId AND pa.IsReversed=0 AND p.IsVoided=0 AND p.StatusCode IN ('POSTED','CONFIRMED','CLEARED')) a
OUTER APPLY (SELECT SUM(cn.Amount) AS CreditAmount FROM crm.CreditNoteMirror cn WHERE cn.TenantId=i.TenantId AND cn.InvoiceMirrorId=i.InvoiceMirrorId AND cn.IsVoided=0 AND cn.StatusCode IN ('POSTED','APPROVED')) c;
GO
CREATE OR ALTER VIEW analytics.vw_AccountReceivable AS
SELECT TenantId, AccountId, CurrencyCode, SUM(CASE WHEN IsVoided=0 AND StatusCode NOT IN ('VOID','CANCELLED') THEN OutstandingAmount ELSE 0 END) AS OutstandingAmount,
 SUM(CASE WHEN IsVoided=0 AND StatusCode NOT IN ('VOID','CANCELLED') AND IsOverdue=1 THEN OutstandingAmount ELSE 0 END) AS OverdueAmount,
 MAX(SyncedAtUtc) AS LatestSourceSyncAtUtc
FROM analytics.vw_InvoiceBalance GROUP BY TenantId,AccountId,CurrencyCode;
GO
