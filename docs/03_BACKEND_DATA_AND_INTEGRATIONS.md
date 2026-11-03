# 03 — Backend، مدل داده و یکپارچه‌سازی

> **وضعیت واقعی فعلی:** Backend/API عملیاتی، اتصال runtime به SQL Server، احراز هویت سمت سرور و اتصال واقعی ERP در این سورس تأیید نشده‌اند. اسکریپت SQL و قرارداد OpenAPI، پیش‌نویس/قرارداد هستند؛ وجودشان معادل استقرار نیست.

## معماری هدف
- Frontend → API امن → سرویس‌های دامنه/یکپارچه‌سازی → SQL Server؛ اسرار و اعتبارسنجی امنیتی سمت سرور، نه در کلاینت.
- برای ERP: دریافت در `RawRecord`، اعتبارسنجی، mapping به مدل کانونیکال، upsert با شناسهٔ خارجی، idempotency، retry و dead-letter. داده‌های مالی بیرونی read-only mirror باقی بمانند.
- Tenant/scope در تمام مسیرهای خواندن/نوشتن enforce شود. `SESSION_CONTEXT` و RLS تا اجرای واقعی و آزمون منفی امنیتی تأییدشده فرض نشوند.
- مهاجرت‌ها باید نسخه‌دار، قابل‌تکرار و قابل‌بازگشت باشند؛ قبل از اتصال به محیط واقعی، schema ERP و نسخه SQL Server روشن شود.

## حوزه‌های اولویت‌دار
1. فروش و مشتریان. 2. امور مالی و خزانه‌داری با مرجع بیرونی. 3. انبار، موجودی، خرید و تأمین‌کنندگان به‌عنوان قابلیت‌های آینده و وابسته به داده/قرارداد ERP.

## قواعد مالی و داده
- مانده = فاکتورها − تخصیص‌های پرداخت − بستانکاری/اعتبارهای اعمال‌شده؛ یک view مرجع و scope مشخص.
- Quote ≠ Order ≠ Invoice. از تبدیل محلی Quote به فاکتور رسمی بدون قرارداد و handoff به ERP پرهیز شود. رفتار موجود حذف ناگهانی نشود؛ ابتدا مسیر امن و idempotent طراحی و تست شود.
- تعیین ارز/واحد، مالیات، مرجوعی، ابطال، تخفیف، بهای تمام‌شده و تعدیلات باید با مرجع مالی تأیید شود؛ در صورت نبود دادهٔ هزینه معتبر، سود قطعی گزارش نشود.
- `Account` مدل کانونیکال است؛ `ExternalProduct` معادل موجودی/انبار نیست.

## وضعیت آزمون‌های ثبت‌شده در ممیزی b12 (نه اجرای تازه در این بسته)
- `npm test`: طبق گزارش b12، ۶ فایل و ۳۲۴ assertion موفق.
- `scripts/audit-actions.mjs`: طبق گزارش، ۵۸ handler تغییردهنده، ۵۸ محافظت‌شده، صفر مورد بدون guard. این تحلیل ایستا است.
- `scripts/audit-sqlserver-contracts.mjs`: طبق گزارش، ۷ فایل SQL، ۴۶ جدول، ۴۴ tenant-scoped، ۴۴ هدف RLS و ۵ view؛ بررسی ایستا، نه اجرای SQL.
- lint/typecheck و build در محیط ممیزی به علت نبود وابستگی‌های نصب‌شده/دسترسی `vite/client` موفق نشده‌اند. اجرای مرورگر، SQL Server، RLS runtime، ERP و SMS تأیید نشده است.

---

## منابع تاریخی ادغام‌شده (متن اصلی حفظ شده)


---

### منبع ادغام‌شده: `docs/analytics/KPI_DICTIONARY_v1.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# فرهنگ KPI — نسخه ۱.۰

تمام KPIها باید به Tenant، تاریخ/بازه، Scope سازمانی، ارز، منبع و آخرین زمان sync مقید باشند. UI تاریخ شمسی را برای نمایش استفاده می‌کند؛ کلید ذخیره‌سازی تاریخ میلادی ISO/SQL date است. همه مجوزها باید پیش از aggregate اعمال شوند تا داده خارج از scope حتی از طریق نمودار قابل استنباط نباشد.

| کد | نام | تعریف/فرمول | Grain | منبع | مالک | کنترل عددی |
|---|---|---|---|---|---|---|
| `SALES_REALIZED_NET` | فروش خالص تحقق‌یافته | جمع NetLineAmount ردیف فاکتورهای قطعی و غیرابطال‌شده؛ نه Quote/Opportunity | ردیف فاکتور/روز/ویزیتور/قلمرو/ارز | InvoiceMirror + InvoiceLineMirror | مالی/ERP | برابر گزارش فروش قطعی ERP با فیلتر یکسان |
| `SALES_FORECAST` | پیش‌بینی فروش | مجموع ExpectedAmount فرصت‌های باز، جدا از فروش قطعی؛ در صورت نیاز weighted forecast = amount × probability/100 | فرصت/روز بستن/مالک | Opportunity | مدیر فروش | فرصت‌های WON/LOST از forecast باز خارج شوند؛ نسخه فرمول ثبت شود |
| `GROSS_PROFIT_KNOWN_COST` | سود ناخالص با بهای معتبر | جمع NetLineAmount − CostAmount فقط برای ردیف دارای هزینه معتبر و ارز/واحد سازگار | ردیف فاکتور | InvoiceLineMirror | مالی | برابر محاسبه نمونه از ERP؛ اگر هزینه ناقص است KPI به‌عنوان partial علامت بخورد |
| `COST_COVERAGE_PCT` | پوشش بهای تمام‌شده | تعداد ردیف قطعی دارای Cost / تمام ردیف‌های قطعی × ۱۰۰ | روز/قلمرو/ویزیتور | InvoiceLineMirror | مالی | بین ۰ و ۱۰۰؛ denominator صفر => NULL |
| `AR_OUTSTANDING` | مانده مطالبات | مبلغ فاکتور معتبر − تخصیص معتبر − بستانکاری معتبر | حساب/ارز/تاریخ گزارش | vw_InvoiceBalance | حسابداری | تطبیق با مانده حسابداری در تاریخ برش |
| `AR_OVERDUE` | مطالبات سررسیدگذشته | Outstanding > 0 و DueDate قبل از تاریخ گزارش | حساب/ارز/بازه سنی | vw_InvoiceBalance | حسابداری | مانده overdue زیرمجموعه outstanding باشد |
| `COLLECTION_RATE` | نرخ وصول | پرداخت‌های معتبر تخصیص‌یافته به فاکتورهای سررسیدشده در دوره / مبلغ قابل وصول همان cohort؛ تعریف cohort باید با گزارش ثبت شود | دوره/قلمرو/ارز | PaymentAllocationMirror + InvoiceMirror | حسابداری | صورت و مخرج و تاریخ cohort در خروجی قابل ممیزی باشد |
| `ACTIVE_CUSTOMERS` | مشتری فعال | تعداد Accountهای فعال با حداقل یک فعالیت/فروش قطعی در پنجره تعریف‌شده؛ پنجره پیش‌فرض تا تصویب مالک KPI تعیین‌نشده است | دوره/قلمرو | Account + Activity + Fact sales | مدیر فروش | حذف duplicate account و حساب‌های غیرمشتری |
| `VISIT_COVERAGE` | پوشش مراجعه | مشتریان هدف یکتای دارای مراجعه معتبر / مشتریان هدف برنامه‌ریزی‌شده × ۱۰۰ | روز/ویزیتور/مسیر | Activity visit + route plan | سرپرست | بازدید با start/end معتبر و account مرتبط؛ تکرار مشتری در روز یک بار برای coverage |
| `VISIT_EFFECTIVENESS` | اثربخشی مراجعه | مراجعات منجر به outcome تعریف‌شده (سفارش/فرصت/پیگیری معتبر) / مراجعات معتبر × ۱۰۰ | روز/ویزیتور/قلمرو | Activity + sales/Opportunity | مدیر فروش | outcome و بازه attribution باید تصویب شود |
| `TASK_SLA_COMPLIANCE` | رعایت SLA | وظایف تکمیل‌شده در SLA / وظایف تکمیل‌شده دارای SLA × ۱۰۰ | دوره/تیم/مالک | Task | سرپرست | وظایف فاقد SLA از مخرج حذف و جداگانه شمارش شوند |
| `CASE_RESOLUTION_TIME` | زمان حل پرونده | میانگین/میانه ClosedAt − CreatedAt برای پرونده‌های بسته | دوره/نوع/اولویت | CaseRecord | خدمات/مدیریت | واحد ساعت/روز و حذف پرونده‌های باز شفاف باشد |

## قواعد داشبورد و مجوز
- CEO: سطح سازمانی مجاز؛ Sales Manager: شعبه/قلمروهای مجاز؛ Supervisor: تیم؛ Visitor: مالک/مشتریان مجاز؛ Finance: داده مالی طبق مجوز صریح.
- KPI بدون منبع معتبر یا بدون فرمول تصویب‌شده نمایش داده نشود؛ وضعیت «داده موجود نیست» با صفر یکی نیست.
- هر عدد نمایشی باید زمان آخرین همگام‌سازی، پوشش داده، واحد/ارز و فیلترهای اعمال‌شده را داشته باشد.
- جمع‌های بین چند ارز بدون نرخ تبدیل معتبر و تاریخ نرخ ممنوع است.
- فروش خالص، مبلغ پیش‌بینی، وصول نقدی، تخصیص پرداخت و سود مفاهیم مستقل‌اند و نباید در یک عدد ترکیب شوند.
- هر تغییر فرمول، `KpiVersion` جدید می‌خواهد و باید آزمون عددی قبل/بعد داشته باشد.


---

### منبع ادغام‌شده: `docs/analytics/KPI_TEST_FIXTURES_v1.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# آزمون‌های عددی مرجع KPI — نسخه ۱

این مثال‌ها داده ساختگیِ آزمون هستند، نه داده واقعی شرکت. هدف، تثبیت قرارداد محاسباتی پیش از اتصال به ERP است.

## 1. مانده مطالبات

| ورودی | مبلغ (IRR) | وضعیت |
|---|---:|---|
| فاکتور A | 1,000,000 | POSTED، معتبر |
| تخصیص پرداخت A1 | 400,000 | تخصیص معتبر، پرداخت CLEARED |
| تخصیص برگشتی A2 | 100,000 | `IsReversed=1`، حذف از محاسبه |
| بستانکاری A | 50,000 | APPROVED، معتبر |
| فاکتور باطل B | 250,000 | IsVoided=1، خارج از مانده معتبر |

انتظار برای فاکتور A: `1,000,000 - 400,000 - 50,000 = 550,000 IRR`. تخصیص برگشتی و فاکتور باطل نباید عدد را تغییر دهند. تاریخ سررسید تنها بر طبقه‌بندی overdue اثر می‌گذارد، نه فرمول مانده.

## 2. فروش تحقق‌یافته و پیش‌بینی

| رکورد | NetLineAmount | وضعیت فاکتور/فرصت | انتظار |
|---|---:|---|---|
| ردیف فاکتور A | 1,000,000 | POSTED و غیرابطال‌شده | در فروش قطعی منظور شود |
| ردیف فاکتور B | 250,000 | VOID | حذف شود |
| پیش‌فاکتور | 700,000 | Quote DRAFT | از فروش قطعی حذف شود |
| فرصت | 900,000 | OPEN | فقط در forecast تعریف‌شده منظور شود |
| فرصت | 300,000 | WON | از forecast فرصت‌های باز حذف شود؛ فروش قطعی تلقی نشود مگر فاکتور قطعی وجود داشته باشد |

انتظار فروش قطعی: `1,000,000 IRR`. پیش‌بینی بدون وزن فرصت‌های باز: `900,000 IRR`. این دو KPI مستقل‌اند.

## 3. سود و پوشش بهای تمام‌شده

| ردیف قطعی | فروش خالص | بهای معتبر | سود قابل گزارش |
|---|---:|---:|---:|
| A | 1,000,000 | 700,000 | 300,000 |
| B | 500,000 | NULL | نامشخص؛ در سود شناخته‌شده وارد نشود |
| C | 250,000 | 200,000 | 50,000 |

انتظار: سود ناخالص روی بهای شناخته‌شده `350,000 IRR`. پوشش بهای تمام‌شده بر اساس ردیف: `2 / 3 × 100 = 66.67%`. فروش کل قطعی `1,750,000 IRR` است، اما با این پوشش ناقص نباید `350,000` به‌عنوان سود کل همه فروش‌ها معرفی شود.

## 4. کنترل‌های کیفیت مشترک

- هر fixture باید در سطح Tenant، ارز، تاریخ برش و Scope سازمانی ثابت اجرا شود.
- اختلاف گردکردن، سیاست مرجوعی، مالیات، تخفیف و زمان‌بندی ثبت/ابطال باید پیش از مقایسه واقعی به تأیید مالک مالی برسد.
- آزمون‌ها باید به‌صورت integration test روی SQL Server و در برابر گزارش مرجع تکرار شوند؛ این سند به‌تنهایی اثبات اجرای تست نیست.


---

### منبع ادغام‌شده: `docs/history/SQLSERVER_FK_REVIEW_r9.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# بازبینی امن Foreign Keyهای SQL Server — r9 / cp7

## تصمیم ایمنی
در این دور هیچ FK به‌صورت خودکار تغییر یا حذف نشده است. تغییر سراسری FKها بدون اجرای SQL Server، بررسی کلیدهای یکتا، داده موجود، nullability و ترتیب migration می‌تواند نصب را خراب کند یا رابطه معتبر را حذف کند؛ بنابراین خروجی پیش‌پرواز به‌جای DDL حدسی، نام constraint و ستون‌های دو طرف را برای بررسی DBA نمایش می‌دهد.

## بهبود انجام‌شده
`database/sqlserver/v1/007_preflight_validation.sql` در خروجی FKهای بین دو جدول دارای `TenantId`، ستون‌های سمت فرزند و مرجع، وضعیت نگاشت `TenantId` و پرچم‌های disabled/untrusted را نمایش می‌دهد. گزارش فقط FKهایی را برمی‌گرداند که `TenantId` را در نگاشت ندارند. این خروجی یک فهرست بررسی است، نه حکم قطعی اینکه هر FK باید مرکب شود؛ برخی جدول‌های مرجع ممکن است عمداً سراسری باشند.

## مسیر اصلاح امن
1. اجرای 001 تا 007 فقط در دیتابیس آزمایشی SQL Server، نه production.
2. دسته‌بندی هر FK به tenant-owned / global lookup / cross-tenant forbidden.
3. برای روابط tenant-owned، افزودن unique key روی `(TenantId, EntityId)` در جدول مرجع و FK مرکب `(TenantId, ForeignId)` در جدول فرزند؛ ابتدا بررسی تکرار/مغایرت داده.
4. روابط اختیاری باید با nullability سازگار باشند؛ روابطی که FK فعلی به جدول بدون TenantId اشاره می‌کنند نیازمند بررسی جداگانه‌اند و در این گزارش حذف نشده‌اند.
5. اجرای تست دو tenant با شناسه‌های هم‌ارز، تلاش اتصال رکورد Tenant A به مرجع Tenant B، و آزمون‌های RLS با connection pooling.
6. فقط پس از تأیید DBA، migration نسخه‌دار و rollback plan اضافه شود.

## محدودیت اثبات
در محیط فعلی اتصال SQL Server و داده واقعی موجود نیست؛ بنابراین تعداد FKهای مسئله‌دار در دیتابیس اجراشده، صحت اجرای query کاتالوگ و عدم وجود داده ناسازگار تأیید نشده است.


---

### منبع ادغام‌شده: `docs/history/r10/SQLSERVER_FK_REVIEW-r10.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# SQLSERVER_FK_REVIEW-r10

## وضعیت واقعی بررسی
- **اتصال به SQL Server آزمایشی در دسترس نبود.** هیچ SQL اجرا نشد و هیچ Migration جدیدی ساخته یا اعمال نشد (طبق دستور: Migration مبتنی بر حدس ممنوع است).
- بررسی انجام‌شده فقط **استاتیک** است: `npm run audit:contracts` (PASS: ۷ فایل SQL، ۴۶ جدول، ۴۴ جدول دارای TenantId، ۴۴ هدف RLS، ۵ view الزامی) + یک سرشماری FK با پارس متنی همین دور.

## سرشماری FK (پارس متنی، تقریبی)
- جمع FK: **۱۰۱** | FK مرکب دارای TenantId: **۴۳** | FK غیرمرکب بین دو جدول دارای TenantId: **۵۷** (فهرست در پایین).
- یادداشت: پارس regex است؛ `ALTER TABLE ... ADD CONSTRAINT`‌های پیچیده یا ستون‌های computed ممکن است جا بیفتند. مرجع نهایی باید خروجی `sys.foreign_keys` باشد.

## ریسک
FK ساده مثل `account(OwnerUserId) -> appuser(UserId)` به‌تنهایی تضمین نمی‌کند هر دو رکورد در یک Tenant باشند، مگر کلید یکتای مرکب `(TenantId, Id)` و FK مرکب وجود داشته باشد. RLS (فایل 006) دسترسی را فیلتر می‌کند ولی «پیوند بین‌Tenant» را در سطح رابطه غیرممکن نمی‌کند.

## کاندیدهای بررسی (۵۷ مورد؛ بدون تغییر)
```
parsed FKs 101 | non-composite FK between two TenantId tables (cross-tenant risk candidates): 57
001_core_schema.sql: territory(BranchId) -> branch(BranchId)
001_core_schema.sql: team(BranchId) -> branch(BranchId)
001_core_schema.sql: team(TerritoryId) -> territory(TerritoryId)
001_core_schema.sql: appuser(BranchId) -> branch(BranchId)
001_core_schema.sql: appuser(TerritoryId) -> territory(TerritoryId)
001_core_schema.sql: appuser(TeamId) -> team(TeamId)
001_core_schema.sql: rolepermission(RoleId) -> role(RoleId)
001_core_schema.sql: userrole(UserId) -> appuser(UserId)
001_core_schema.sql: userrole(RoleId) -> role(RoleId)
001_core_schema.sql: account(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: account(BranchId) -> branch(BranchId)
001_core_schema.sql: account(TerritoryId) -> territory(TerritoryId)
001_core_schema.sql: account(TeamId) -> team(TeamId)
001_core_schema.sql: contact(AccountId) -> account(AccountId)
001_core_schema.sql: lead(AccountId) -> account(AccountId)
001_core_schema.sql: lead(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: opportunity(AccountId) -> account(AccountId)
001_core_schema.sql: opportunity(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: activity(AccountId) -> account(AccountId)
001_core_schema.sql: activity(ContactId) -> contact(ContactId)
001_core_schema.sql: activity(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: task(AccountId) -> account(AccountId)
001_core_schema.sql: task(OpportunityId) -> opportunity(OpportunityId)
001_core_schema.sql: task(CreatedByUserId) -> appuser(UserId)
001_core_schema.sql: task(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: taskassignmenthistory(TaskId) -> task(TaskId)
001_core_schema.sql: quote(AccountId) -> account(AccountId)
001_core_schema.sql: quote(OpportunityId) -> opportunity(OpportunityId)
001_core_schema.sql: quote(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: quoteline(QuoteId) -> quote(QuoteId)
001_core_schema.sql: note(AccountId) -> account(AccountId)
001_core_schema.sql: note(AuthorUserId) -> appuser(UserId)
001_core_schema.sql: caserecord(AccountId) -> account(AccountId)
001_core_schema.sql: caserecord(OwnerUserId) -> appuser(UserId)
001_core_schema.sql: groupmember(GroupId) -> grouprecord(GroupId)
001_core_schema.sql: groupmember(UserId) -> appuser(UserId)
001_core_schema.sql: groupmessage(GroupId) -> grouprecord(GroupId)
001_core_schema.sql: groupmessage(SenderUserId) -> appuser(UserId)
001_core_schema.sql: groupmessage(ReplyToMessageId) -> groupmessage(MessageId)
001_core_schema.sql: messagemention(MessageId) -> groupmessage(MessageId)
001_core_schema.sql: notification(RecipientUserId) -> appuser(UserId)
001_core_schema.sql: attachment(UploadedByUserId) -> appuser(UserId)
001_core_schema.sql: auditevent(ActorUserId) -> appuser(UserId)
001_core_schema.sql: internalrequest(RequesterUserId) -> appuser(UserId)
001_core_schema.sql: internalrequest(AssigneeUserId) -> appuser(UserId)
001_core_schema.sql: knowledgearticle(AuthorUserId) -> appuser(UserId)
001_core_schema.sql: campaign(OwnerUserId) -> appuser(UserId)
002_integration_schema.sql: connectorrun(ConnectorId) -> connector(ConnectorId)
002_integration_schema.sql: inboundenvelope(ConnectorId) -> connector(ConnectorId)
003_external_mirror_and_finance.sql: invoicemirror(AccountId) -> account(AccountId)
003_external_mirror_and_finance.sql: invoicemirror(SalesRepUserId) -> appuser(UserId)
003_external_mirror_and_finance.sql: invoicelinemirror(InvoiceMirrorId) -> invoicemirror(InvoiceMirrorId)
003_external_mirror_and_finance.sql: paymentmirror(AccountId) -> account(AccountId)
003_external_mirror_and_finance.sql: paymentallocationmirror(PaymentMirrorId) -> paymentmirror(PaymentMirrorId)
003_external_mirror_and_finance.sql: paymentallocationmirror(InvoiceMirrorId) -> invoicemirror(InvoiceMirrorId)
003_external_mirror_and_finance.sql: creditnotemirror(InvoiceMirrorId) -> invoicemirror(InvoiceMirrorId)
003_external_mirror_and_finance.sql: creditnotemirror(AccountId) -> account(AccountId)
```

## اقدام لازم روی DB آزمایشی (مسدود تا دسترسی)
1. `007_preflight_validation.sql` را اجرا و خروجی `sys.foreign_keys` (is_disabled, is_not_trusted) را ذخیره کنید.
2. برای هر کاندید: `SELECT` یتیم/ناسازگاری Tenant (child.TenantId <> parent.TenantId).
3. فقط پس از صفر بودن ناسازگاری: افزودن `UNIQUE (TenantId, <PK>)` روی parent و FK مرکب با `WITH CHECK`، با اسکریپت rollback.
4. تست دو-Tenant برای RLS (INSERT/UPDATE/SELECT متقاطع باید رد شود).

## نتیجه
PASS استاتیک؛ **اجرای واقعی: اجرا نشده**. هیچ ادعایی درباره امنیت Tenant در DB اثبات نشده است.


---

### منبع ادغام‌شده: `docs/integrations/CONNECTOR_API_CONTRACTS_v1.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — قرارداد Connector / API / Webhook نسخه ۱.۰

## وضعیت صادقانه
این فایل **قرارداد هدف و معیار پذیرش** است، نه ادعای وجود سرویس backend یا اتصال فعال. در نسخه فعلی رابط React، سرویس پایگاه SQL Server، Secret Manager، ERP endpoint، webhook receiver و Power BI gateway فراهم نشده‌اند؛ بنابراین همه Connectorها تا زمان پیکربندی و آزمون واقعی باید `NOT_CONFIGURED` بمانند. رابط کاربری نباید وضعیت `CONNECTED` را با تست محلی یا timeout ساختگی نمایش دهد.

## قرارداد عمومی Connector
- هویت: `tenantId`, `connectorCode`, `systemCode`, `contractVersion`, `correlationId`.
- وضعیت: `NOT_CONFIGURED | DISABLED | READY | CONNECTED | DEGRADED | FAILED | RATE_LIMITED`؛ `CONNECTED` فقط پس از health check واقعی و موفق.
- timeout پیش‌فرض ۱۰ ثانیه، قابل تنظیم بین ۱۰۰ms تا ۱۲۰s؛ retry پیش‌فرض ۳ بار فقط برای خطای موقت و عملیات idempotent.
- Backoff: exponential با jitter؛ مثال 1s, 2s, 4s، سقف ۳۰s؛ `Retry-After` بر پاسخ 429 مقدم است. برای خطای اعتبارسنجی/مجوز/نسخه ناسازگار retry انجام نشود.
- Rate limit باید در کلید tenant + connector + credential اعمال شود؛ پاسخ 429 شامل `Retry-After` باشد.
- هر درخواست `X-Correlation-ID` و عملیات تغییر‌دهنده `Idempotency-Key` دارد. تکرار همان کلید و payload باید همان نتیجه قبلی را بازگرداند.
- خطاها: `VALIDATION_ERROR`, `AUTH_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `CONTRACT_VERSION_UNSUPPORTED`, `DUPLICATE_EVENT`, `INTERNAL_ERROR`.
- لاگ نباید رمز، توکن، داده حساس غیرضروری یا payload کامل اطلاعات شخصی را ثبت کند. ثبت hash، شناسه خارجی، کد خطا، مدت و تعداد رکورد کافی است.
- Webhook: HTTPS، امضای HMAC-SHA256 روی raw body، timestamp با پنجره replay حداکثر ۵ دقیقه، شناسه یکتای event، deduplication، پاسخ 2xx پس از ثبت پایدار envelope؛ پردازش سنگین async.
- Versioning: مسیر `/api/v1/...` و `contractVersion: "1.0"`. تغییر ناسازگار فقط در نسخه major جدید؛ افزودن optional field در همان major مجاز. فیلد ناشناخته باید در نسخه‌بندی فعلی تحمل شود.
- سلامت: health endpoint واقعی، زمان آخرین موفقیت/خطا، زمان آخرین sync، cursor/modified watermark و نتیجه آزمون قطع‌و‌وصل.

## مالکیت فیلدها (پیش‌فرض تا تصویب اتصال)
| موجودیت/فیلد | مالک اصلی | سیاست CRM | تعارض |
|---|---|---|---|
| Account name, tax/national code, addressهای رسمی | ERP/سامانه مرجع مشتری | mirror/read-only تا تصویب صریح | SOURCE_WINS |
| Account owner, territory, visit preferences, relationship notes | CRM | CRM_ONLY | CRM_WINS |
| ExternalProduct/SKU/base unit | ERP/PIM | READ_ONLY | SOURCE_WINS |
| Invoice, invoice line, status, due date, posted amount | حسابداری/ERP | READ_ONLY mirror | SOURCE_WINS |
| Payment, cheque clearing, PaymentAllocation, credit note | حسابداری/ERP | READ_ONLY mirror | SOURCE_WINS |
| Quote, QuoteLine, Opportunity, sales follow-up | CRM | CRM_ONLY | CRM_WINS |
| Task, activity, case, group, message, notification, workflow | CRM | CRM_ONLY | CRM_WINS |
| Sales rep / branch mapping | سامانه سازمانی مرجع، سپس نگاشت CRM | MERGE با ExternalIdentityMap | MANUAL_REVIEW |
| Customer display fields derived from both | CRM canonical projection | MERGE فقط با FieldOwnership صریح | MANUAL_REVIEW |

تا زمانی که منبع رسمی برای یک فیلد تصویب نشده، آن فیلد نباید با حدس به‌روزرسانی شود. `integration.FieldOwnership` برای هر فیلد ثبت نهایی خواهد شد.

## شناسه‌های خارجی و همگام‌سازی
- کلید خارجی: `(TenantId, SourceSystemCode, EntityType, ExternalRecordId)`؛ شناسه داخلی هیچ‌وقت با شناسه ERP جایگزین نشود.
- رکورد خام در `integration.RawRecord`؛ پس از schema validation، normalization و mapping به mirror کانونیکال upsert می‌شود.
- حذف در منبع با soft-delete/void semantics منعکس شود؛ رکورد مالی حذف فیزیکی نشود.
- `SourceModifiedAtUtc`, `SyncedAtUtc`, `ExternalVersion` برای watermark، تشخیص داده قدیمی و تعارض استفاده می‌شوند.
- خطاهای قابل‌اصلاح به `RETRY` و خطاهای دائمی به `DEAD_LETTER`/`REJECTED` منتقل می‌شوند؛ هر retry و علت آن قابل‌مشاهده است.

## آزمون‌های پذیرش تکرارپذیر برای هر Connector
1. بدون credential: وضعیت `NOT_CONFIGURED`، هیچ درخواست خروجی انجام نشود.
2. credential نامعتبر: `AUTH_FAILED`، وضعیت `FAILED`، secret در log نشت نکند.
3. upstream قطع: timeout در سقف پیکربندی، retry با backoff، سپس `UPSTREAM_UNAVAILABLE`.
4. پاسخ 429: احترام به `Retry-After` و جلوگیری از retry storm.
5. پاسخ 500/503: retry محدود و ثبت attempt count.
6. payload نامعتبر/نسخه ناشناخته: رد با خطای قراردادی و عدم تغییر داده canonical.
7. ارسال مجدد webhook با event ID یکسان: فقط یک اثر کسب‌وکاری.
8. داده تکراری با external ID یکسان: upsert بدون رکورد تکراری.
9. تغییر هم‌زمان فیلد با مالکیت نامشخص: توقف/صف بررسی، نه overwrite خاموش.
10. قطع و وصل سرویس: sync از watermark، بدون جاافتادگی/دوباره‌شماری.
11. مجوز tenant A برای داده tenant B: 403/عدم افشای وجود رکورد.
12. آزمون عددی تطبیق: جمع فاکتورهای قطعی، پرداخت‌ها و تخصیص‌ها با گزارش مرجع حسابداری در تلورانس مصوب.

## معیار تحویل Connector
برای هر اتصال باید OpenAPI/JSON Schema، مالک سیستم، فهرست فیلدهای مالکیت، secret reference، health check واقعی، timeout/retry/rate limit، log redacted، idempotency، داشبورد وضعیت، تست موفق/ناموفق/قطع‌و‌وصل و صورت‌جلسه تطبیق داده موجود باشد. تا آن زمان `NOT_CONFIGURED` باقی می‌ماند.


---

### منبع ادغام‌شده: `docs/qa/SQL_SERVER_PREDEPLOYMENT_CHECKLIST_FA.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# چک‌لیست پیش از استقرار SQL Server — AKHAVAN CRM

این چک‌لیست مکمل اسکریپت‌های `database/sqlserver/v1/001..007` است؛ اجرای موفق اسکریپت‌های ساخت به‌تنهایی به معنی آماده‌بودن برای تولید نیست.

## ترتیب اجرا
1. تهیه Backup و ایجاد دیتابیس آزمایشی جداگانه با نسخه SQL Server مصوب.
2. اجرای `001_core_schema.sql` تا `006_row_level_security.sql` به ترتیب، با ثبت خروجی و خطاها.
3. اجرای `007_preflight_validation.sql` و ذخیره خروجی کامل؛ هر `THROW` مانع ادامه استقرار است.
4. بررسی فهرست `REVIEW: composite TenantId FK not confirmed`؛ برای هر رابطه بین دو جدول tenant-scoped، یکپارچگی Tenant باید با FK مرکب یا کنترل سمت سرور قابل اثبات شود.
5. اجرای آزمون‌های امنیتی زیر با دو Tenant آزمایشی مستقل.
6. اجرای آزمون‌های KPI و تطبیق با خروجی مرجع مالی/ERP.
7. فقط پس از تأیید DBA، مالک مالی، مالک اتصال و مسئول امنیت، برنامه استقرار و Rollback امضا شود.

## آزمون‌های الزامی RLS

- بدون `SESSION_CONTEXT('TenantId')`: هیچ ردیف tenant-scoped قابل مشاهده نباشد.
- با Tenant A: فقط ردیف‌های Tenant A قابل مشاهده باشند؛ تلاش برای خواندن Tenant B هیچ داده‌ای افشا نکند.
- درج/به‌روزرسانی با TenantId متفاوت از هویت احراز‌شده رد شود؛ TenantId فقط توسط لایه سرور مورد اعتماد تنظیم شود.
- پس از استفاده مجدد از pooled connection، context قبلی پاک/بازتنظیم شود؛ نشت Tenant بین درخواست‌ها آزمون شود.
- هویت ETL/Connector و عملیات migration با کمترین مجوز ممکن جدا شوند؛ مسیر privileged نباید به کاربران برنامه قابل دسترس باشد.
- نقش کاربری برنامه اجازه تغییر policy، تابع امنیتی یا اجرای SQL دلخواه نداشته باشد.

## آزمون‌های مالی و تحلیلی

- مانده فاکتور برابر مبلغ معتبر فاکتور منهای تخصیص‌های معتبر و بستانکاری معتبر باشد؛ تخصیص برگشتی، پرداخت باطل و فاکتور باطل حذف شوند.
- مجموع فروش قطعی فقط از ردیف‌های فاکتور با وضعیت قطعی و غیرابطال‌شده محاسبه شود؛ پیش‌فاکتور و فرصت وارد آن نشوند.
- سود فقط برای ردیف‌هایی محاسبه شود که بهای تمام‌شده معتبر دارند؛ درصد پوشش هزینه جداگانه گزارش شود.
- تمام مقایسه‌ها با ارز، محدوده سازمانی، تاریخ برش و آخرین زمان همگام‌سازی یکسان انجام شوند.
- `NULL` ناشی از نبود داده با صفر واقعی یکسان نمایش داده نشود.

## معیارهای توقف انتشار

- RLS غیرفعال/ناقص، Tenant context قابل جعل از مرورگر، یا خطر نشت در connection pool.
- رابطه بین موجودیت‌های دو tenant بدون کنترل یکپارچگی مستند.
- اختلاف عددی با ERP/حسابداری خارج از تلورانس مصوب.
- نبود قرارداد مالکیت فیلد، شناسه خارجی یکتا، idempotency یا مسیر dead-letter برای Connector.
- هر KPI فاقد مالک، فرمول نسخه‌دار، منبع، واحد/ارز، زمان آخرین sync یا آزمون عددی.

## وضعیت فعلی
اسکریپت 007 و چک‌لیست در این بسته اضافه شده‌اند؛ اجرای SQL Server واقعی، آزمون دو Tenant، آزمون connection pooling و تطبیق با داده مرجع هنوز انجام نشده‌اند. تا تکمیل آن‌ها مدل برای بازبینی و آزمون آماده است، نه تأیید استقرار تولیدی.


## مرجع جریان‌های فروش و توزیع
تعریف قطعی و اولویت‌دار جریان میز مذاکره، سفارش ERP، فاکتور قطعی، حوالهٔ پخش، تسویهٔ توزیع و تسویهٔ وصولی در `docs/11_CANONICAL_SALES_DISTRIBUTION_FLOWS.md` است. هیچ طراحی integration یا migration نباید این جریان‌ها را ادغام کند یا تبدیل سفارش به فاکتور را به CRM نسبت دهد.
