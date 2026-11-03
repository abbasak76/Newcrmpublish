# مدرک اجرای فاز ۱ — تثبیت سورس و موانع پایه

- نسخه مبنا: `r11-cp9-b31`
- نسخه تغییرکرده: `r11-cp9-b32`
- تاریخ ثبت: 2026-10-27
- نوع مدرک: گزارش قابل بازتولید از تغییرات سورس و فرمان‌های اجراشده؛ این سند جایگزین اجرای Build یا SQL Server نیست.

## 1. نتیجه اجرایی

**وضعیت فاز ۱: انجام بخش‌های قابل اجرا؛ تکمیل نهایی مسدود تا رفع موانع مشخص‌شده.** این فاز عمداً موفقیت کامل اعلام نمی‌شود چون نصب وابستگی‌ها timeout شد و بنابراین Build/TypeScript/Lint قابل تأیید نیستند؛ همچنین SQL Server واقعی در دسترس نبود و جداسازی کامل seed از اجرای عملیاتی هنوز حل نشده است.

## 2. تغییرات کد انجام‌شده

1. `scripts/audit-sqlserver-contracts.mjs`
   - regex استخراج جدول اصلاح شد تا پرانتز پایانی دارای تورفتگی را بشمارد؛ در نتیجه جدول‌های تعریف‌شده داخل بلوک‌های `IF/BEGIN` نیز وارد ممیزی می‌شوند.
   - خروجی ممیزی اکنون تعداد تعریف‌های خام، تعداد نام‌های یکتا و برابری شمارش خام با جدول‌های parseشده را ثبت می‌کند.
   - اهداف RLS از سیاست پایه و migrationهای `ALTER SECURITY POLICY` استخراج می‌شوند.
2. `database/sqlserver/v1/010_sales_dispatch_rls.sql`
   - پوشش RLS برای پنج جدول افزوده‌شده در migration 008 اضافه شد: `crm.SalesOrder`، `crm.SalesOrderLine`، `crm.NegotiationScenario`، `crm.DispatchPlan` و `crm.DispatchPlanLine`.
   - migration جدید باید پس از 008 اجرا شود؛ SQL Server واقعی برای تأیید نحوی/اجرایی آن هنوز اجرا نشده است.
3. `src/workspaces/ProfileWorkspace.tsx`
   - fallback ثابت ایمیل `admin@akhavangroup.com` و شماره تلفن نمونه حذف شدند؛ اگر اطلاعات واقعی پروفایل وجود نداشته باشد فیلد خالی می‌ماند.
4. `src/components/GeoZoneMapEditor.tsx` و `src/components/GeoIntelligenceWorkspace.tsx`
   - ارائه‌دهنده، الگوی XYZ سفارشی و attribution از `state.settings.mapConfig` خوانده و در همان تنظیمات ذخیره می‌شوند؛ OSM همچنان گزینه پیش‌فرض سازگار است.
5. `src/components/SettingsWorkspace.tsx`
   - تنظیم انتخاب پروفایل کشور به تنظیمات locale افزوده شد. این تنظیم هنوز به معنی اتصال تمام اعتبارسنجی‌های کد ملی/موبایل/شبا به پروفایل کشور نیست؛ آن پیوندها باید در ممیزی مستقل تکمیل شوند.
6. `package.json`، `src/lib/version.ts` و `VERSION.md`
   - شماره نسخه و شناسه انتشار به `0.12.7 / r11-cp9-b32` همسان شدند.

## 3. نتایج آزمون اجراشده

### تست‌های محلی

فرمان اجراشده: `npm test`

نتیجه: موفق؛ تمام 23 اسکریپت تستی که در script فعلی `package.json` فهرست شده‌اند اجرا شدند. خروجی‌ها شامل آزمون‌های RBAC، reminder، policy/CPQ، receipt، onboarding، finance requests، negotiation, quote lifecycle، operations، seed، geo، collection, receivable reconciliation، credit note، accessibility، atmosphere و domain integration بودند.

### ممیزی قرارداد SQL

فرمان اجراشده: `node scripts/audit-sqlserver-contracts.mjs`

خروجی:

```json
{
  "sqlFiles": 10,
  "rawCreateTableDefinitions": 51,
  "uniqueRawTableNames": 51,
  "rawDefinitionCountMatchesParsedTables": true,
  "tables": 51,
  "tenantScopedTables": 49,
  "rlsTargets": 49,
  "requiredViews": 5,
  "mode": "static-only; no database connection or SQL execution"
}
```

نتیجه: `PASS` در ممیزی ایستا.

**توضیح اختلاف 51/46:** parser قبلی به‌خاطر انتظار `);` بدون فاصله/تورفتگی، پنج تعریف جدول داخل بلوک migration 008 را نمی‌شمرد. پس اختلاف گزارش‌شده از روش شمارش parser بود، نه مدرکی بر وجود پنج جدول تکراری. اکنون 51 تعریف خام و 51 نام یکتا شمرده می‌شوند.

**نکته کشف‌شده:** parser اصلاح‌شده همچنین نشان داد پنج جدول افزوده‌شده در migration 008 در RLS پایه 006 پوشش نداشتند. برای آن‌ها migration افزایشی 010 اضافه شد؛ تا اجرای SQL Server، پوشش عملیاتی هنوز تأییدشده نیست.

## 4. موارد مسدود/ناتمام — نباید به‌عنوان انجام‌شده گزارش شوند

1. `npm install --ignore-scripts --no-audit --no-fund` در محیط اجرا timeout شد و `node_modules` ساخته نشد. سپس `npm run lint` با خطای `TS2688: Cannot find type definition file for vite/client` و `npm run build` با خطای `vite: not found` شکست خوردند؛ بنابراین Build/TypeScript/Lint تأیید نشده‌اند و بررسی واقعی مرورگر اجرا نشده است.
2. SQL Server واقعی در دسترس نبود؛ migration 010، RLS، FK و RowVersion روی دیتابیس اجرا و تأیید نشده‌اند.
3. `src/lib/storage.ts` و `src/lib/seed.ts` هنوز برای ایجاد/ترمیم ساختار اولیه از `generateSeedData()` استفاده می‌کنند. پنل DemoDataPanel برای افزودن seed اضافی گارد دارد، اما این گارد به معنی حذف داده‌های seed پایه از راه‌اندازی برنامه نیست. حذف seed پایه بدون تعیین منبع داده/ورود عملیاتی می‌تواند برنامه را بشکند؛ این کار باید با تصمیم معماری و آزمون یکپارچه انجام شود، پس در این فاز به‌اشتباه «رفع‌شده» اعلام نشده است.
4. پروفایل کشور ذخیره می‌شود، اما همهٔ اعتبارسنجی‌های کشورمحور هنوز به آن متصل نشده‌اند.
5. نام ثابت `AKHAVAN CRM` در جاهایی که نام داخلی محصول است باقی مانده؛ نام نمایشی سازمان از تنظیمات tenant خوانده می‌شود. لازم است هر مورد UI جداگانه بررسی شود تا برند داخلی با نام شرکت یکی فرض نشود.
6. تنظیمات map provider اکنون در `state.settings.mapConfig` ماندگار می‌شوند، اما آزمون شبکه/کاشی واقعی و آزمون دستگاه iOS انجام نشده است.

## 5. معیار ورود به فاز ۲

- نصب موفق وابستگی‌ها و اجرای Build/TypeScript/Lint با ثبت خروجی؛
- تصمیم و پیاده‌سازی ایمن درباره seed پایه و منبع داده عملیاتی؛
- اجرای migrationهای 001 تا 010 در SQL Server آزمایشی، با ثبت نتیجه واقعی؛
- حفظ گزارش تست فعلی و اجرای مجدد آن پس از نصب وابستگی‌ها.

## 6. اصل صداقت گزارش

تست محلی موفق ≠ Build موفق ≠ SQL Server اجراشده ≠ اتصال ERP عملیاتی. فقط وضعیت‌هایی که خروجی واقعی دارند در این سند موفق ثبت شده‌اند.
