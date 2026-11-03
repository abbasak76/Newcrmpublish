/* Initial versioned KPI catalog. Values are definitions, not computed results. */
SET XACT_ABORT ON;
GO
IF NOT EXISTS (SELECT 1 FROM analytics.KpiDefinition WHERE KpiCode='SALES_REALIZED_NET' AND KpiVersion=1)
INSERT analytics.KpiDefinition(KpiCode,KpiVersion,NameFa,DefinitionFa,FormulaSqlDescription,GrainCode,SourceObjects,OwnerRoleCode,RefreshExpectation,RequiresCostData,EffectiveFrom,TestCaseJson)
VALUES('SALES_REALIZED_NET',1,N'فروش خالص تحقق‌یافته',N'جمع فروش خالص ردیف فاکتورهای قطعی و غیرابطال‌شده؛ پیش‌فاکتور و فرصت خارج است.',N'SUM(NetLineAmount) WHERE invoice status is posted/confirmed/closed AND IsVoided=0','INVOICE_LINE_DAY','crm.InvoiceMirror;crm.InvoiceLineMirror','FINANCE','AFTER_EACH_SYNC',0,'2026-01-01',N'{"tests":[{"name":"void invoice excluded","expected":0},{"name":"draft quote excluded","expected":0}]}');
IF NOT EXISTS (SELECT 1 FROM analytics.KpiDefinition WHERE KpiCode='SALES_FORECAST' AND KpiVersion=1)
INSERT analytics.KpiDefinition(KpiCode,KpiVersion,NameFa,DefinitionFa,FormulaSqlDescription,GrainCode,SourceObjects,OwnerRoleCode,RefreshExpectation,RequiresCostData,EffectiveFrom,TestCaseJson)
VALUES('SALES_FORECAST',1,N'پیش‌بینی فروش',N'ارزش فرصت‌های باز؛ از فروش تحقق‌یافته جداست.',N'SUM(ExpectedAmount) for open opportunities; weighted variant requires separately approved probability formula','OPPORTUNITY','crm.Opportunity','SALES_MANAGER','ON_CHANGE',0,'2026-01-01',N'{"tests":[{"name":"won opportunity not open forecast","expected":0}]}');
IF NOT EXISTS (SELECT 1 FROM analytics.KpiDefinition WHERE KpiCode='GROSS_PROFIT_KNOWN_COST' AND KpiVersion=1)
INSERT analytics.KpiDefinition(KpiCode,KpiVersion,NameFa,DefinitionFa,FormulaSqlDescription,GrainCode,SourceObjects,OwnerRoleCode,RefreshExpectation,RequiresCostData,EffectiveFrom,TestCaseJson)
VALUES('GROSS_PROFIT_KNOWN_COST',1,N'سود ناخالص با بهای معتبر',N'سود فقط برای ردیف‌هایی که بهای تمام‌شده معتبر دارند؛ سود کل در پوشش ناقص ادعا نمی‌شود.',N'SUM(NetLineAmount-CostAmount) for realized lines with non-null verified CostAmount','INVOICE_LINE_DAY','crm.InvoiceMirror;crm.InvoiceLineMirror','FINANCE','AFTER_EACH_SYNC',1,'2026-01-01',N'{"tests":[{"name":"missing cost remains unknown","expected":"excluded_from_profit"}]}');
IF NOT EXISTS (SELECT 1 FROM analytics.KpiDefinition WHERE KpiCode='AR_OUTSTANDING' AND KpiVersion=1)
INSERT analytics.KpiDefinition(KpiCode,KpiVersion,NameFa,DefinitionFa,FormulaSqlDescription,GrainCode,SourceObjects,OwnerRoleCode,RefreshExpectation,RequiresCostData,EffectiveFrom,TestCaseJson)
VALUES('AR_OUTSTANDING',1,N'مانده مطالبات',N'مبلغ فاکتور معتبر منهای تخصیص‌های پرداخت و بستانکاری معتبر.',N'InvoiceGrossAmount - ValidAllocatedAmount - ValidCreditAmount','ACCOUNT_CURRENCY_ASOF','analytics.vw_InvoiceBalance','FINANCE','AFTER_EACH_SYNC',0,'2026-01-01',N'{"tests":[{"name":"1000 invoice less 400 allocation and 100 credit","expected":500}]}');
IF NOT EXISTS (SELECT 1 FROM analytics.KpiDefinition WHERE KpiCode='AR_OVERDUE' AND KpiVersion=1)
INSERT analytics.KpiDefinition(KpiCode,KpiVersion,NameFa,DefinitionFa,FormulaSqlDescription,GrainCode,SourceObjects,OwnerRoleCode,RefreshExpectation,RequiresCostData,EffectiveFrom,TestCaseJson)
VALUES('AR_OVERDUE',1,N'مطالبات سررسیدگذشته',N'مانده مثبت فاکتور با سررسید قبل از تاریخ گزارش.',N'SUM(OutstandingAmount) WHERE IsOverdue=1 and invoice is not void','ACCOUNT_CURRENCY_ASOF','analytics.vw_InvoiceBalance','FINANCE','AFTER_EACH_SYNC',0,'2026-01-01',N'{"tests":[{"name":"future due date not overdue","expected":0}]}');
GO
