# AKHAVAN CRM — قفل فهرست قابلیت‌ها (docs/FEATURE_INVENTORY.md)
**نسخه:** 1.0 (Baseline Lock prior to v3.3 Batch Execution)  
**سیاست:** هرگونه حذف یا تضعیف این قابلیت‌ها ممنوع بوده و موجب رد (FAIL) بازنگری می‌شود.

---

## ۱. فهرست مسیرها و صفحات ثبت‌شده در سورس
- `/`: `HomeWorkspace` — داشبورد شخصی روزانه، کارهای من امروز، رویدادها، میانبرها
- `/command`: `CommandCenterWorkspace` — مرکز فرماندهی و پایش ارشد کلان
- `/dashboard`: `DashboardWorkspace` — داشبورد آماری و شاخص‌های فروش و مشتریان
- `/customers`: `CustomersWorkspace` — بانک اطلاعات مشتریان و حساب‌ها
- `/customers/:id`: `Customer360` — پرونده جامع هویت، مراودات، پیش‌فاکتورها، مانده و تایم‌لاین مشتری
- `/quotes`: `QuotesWorkspace` — مدیریت پیش‌فاکتورها، ایجاد، قیمت‌گذاری و تایید
- `/negotiations`: `NegotiationsWorkspace` — مذاکرات فعال، پیش‌نویس‌های قیمت و پیشنهاد تخفیف
- `/tasks`: `TasksWorkspace` — مدیریت وظایف، تریاژ، پیگیری وصول، مأموریت‌های تیمی
- `/finance`: `FinanceWorkspace` — خزانه‌داری، دریافت و پرداخت، چک صیادی، گزارش سنی مطالبات (Aging)
- `/operations_control`: `OperationsControlWorkspace` — نظارت عملیات فروش، توزیع، پخش، مرجوعی‌ها و سیاست‌های تجاری
- `/geo_intelligence`: `GeoIntelligenceWorkspace` — هوش مکانی، زون‌بندی نسخه‌دار، تحلیل و انتساب مشتریان
- `/reports`: `ReportsWorkspace` — گزارش‌های تحلیلی، سنجه‌های عملکردی و خروجی CSV/اکسل
- `/settings`: `SettingsWorkspace` — تنظیمات سیستمی، مدیریت نقش‌ها، دسترسی‌ها و سیاست‌های اعتباری
- `/internal_automation`: `InternalAutomationWorkspace` — اتوماسیون داخلی، مرخصی، مأموریت، پرداخت و جلسات
- `/groups`: `GroupsWorkspace` — پیام‌رسان درون‌سازمانی، کانال‌ها، گروه‌های مشتری و چت تعاملی
- `/calendar`: `CalendarWorkspace` — گاه‌شمار جلالی، رویدادها و سررسیدها
- `/profile`: `ProfileWorkspace` — نمایه کاربری، مجوزها و اطلاعات شخصی
- `/login`: `LoginWorkspace` — صفحه ورود امن و احراز هویت
- `/apply`: `ApplyPage` — فرم درخواست همکاری و استخدام
- `/personnel-file`: `PersonnelFilePage` — پرونده استخدامی پرسنل
- `/onboarding-admin`: `OnboardingAdminWorkspace` — مدیریت جذب و تایید پرونده‌های متقاضیان

---

## ۲. موتورها و سرویس‌های محوری (Core Engines)
1. **موتور قیمت‌گذاری و سود پیش‌فاکتور (`src/lib/cpqEngine.ts`)**:
   - محاسبه بهای تمام‌شده، حاشیه سود ریالی و درصدی، تخفیفات پلکانی و بازه سود.
   - وضعیت‌های اعتبارسنجی سود: `KNOWN`, `PARTIAL`, `UNKNOWN`.
2. **موتور فرم‌های پویا (`src/services/dynamicFormEngine.ts`)**:
   - رندرینگ پویای فرم‌ها بر اساس Schema، اعتبارسنجی شرطی، منشن هوشمند و فیلدهای پولی.
3. **موتور تطبیق مطالبات و بستانکاری‌ها (`src/lib/receivableReconciliation.ts`)**:
   - انطباق فاکتورها، تخصیص‌های پرداخت و اسناد بستانکاری ERP با حفظ مانده معتبر.
4. **موتور هوش وظایف و تریاژ (`src/services/taskIntelligence.ts`)**:
   - شناسایی وظایف بدون مسئول، مهلت‌گذشته، نقض SLA و استثناهای عملیاتی.
5. **موتور گردش‌کار تسک (`src/services/taskWorkflow.ts`)**:
   - تغییر وضعیت‌های مجاز، ثبت فعالیت (Activity)، تفویض و ارجاع با ثبت یادداشت و تاریخچه.
6. **موتور منشن چندموجودیتی (`src/services/mentionEngine.ts`)**:
   - پیشنهاد هوشمند پرسنل، مشتریان، فاکتورها، چک‌ها و تسک‌ها با مراجع ساختاریافته.
7. **موتور هوش مکانی (`src/lib/geoIntelligence.ts`)**:
   - اعتبارسنجی چندضلعی‌های GeoJSON، بررسی نقطه در چندضلعی (Point-in-Polygon) و نسخه‌بندی مرزها.
8. **سرویس واردات داده‌های ERP (`src/lib/erpImportService.ts`)**:
   - برنامه‌ریزی همگام‌سازی، اعتبارسنجی برچسب زمان، تفکیک کلیدهای خارجی و مهار تکرار.
9. **سرویس کنترل دسترسی (`src/lib/rbac.ts`)**:
   - ماتریس دسترسی به تفکیک ماژول و عملیات (VIEW, CREATE, EDIT, ASSIGN, ALLOCATE, APPROVE, SOFT_DELETE).
10. **موتور داده‌های اولیه دمو (`src/lib/seed.ts`)**:
    - تولید داده‌های آزمایشی استاندارد توزیع و پخش؛ ایزوله با پرچم `demo`.

---

## ۳. خط مبنای تست‌های رگرسیون (Regression Baseline)
- تمام ۴۶ فایل تستی در پوشه `tests/` ثبت و قفل شدند.
- هر تغییری در کامپوننت‌ها یا سرویس‌ها باید پس از اعمال، با فرمان `npm test` به طور کامل با ۱۰۰٪ موفقیت پاس شود.
