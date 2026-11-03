# وضعیت اجرای جاری — b15 (2026-10-25)

## تغییرات واقعی این بسته
- `src/lib/negotiationEngine.ts`: موتور پیشنهاد سناریو روی Quote موجود؛ سناریوی افزایش فقط با پلهٔ حجمی تنظیم‌شده، محاسبه با `calculatePriceWaterfall` موجود، و برچسب صریح نامشخص/ناقص بودن سود و ریسک اعتباری.
- `src/components/QuotesWorkspace.tsx`: میز مذاکرهٔ داده‌محور با اعمال سناریو روی پیش‌نویس و ثبت Audit؛ فیلتر پیش‌فاکتور و نمایش نام مشتری بر اساس RBAC/Scope؛ پذیرش پیش‌فاکتور از صدور فاکتور تفکیک شد؛ HANDOFF بدون API واقعی به‌عنوان انجام‌شده ثبت نمی‌شود؛ ورود دستی فاکتور نیازمند سیاست صریح است و شمارهٔ تکراری رد می‌شود؛ تاریخ سررسید فرضی ۱۴ روزه حذف شد.
- `src/lib/cpqEngine.ts`: import نوعی به `import type` اصلاح شد؛ در نبود بهای تمام‌شدهٔ معتبر، حاشیه سود به‌صورت `null` و `costKnown=false` اعلام می‌شود، نه سود ساختگی؛ منطق موجود CPQ حذف یا جایگزین نشد.
- `src/components/LeadsWorkspace.tsx`، `NegotiationsWorkspace.tsx`، `Customer360.tsx`، `FinanceWorkspace.tsx` و `src/hooks/useCan.ts`: فهرست سرنخ/فرصت/مالی بر اساس scope کاربر فیلتر شد؛ ایجاد رکورد بدون کاربر فعال رد می‌شود؛ فیلدهای scope کاربر روی رکوردهای تازه ثبت می‌شوند؛ شناسه‌های فرضی `usr_sales` و `usr_admin` حذف شدند؛ تصمیم روی درخواست مالی و تخصیص پرداخت نیز scope را دوباره کنترل می‌کند.
- `src/components/QuoteWizardModal.tsx` و `src/components/SettingsWorkspace.tsx`: نرخ مالیات، مدت اعتبار و شرایط پیش‌فرض پرداخت/تحویل از تنظیمات سازمان خوانده می‌شوند؛ نرخ ۱۰٪، اعتبار ۱۴ روزه و شرایط پرداخت فرضی حذف شدند؛ سیاست‌ها از صفحه تنظیمات قابل تعریف‌اند و تغییرشان Audit می‌شود؛ انتخاب مشتری در ویزارد بر اساس RBAC/Scope فیلتر می‌شود.
- `database/sqlserver/v1/008_sales_dispatch_extension.sql` و `009_sales_dispatch_preflight.sql`: مدل افزایشی سفارش مذاکره‌ای، ردیف سفارش، سناریوی مذاکره، برنامه پخش و ردیف برنامه پخش؛ قیود Tenant-aware، وضعیت‌ها و JSON، کنترل مقدارها، ایندکس‌ها، RLS و preflight کاتالوگ پس از migration.
- `tests/negotiationEngine.test.mjs`: ۱۷ assertion جدید؛ `tests/quoteLifecycle.test.mjs`: ۱۰ assertion قراردادی جدید برای پله حجمی واقعی، CPQ، ریسک اعتبار و بهای نامشخص.
- نسخهٔ محصول در b14 به `0.11.1` و در b15 به `0.11.2` ارتقا یافت. هیچ فایل یا موتور قبلی حذف نشده است.

## شواهد اعتبارسنجی این بسته
- `npm test`: PASS؛ ۱۱ مجموعه، مجموع 414 assertion.
- `node scripts/audit-actions.mjs`: `handlers(mutating)=67 guarded=67 unguarded=0`.
- `node scripts/audit-sqlserver-contracts.mjs`: PASS ایستا؛ 9 فایل SQL، 46 جدول، 44 جدول tenant-scoped، 44 هدف RLS، 5 view الزامی.
- بررسی نحوی با TypeScript `transpileModule`: 107 فایل TS/TSX، صفر خطای نحوی.
- Type-check مستقل `negotiationEngine.ts`، `cpqEngine.ts` و `types.ts`: PASS.
- `npm run lint` شکست خورد چون `vite/client` در dependencyهای نصب‌نشده وجود ندارد؛ `npm run build` نیز با `vite: not found` متوقف شد. تلاش `npm install --ignore-scripts --no-audit --no-fund` timeout شد؛ بنابراین Build کامل در این محیط قابل تأیید نیست. Migration روی SQL Server اجرا نشده؛ بررسی SQL صرفاً ایستا است.

## کارهای باز و محدودیت‌های صریح
- هنوز Backend/API و احراز هویت سمت سرور در سورس عملیاتی تأیید نشده؛ بنابراین عملیات ERP، Outbox واقعی و اجرای Migration در این بسته انجام‌شده ادعا نمی‌شوند.
- مدل SQL فروش/پخش و رابط محلی اولیه اضافه شده‌اند؛ تکمیل چرخه‌ها، Repository محلی و تست پذیرش هنوز باقی است.
- مالی/خزانه‌داری، سیاست تجاری جامع، سودآوری عملیاتی، کنترل ظرفیت/زون، تحلیل ریشه‌ای برگشت و گزارش‌های سنگین هنوز کامل نیستند. طبق اولویت کاربر، Backend/Auth/RBAC سمت سرور، اجرای SQL Server و اتصال/همگام‌سازی ERP در فاز آخر اجرا می‌شوند.

---

## تغییرات واقعی b15 — مرکز عملیات فروش و پخش آزمایشی
- `src/components/OperationsControlWorkspace.tsx`: مرکز عملیات شامل نمای کلی، سفارش‌ها، پخش/ناوگان، برگشتی‌ها، قوانین تجاری، سودآوری و تطبیق.
- `src/components/OperationsSupplementalTabs.tsx`: بخش‌های کالا/موجودی، درخواست خرید، اعتبار مشتری و گزارش کیفیت.
- `src/lib/operationsEngine.ts`: توابع خالص برای ارزیابی ریسک سفارش، تفکیک سود برآوردی از سود عملیاتی قابل محاسبه و KPIهای سفارش/برگشت/پرداخت/ظرفیت.
- `src/lib/seed.ts`: رکوردهای مصنوعی سفارش، پخش، برگشت، قوانین، پرونده تطبیق، تأمین‌کننده و درخواست خرید. داده‌های UI از State پایدارشونده خوانده می‌شوند و رکوردها با `LOCAL_TEST` مشخص شده‌اند.
- برگشت آزمایشی به تسک و پرونده تطبیق با مسئول و موعد متصل می‌شود. برگشت بدون سند مالی معتبر، مانده یا فروش خالص قطعی را تغییر نمی‌دهد.
- این فاز هنوز Backend/SQL runtime/ERP ندارد؛ فرم‌های عملیات محلی هستند و نباید به‌عنوان اجرای بیرونی واقعی تلقی شوند.

# 04 — ممیزی، تغییرات و کارهای باقی‌مانده

> **این سند تنها مرجع اجرایی برای وضعیت ممیزی و ادامهٔ کار است.** وضعیت‌ها از هم تفکیک می‌شوند: «موجود در سورس»، «تست ایستا/واحد»، «تأییدشده در runtime» و «مسدود/پیکربندی‌نشده». این‌ها یکسان نیستند.

## تاریخچهٔ b13 — فقط اسناد (وضعیت جاری در بخش بالایی این سند است)
- مبنای آن بسته: `AkhavanCRM-SolarEmber_r11-cp9_b12.zip`، نسخهٔ محصول `0.11.0`.
- بستهٔ تاریخی b13 صرفاً اسناد را استاندارد و ادغام می‌کرد. این توضیح به b14 جاری اشاره ندارد؛ تغییرات b14 در بخش آغازین همین سند ثبت شده‌اند.
- تغییرات b11→b12 در سورس: `package.json` (runner تست و اضافه‌شدن financeRequests به npm test)، `scripts/audit-actions.mjs` (رفع false-positive تشخیص handler)، `HANDOFF.md`, `VERSION.md` و گزارش تاریخی b12. هیچ فایل UI/منطق کسب‌وکار در آن diff تغییر نکرده بود.

## نتیجهٔ ممیزی کامل ماژول‌ها
- **ساختار/صفحات موجود در سورس:** پوسته و مسیرها، Home/Dashboard/Command Center، Leads، Accounts/Customers و Customer360، Activities، Opportunities/Negotiations، Quotes/CPQ، Finance/Collections/Receipts/Cheques، Tasks/Calendar، Groups/Messages/Notifications، Cases، Campaigns، Knowledge، Internal Automation، Reports/Analytics، Settings, Users/Roles/RBAC، Login/Auth UI، Onboarding/Personnel/Profile، Dynamic Forms، Attachments, Offline Queue, AI advisor/agents, print/export. وجود UI/منطق محلی به معنی سرویس عملیاتی یا اتصال backend نیست.
- **ماژول‌های مستقل تکمیل‌نشده:** Inventory/Warehouse، Purchasing/Suppliers، Planned Delivery/Vehicle. `ExternalProduct` جایگزین این ماژول‌ها نیست.
- **Auth:** `AuthService.authenticate()` تا تنظیم provider، وضعیت `NOT_CONFIGURED` برمی‌گرداند؛ fail-closed حفظ شود.
- **Backend/DB:** در این بسته API/server entrypoint اجرایی و اتصال runtime به SQL Server تأیید نشده؛ SQL و OpenAPI draft هستند.
- **Storage:** fallback مبتنی بر seed در برخی مسیرهای integrity باید از دادهٔ عملیاتی جدا و در سناریوهای بازیابی تست شود.
- **مالی:** جریان محلی تبدیل Quote به Invoice در UI وجود دارد، درحالی‌که فاکتور رسمی باید از ERP بیاید؛ بدون حذف ناگهانی، قرارداد handoff و idempotency طراحی شود.
- **مستندات:** ادعای قدیمی «۲۸ موتور» با شمارش فهرست موتورهای سند معماری سازگار نیست؛ پیش از اصلاح عدد، inventory واقعی کد ملاک باشد. گزارش‌های تاریخی با ادعاهای PASS قدیمی نباید جایگزین نتیجهٔ ممیزی جاری شوند.

## کارهای اجرایی به ترتیب اولویت
### P0 — پایهٔ قابل‌ساخت و غیررگرسیو
1. نصب dependencyها در محیط مجاز و اجرای `npm ci`/`npm install` مطابق lockfile واقعی، سپس `npm test`, `npm run lint`, `npm run build`; خطاها با خروجی کامل ثبت شوند. در این مرحله lockfile بی‌دلیل بازنویسی نشود.
2. مرور مرورگر واقعی دسکتاپ و Safari/iOS: login, navigation, forms, Customer360, Quotes/CPQ, Finance, Groups, responsive sheets, offline/reload.
3. بررسی مسیرهای mutation در هر workspace، مجوز، audit، validation، save/reload و خطاهای storage.

### P1 — رفع شکاف‌های CRM فعلی
4. ردیابی seed fallback و اثبات جداسازی دادهٔ نمونه از دادهٔ عملیاتی.
5. بازبینی جریان Quote→Invoice: حفظ UX موجود، اما تعیین مرز رسمی ERP و جلوگیری از صدور/تکرار سند محلی به‌عنوان سند قطعی. نیازمند تصمیم محصول و قرارداد integration است.
6. رگرسیون موتور فرم پویا، CPQ، collection/receipt, RBAC, offline queue, notifications, audit/workflows.
7. performance/mobile audit برای `se-card` blur و صفحات پرتراکم؛ تغییر فقط با اندازه‌گیری.

### P2 — Backend واقعی (نیازمند ورودی‌های بیرونی)
8. انتخاب/تأیید محیط backend، روش auth، نسخه SQL Server، محیط deployment و مالک اسرار.
9. دریافت schema/API واقعی ERP و mapping شناسه‌ها؛ سپس اجرای migration در محیط تست، RLS/security negative tests و آزمون backup/restore.
10. پیاده‌سازی API امن، server-side authorization، connector idempotent، retry/dead-letter و observability. SMS/scheduler نیز تا زمان داشتن provider واقعی `NOT_CONFIGURED` بمانند.

### P3 — حوزه‌های گسترش محصول
11. مدل مستقل موجودی/انبار، خرید/تأمین‌کننده و تحویل/وسیله نقلیه، پس از تعیین مرز مالکیت داده با ERP.
12. فقط پس از موفقیت build و regression، UXهای باقیماندهٔ ثبت‌شده در HANDOFF ارزیابی شوند؛ ناوبری پایین در این دور خارج از محدوده است.

## قواعد تحویل برای هوش مصنوعی
- قبل از کدنویسی: سورس، `VERSION.md`، این سند و اسناد معماری/دیزاین/Backend را بخوان؛ وضعیت Git و diff را بررسی کن.
- در هر مرحله فقط یک تغییر کوچک و قابل‌آزمون؛ فایل‌ها/قابلیت‌ها را حذف نکن؛ از دادهٔ mock و ادعای اجرای آزمون بدون اجرا پرهیز کن.
- پس از تغییر، تست‌های مرتبط، تست کلی، build/lint و diff غیرمنتظره را بررسی کن؛ نسخه، این سند و `HANDOFF.md` را فقط با شواهد واقعی به‌روز کن.
- اگر به ERP، SQL Server، backend، secrets یا محیط اجرای واقعی دسترسی نداری، آن را BLOCKED بنویس و قرارداد/کد جعلی تولید نکن.

---

## گزارش‌ها و تاریخچهٔ اصلی ادغام‌شده


---

### منبع ادغام‌شده: `CHANGES-r11-cp9_latest.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# گزارش تغییرات — r11-cp9 / آخرین بسته (مبنا: b01 به‌صورت تجمعی؛ b02 و b03 ادغام شده‌اند)

## انجام‌شده در b02
1. حذف پوشه `skills/` و تبدیل کپی `docs/architecture/SKILL_*.md` به `ENGINEERING_STANDARDS_SPEC.md` (محتوا حفظ شد).
2. حذف پالت قدیم: `src/lib/tokens.ts` و سایه‌ی `rgba(31,33,40)` در Customer360.
3. حذف معماری Journey (صفحه، پوشه، مسیر `/journey`، آیتم منو). مسیر قدیمی به صفحه اصلی هدایت می‌شود.
4. حذف `CustomerActionModals.tsx` و `ModalOverlay.tsx` (معادل همه با موتور فرم پویا فعال است).
5. فرم مخاطب به موتور فرم پویا (`CONTACT_FORM_SCHEMA`) منتقل شد: اعتبارسنجی موبایل/ایمیل/تلفن ثابت، بدون نقش پیش‌فرض هاردکد، Audit، مجوز در محل اجرا.
6. فرم وصولی Customer 360 از همان `receiptFlow` عبور می‌کند (قبلاً مستقیم «تسویه‌شده» ثبت می‌شد).
7. حذف `Math.random` از شماره فاکتور و کد حساب (`nextSequenceNumber`)؛ شماره چک ساختگی تولید نمی‌شود.
8. نسخه: `metadata.json` نسخه گرفت؛ «v2.5» و «v2.6 Pro» با `APP_VERSION_LABEL` جایگزین شد.
9. حذف عبارت اختصاصی «انبار مرکزی اخوان» از شرایط تحویل پیش‌فرض پیش‌فاکتور.
10. مستندات r6–r10 به `docs/history/` منتقل شد.

## انجام‌شده در b03
1. **Guard در محل اجرا (GUARD-001)**
   - Settings: همه‌ی ۱۲ نقطه‌ی تغییر وضعیت (نقش، کاربر، ماژول‌ها، کلید توقف AI، زبان/منطقه، عامل‌ها، درگاه‌ها، پیام آزمایشی، الزام مجوز دستگاه) با `can()`؛ تعویض کاربر فعال با `users.EDIT`.
   - Cases / Campaigns / Knowledge: ثبت تیکت با `cases.CREATE`؛ کمپین و مقاله با مجوز ماژول مربوط.
2. **حذف fallback ناامن `usr_admin`** در ثبت تیکت، کمپین و مقاله (بدون کاربر فعال ثبت انجام نمی‌شود).
3. **Audit حذف قلم پیش‌فاکتور** (نام قلم، مبلغ، شماره پیش‌فاکتور، عامل).
4. یافته: Calendar و Activities فقط‌خواندنی هستند و نقطه‌ی تغییر وضعیت ندارند؛ Guard لازم ندارند.
- بررسی: ۹۷ فایل TS/TSX بدون خطای نحوی؛ `npm test` همه‌ی ۴ مجموعه PASS.

## انجام‌شده در b04 تا b07
1. **مورد ۱ — فرم‌های مالی با موتور فرم پویا**: فاکتور، رسید پرداخت و چک در FinanceWorkspace با `createInvoiceFormSchema` / `createPaymentReceiptFormSchema` / `createChequeFormSchema` و `DynamicFormRenderer` جایگزین فرم‌های دستی شدند.
   - مقدارهای پیش‌فرض ساختگی حذف شد (بانک ملت/صادرات، مبلغ ۸۰ میلیون، سررسید ثابت، انتخاب خودکار اولین حساب).
   - فاکتور از پیش‌فاکتور: مبلغ و اقلام مستقیم از پیش‌فاکتور؛ پیش‌فاکتورهای قبلاً فاکتورشده در فهرست نمی‌آیند؛ Audit صدور فاکتور.
   - چک: شناسه صیاد ۱۶ رقمی اجباری و ضدتکرار (دو لایه).
   - رسید: همچنان از `receiptFlow` واحد عبور می‌کند.

2. **مورد ۲ — tenantName**: `getTenantName()` در `orgPolicy`؛ فیلد «نام سازمان» در Settings (با مجوز)؛ استفاده در سربرگ Layout، چاپ پیش‌فاکتور و فرستنده‌ی پیام؛ مقدار اولیه فقط در داده‌ی seed (نه در کد). عنوان راهنمای شروع کار به نام محصول تغییر کرد. صفحه ورود عمداً برند محصول را نگه می‌دارد (پیش از احراز هویت tenant شناخته‌شده نیست).
3. **مورد ۳ — حذف fallback `usr_admin`** از همه‌ی نقاط: پیش‌فاکتور (دو مسیر)، تیکت در Customer 360 و `internalAutomation`. بدون کاربر فعال ثبت انجام نمی‌شود. شماره پیش‌فاکتور هم ترتیبی شد (`QT-` بدون وابستگی به زمان).

4. **مورد ۴ — فونت محلی (آماده‌سازی)**: `@font-face` با `local()` و مسیر `/fonts/Vazirmatn-variable.woff2` و راهنمای `public/fonts/README.md`. خودِ فایل woff2 در این محیط (بدون شبکه) در دسترس نبود؛ لینک Google Fonts تا قرارگرفتن فایل نگه داشته شد.
5. **مورد ۵ — اتوماسیون**:
   - یافته‌ی مهم: `evaluateAutomations` در هیچ‌جا فراخوانی نمی‌شد و قوانین هرگز اجرا نمی‌شدند. اکنون در همان `useWorkflowEngine` موجود (بدون موتور جدید) رویدادهای تازه را یک‌بار ارزیابی می‌کند (رویداد قدیمی‌تر از ۲۴ ساعت بی‌صدا علامت می‌خورد).
   - تب «قوانین اتوماسیون» در Settings (تعریف با موتور فرم پویا، فعال/غیرفعال با Audit و مجوز)؛ فیلد `automations` در `AppState`؛ کاتالوگ واحد رویداد/اقدام در `automation.ts`.
   - Dead-letter: شکست قطعی Job اعلان خطای ضدتکرار برای مدیر می‌سازد.

6. **مورد ۶ — وصل‌کردن ماژول‌های بدون مصرف**:
   - `lib/agents.ts` (دستیاران AI + کلید توقف) در همان `useWorkflowEngine` به رویدادهای تازه وصل شد.
   - `aiAdvisorService` در داشبورد نمایش داده می‌شود (۳ پیشنهاد، مخفی با کلید توقف AI). آستانه‌های هاردکد (۳۰ روز / ۵۰ میلیون) حذف شد و از سیاست سازمان (`churnRiskDays`, `churnRiskMinSales` در Settings → ساختار سازمان) خوانده می‌شود؛ بدون تعریف آن‌ها پیشنهاد ریزش تولید نمی‌شود.
   - `lib/offline.ts` عمداً وصل نشد: صف آفلاین بدون endpoint همگام‌سازی واقعی، عملیات را برای همیشه در صف نگه می‌دارد (نیازمند قرارداد بک‌اند).

## بررسی پیشنهادهای متن ارسالی
- RuleEngine / SchedulerEngine / Audit جدید: رد (موتور موازی؛ `orgPolicy`، `reminders`، `auditLogs` موجودند).
- assignmentEngine پیشنهادی: رد (Fail-Open به مدیر).
- PenaltyPolicy / Contract: منتظر تعریف سیاست توسط شما؛ عددی هاردکد نمی‌شود.
- Dead-letter در automation: تأیید، اجرا در دور بعد.

## هنوز انجام نشده
1. (انجام شد در b04)
2. (انجام شد در b05؛ فقط صفحه ورود برند محصول را نگه می‌دارد)
3. (انجام شد در b05)
4. (آماده‌سازی انجام شد؛ فقط قراردادن فایل woff2 و حذف لینک Google مانده)
5. (انجام شد در b06؛ اکشن SEND_CHANNEL_MESSAGE هنوز در UI قانون عرضه نشده چون درگاه پیکربندی نشده)
6. (agents و aiAdvisor انجام شد در b07؛ `offline.ts` منتظر قرارداد همگام‌سازی بک‌اند است)
7. بومی‌سازی ادبیات (CPQ/Handoff/Snapshot/Esc با `<kbd>`)، Bottom Sheet و Stepper موبایل، Split View پیشنهاد فروش با Count-up، Swipe/Haptics، Shared-element و Scroll-progress در Customer 360، لبه‌ی محوشونده جداول، `content-visibility`.
8. ممیزی صحنه ۳D ورود با مشخصات Idle Loop (KTX2، Metallic 1 / Roughness 0.2، Light Sweep ۴۵ درجه، ذرات).
9. اجرای `tsc` و `build` کامل (نیازمند node_modules و شبکه).


---

### منبع ادغام‌شده: `HANDOFF.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# HANDOFF — AKHAVAN CRM r11-cp9 · b12

## وضعیت فعلی
- مبنا: b07 (ارسالی شما). نسخه محصول 0.11.0 (`src/lib/version.ts`, `VERSION.md`). تست‌ها: `npm test` (۲۹۰+ assertion، همه PASS در Node بدون وابستگی).
- **اجرا نشده:** `npm i` / `tsc` / lint / build / مرورگر (محیط من node_modules و شبکه ندارد؛ فقط سینتکس ۱۰۳ فایل با transpile بررسی شد). **اولین قدم شما: `npm i && npm run lint && npm run build && npm test` و ارسال خطاها.**

## تغییرات این مرحله (روی b07)
1. فونت محلی Vazirmatn UI (woff2 در `public/fonts/webfonts`، `@font-face` در `src/index.css`، حذف Google Fonts، کش SW v2).
2. ماژول ثبت‌نام/استخدام: `src/lib/onboarding.ts` (+`tests/onboarding.test.mjs`)، صفحات `src/components/onboarding/{ApplyPage,PersonnelFilePage,OnboardingAdminWorkspace}.tsx`، `shared/DocumentField.tsx`، مسیرها `/apply` (عمومی)، `/personnel-file`، `/onboarding`، منو + مجوز `onboarding.*`.
3. صفحه ورود: کارت «متقاضی استخدام…» → `/apply`، نام/لوگوی شرکت از تنظیمات، `onAuthenticated` (هدایت به تکمیل پرونده)؛ **موشن‌ها دست‌نخورده**.
4. مالی مطابق ماهیت CRM: دستور پرداخت / مجوز واریز (`src/lib/financeRequests.ts` + تست)، وصولی با پیوست الزامی (`receiptFlow`)، ورود دستی فاکتور/چک فقط با `orgConfig.allowManualFinanceEntry`.
5. guardهای باقی‌مانده (`guard()` در `hooks/useCan.ts`): `node scripts/audit-actions.mjs` → ۵۸/۵۹ (یک مورد false-positive).
6. طراحی (فایل ارسالی): کارت شیشه‌ای انکساری، هاله جوی نو (aurora+noise، مستقل از تم)، Bottom Sheet موبایل + swipe-down، سایدبار فنری + پروفایل بنتو (داده واقعی وظایف)، Badge با نقطه نورانی، دونات تعاملی، چت (گروه‌بندی حباب، سربرگ روز شیشه‌ای، سوایپ پاسخ فنری)، kbd/واژگان بومی (`labels.ts`).

## مهم/مسیرها
`src/lib/{rbac,onboarding,financeRequests,receiptFlow,reminders,orgPolicy}.ts` · `src/hooks/useCan.ts` · `src/components/{Layout,Sidebar,LoginWorkspace,FinanceWorkspace,GroupsWorkspace}.tsx` · `tests/*.test.mjs` · `scripts/{release.sh,audit-actions.mjs}`.

## انجام‌نشده / مسدود (صادقانه)
- backend/احراز هویت واقعی، درگاه پیامک، ERP، Scheduler سرور: NOT_CONFIGURED. پیامک‌ها «ساخته و ثبت» می‌شوند، ارسال نمی‌شوند؛ پیامک اطلاعات ورود تا وجود سرویس تولید رمز موقت BLOCKED است. ثبت‌نام عمومی فقط روی همان دستگاه ذخیره می‌شود.
- انجام نشده از فایل طراحی: انتخابگر تاریخ اسکرول‌اسنپ، Split-View ویزارد پیش‌فاکتور، Morph دکمه + (FLIP)، Dynamic-Island نوار ابزار، Sliding indicator فیلترها، اتصال `useCountUp` به همه اعداد داشبورد، LineChart درخشان. (کد پیشنهادی از `framer-motion` استفاده می‌کرد؛ پروژه `motion` دارد.)
- رد‌شده از فایل طراحی: نمودار ستونی ثابت [40,70,100…] در پروفایل (داده ساختگی)، پس‌زمینه تیره‌ی «شب» در هاله (تم را با هاله قاطی می‌کرد)، واژه «انبار/سفارش قطعی» برای Handoff (CRM سفارش‌گیر نیست).
- ریسک: `se-card` اکنون blur دارد (کارت‌های بسیار زیاد در یک صفحه → بررسی کارایی موبایل)؛ `Card`→`se-card` ممکن است برخی صفحات را بصری تغییر دهد؛ فونت وزن 300 به 400 نگاشت می‌شود.
- مغایرت دامنه: «صدور فاکتور قطعی در بخش مالی» در QuotesWorkspace هنوز هست؛ طبق توضیح شما فاکتور در ERP صادر می‌شود → تصمیم برای پنهان‌کردن لازم است.

## قدم بعدی دقیق
۱) build/lint روی سیستم شما و رفع خطای احتمالی TS (به‌خصوص `GroupsWorkspace` SwipeReply، `Sidebar` stats، Modal sheet). ۲) تست بصری موبایل/Safari (Bottom Sheet، هاله، Warp). ۳) سپس موارد «انجام‌نشده» به ترتیب: DatePicker، ویزارد Split-View، Morph/Toolbar، useCountUp.

---
## افزوده b11 — ارزیابی «گزارش/پچ‌های پیوستی» (اعمال نشد؛ طبق دستور: فقط تحویل)
متن پیوستی از یک ابزار دیگر شامل پچ‌های پیشنهادی بود، **هیچ‌کدام روی این سورس اعمال نشده‌اند** و ادعاهای «پایان پروژه / Zero Syntax Error / پایداری کامل» در آن تأیید نشده است (build/lint/مرورگر هنوز اجرا نشده).
- پیشنهاد حذف `handleConvertToInvoice` + دکمه «صدور فاکتور قطعی»: با توضیح شما (فاکتور در ERP) هم‌جهت است ولی حذف قابلیت است → فقط با تایید صریح شما؛ تا آن زمان دست‌نخورده (در این سورس هنوز وجود دارد).
- `useCountUp` به Home/Dashboard: هوک `src/hooks/useCountUp.ts` در سورس وجود دارد؛ اتصال به Home/Dashboard کم‌ریسک است و در دور بعد قابل اعمال (اعمال نشد).
- حذف blur کارت در موبایل (`@media max-width:768px`): ایده مفید و کم‌ریسک برای کارایی؛ پیشنهاد اعمال در دور بعد.
- «Liquid Dock» (حذف کپسول `+` از کنار ناوبری و انتقال به Orb گوشه): **مغایر با Master Directive** (کپسول `+` مستقل کنار کپسول چهارآیکونی) → نیازمند تصمیم شما؛ اعمال نشد.
- Split-View ویزارد پیش‌فاکتور: کد پیشنهادی به متغیرهایی وابسته است (`selectedCustomer`, `subtotal`, `grandTotal`, `marginPercent`…) که باید با state واقعی ویزارد تطبیق داده شود؛ ریسک کامپایل → بعد از build موفق.


---
## افزوده b12 — ممیزی سورس و اصلاح ابزار تست/ممیزی
- اسکریپت `npm test` اصلاح شد تا فایل‌های TypeScript موقت با `--experimental-strip-types` در Node 22 اجرا شوند؛ تست `financeRequests.test.mjs` نیز که از زنجیره جا افتاده بود اضافه شد.
- `scripts/audit-actions.mjs` اصلاح شد تا متغیر `assigneeType` را با handler تغییردهنده اشتباه نگیرد؛ نتیجه جدید ۵۸/۵۸ guarded و صفر مورد unguarded است.
- نتایج اجرا: `npm test` = PASS (۶ فایل، ۳۲۴ assertion)؛ `audit-actions` = ۵۸/۵۸؛ `audit-sqlserver-contracts` = PASS ایستا (۷ فایل SQL، ۴۶ جدول، ۴۴ tenant-scoped، ۴۴ RLS targets، ۵ view).
- `npm run lint` به‌علت نبود `vite/client` و dependencies نصب‌نشده متوقف شد؛ `npm run build` به‌علت نبود دستور `vite` اجرا نشد. این دو مورد PASS محسوب نمی‌شوند.
- هیچ قابلیت UI/کسب‌وکار حذف یا اضافه نشد؛ Backend، احراز هویت واقعی، SQL Server runtime، ERP، SMS و Scheduler همچنان `NOT_CONFIGURED` هستند.
- گزارش ممیزی کامل این بسته: `docs/history/r11/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r11-b12.md`.
- ادامه امن: ابتدا وابستگی‌ها را در محیط توسعه نصب و lint/build را موفق کنید؛ سپس تست Safari/iOS؛ بعد سراغ DatePicker، Split-View، Morph/Toolbar و `useCountUp` بروید.


---

### منبع ادغام‌شده: `VERSION.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# VERSION
- نسخه محصول: **0.11.0** (SemVer: MAJOR.MINOR.PATCH؛ هر دور اجرایی = یک MINOR)
- دور / چک‌پوینت: **r11 / cp9** — مبنا: r10-cp8
- منبع واحد در کد: `src/lib/version.ts` + `package.json` (باید یکسان باشند)

## قرارداد نام‌گذاری خروجی
`AkhavanCRM-SolarEmber_r{دور}-cp{چک‌پوینت}_b{شمارنده}.zip` — مثال: `AkhavanCRM-SolarEmber_r11-cp9_b02.zip`
- شمارنده `b` هر بار که خروجی ساخته می‌شود افزایش می‌یابد (b01, b02, …)؛ **فایلی با نام قبلی بازنویسی نمی‌شود** (اسکریپت `scripts/release.sh` در صورت وجود نام، شمارنده را بالا می‌برد).
- Diff دور: `…_b{n}_vs-{مبنا}.diff`؛ Diff تجمیعی: `…_b{n}_cumulative-from-r3-cp1.diff`؛ گزارش‌ها: `*-r{دور}.md` (هر دور فایل جدید، قبلی‌ها نگه‌داری می‌شوند).
- مبنای هر دور همیشه **آخرین ZIP ساخته‌شده/دریافت‌شده** است.

## تاریخچه
b08–b10 (روی b07 شما): فونت محلی، ثبت‌نام/پرونده پرسنلی، مالی CRM، guardها، دور طراحی Solar Ember 2026 — جزئیات در HANDOFF.md
r10-cp8 → r11-cp9 (این دور): نسخه‌گذاری، guardها، مالی مطابق ماهیت CRM ویزیتور، پایش ویزیتور، ورود ۳D.
b02: پاکسازی (skills، پالت قدیم، Journey، مودال‌های مرده)، یکپارچه‌سازی مسیر رسید، شماره‌گذاری ترتیبی — جزئیات: CHANGES-r11-cp9_b03.md
b03: Guard در Settings/Cases/Campaigns/Knowledge، حذف fallback usr_admin در آن‌ها، Audit حذف قلم پیش‌فاکتور — جزئیات: CHANGES-r11-cp9_b03.md

- b11: ارزیابی پچ‌های پیوستی؛ پچ‌های پیشنهادی اعمال نشدند، جزئیات در افزوده b11 در `HANDOFF.md`.
- b12: اصلاح runner تست Node 22 و اضافه‌شدن financeRequests به `npm test`؛ رفع false-positive اسکریپت audit-actions؛ گزارش در `docs/history/r11/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r11-b12.md`.


---

### منبع ادغام‌شده: `docs/history/FRONTEND_ACTION_PERMISSION_AUDIT_r9.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# ممیزی اکشن‌ها، مسیرها و دسترسی‌ها — r9 / cp7

## دامنه و محدودیت
این ممیزی استاتیک روی کد فرانت‌اند است؛ جایگزین تست دستی همه نقش‌ها یا کنترل مجوز در API/DB نیست. چون برنامه فعلاً state محلی/IndexedDB دارد و بک‌اند احراز هویت متصل و قابل آزمون در این محیط موجود نیست، کنترل‌های فرانت‌اند به‌تنهایی مرز امنیتی قابل اتکا در برابر دست‌کاری کلاینت نیستند.

## اصلاحات اعمال‌شده
- `RBACService.getCurrentUser()` دیگر در نبود `currentUserId` یا کاربر غیرفعال، بی‌صدا اولین کاربر را انتخاب نمی‌کند.
- محدوده `BRANCH` و `TERRITORY` در نبود شناسه محدوده رکورد، به‌جای مجازکردن پیش‌فرض، رد می‌شود.
- محدوده `TEAM` دیگر از عضویت در گروه‌های گفتگو استنباط نمی‌شود؛ برای اجازه، `teamId` صریح روی کاربر و رکورد لازم است. فراخوانی‌هایی که `recordTeamId` نمی‌دهند عمداً رد می‌شوند تا مدل تیم فروش واقعی به caller متصل شود.
- `canAccessWorkspace()` برای داشبورد، وظایف، فعالیت‌ها، تقویم و گزارش‌ها قواعد صریح دارد و مقدار پیش‌فرض آن برای تب ناشناخته `false` است.
- مسیرهای حساس موجود در `App.tsx` به `canAccessWorkspace()` یا بررسی مجوز صریح وصل شدند؛ مسیر غیرمجاز به صفحه اصلی هدایت می‌شود.
- دسترسی چت به عضویت واقعی در گفتگو محدود شد؛ مدیر سیستم به‌دلیل نقش مدیریتی به‌طور ضمنی محتوای همه گفتگوهای خصوصی/گروهی را نمی‌بیند.
- ویرایش/حذف پیام علاوه بر شناسه پیام، گروه جاری و مالکیت فرستنده را دوباره بررسی می‌کند؛ حذف نرم زمان حذف را نگه می‌دارد.

## ماتریس مسیرهای متصل به guard
| مسیر | قاعده فرانت‌اند |
|---|---|
| `/dashboard` | `accounts.view` یا `finance.view` یا `internal.view` |
| `/accounts/*` | `accounts.view` |
| `/leads`, `/opportunities` | `leads.view` |
| `/quotes` | `quotes.view` |
| `/activities` | `accounts.view` یا `leads.view` |
| `/tasks` | `accounts.view` یا `internal.view` یا `internal.manage` |
| `/finance` | `finance.view` |
| `/cases` | `cases.view` |
| `/marketing` | `marketing.manage` |
| `/knowledge` | `knowledge.manage` |
| `/internal_automation` | `internal.view` یا `internal.manage` |
| `/calendar` | `accounts.view` یا `internal.view` |
| `/reports` | `accounts.view` یا `finance.view` یا `internal.view` |
| `/settings` | `settings.manage` یا `users.manage` یا `roles.manage` |
| `/groups` | `accounts.view` یا `internal.view` یا `internal.manage` |

`/` و `/profile` عمداً از این نگاشت خارج‌اند؛ `/command` و `/journey` دارای guard اختصاصی هستند. باید در مرحله بعد، مجوزهای مستقل مانند `tasks.view`, `groups.view`, `opportunities.view`, `calendar.view`, `reports.view` و مجوزهای عملیات CRUD/approve/assign/delete به مدل نقش افزوده شوند؛ فعلاً از مجوزهای موجود و نزدیک استفاده شده تا قرارداد فعلی شکسته نشود.

## چت: وضعیت عملیاتی قابل اثبات از کد
- موجود: فهرست گفتگوها، فیلترها، جستجو، پیام مستقیم/گروهی، پاسخ، منشن، پیوست محدود به 1.5MB، ارتباط پیام با رکورد، ساخت وظیفه از پیام، سنجاق، خوانده‌شدن، حذف نرم و ویرایش پیام توسط فرستنده.
- اصلاح‌شده در این دور: فیلتر عضویت گفتگو و بررسی مالکیت/گروه هنگام ویرایش یا حذف.
- هنوز تأییدنشده/ناقص برای ادعای «چت سازمانی کامل»: انتقال پیام بین چند دستگاه/کاربر، backend realtime، رسید تحویل/خواندن قابل اتکا، push واقعی، ضبط ویدئو/صوت، ذخیره امن فایل، سیاست retention و تست بار. state محلی مرورگر به‌تنهایی این موارد را اثبات نمی‌کند.

## اقدام‌های پرریسک و محدودیت‌ها
- نگهبان مسیر فرانت‌اند فقط کنترل UX است؛ API باید مجوز را مجدداً بررسی کند و SQL Server باید RLS/قیدهای رابطه‌ای را اجرا کند.
- `getFieldVisibility()` همچنان برای فیلدهای فاقد تنظیم صریح `DO` برمی‌گرداند تا فرم‌های فعلی ناخواسته ناپدید نشوند. این یک gap سیاستی است و باید پس از تعریف کامل field-permissionها و تست نقش‌ها به fail-closed ارتقا یابد.
- هیچ عملیات حساس حذف/تخصیص مالی نباید صرفاً به guard مسیر تکیه کند.


---

### منبع ادغام‌شده: `docs/history/r10/EXECUTION_STATE_r10.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# EXECUTION_STATE_r10
مبنا: AkhavanCRM-SolarEmber-r9-cp7.zip (اثبات‌شده) | هدف: AkhavanCRM-SolarEmber-r10-cp8

## اثبات مبنا
- zip r9 باز شد؛ ساختار flat (بدون پوشه ریشه).
- diff تجمیعی `r3-cp1-updated-r9.diff` روی سورس **cp1** (خروجی دور قبلی همین گفتگو) بدون خطا اعمال می‌شود و `diff -rq` با zip r9 برابر است. روی `audited-patch` (بدون تغییرات cp1) اعمال **نمی‌شود** (۲ فایل رد می‌شوند) → مبنای صحیح زنجیره = cp1.
- تعارض گزارش r9 با سورس: دیده نشد (rbac.ts/GroupsWorkspace مطابق گزارش).

## تکمیل‌شده
1. ماتریس مجوز روی RBACService + useCan + ۱۶۴ assertion پاس (tests/rbac.test.mjs).
2. Guard ۲۶ اکشن حساس (Tasks/Finance/Quotes/Customers/Leads/Opportunities/Internal/Chat).
3. چت: عضویت-محور، ویرایش/حذف مالکیت‌محور، Mention فقط اعضا، تبدیل پیام به وظیفه Idempotent.
4. SQL: سرشماری FK + فهرست ۵۷ کاندید (بدون Migration).

## تکمیل‌شده دور دوم
5. یادآوری ۷/۲/۰ + Escalation + recipientId اعلان (۲۲ تست). 6. مسیر رسید→تخصیص→ERP(NOT_CONFIGURED) (۲۹ تست). 7. orgPolicy (آستانه/سقف اعتبار). 8. قفل Snapshot. 9. بازیابی مخاطب. 10. فیلد fail-closed. 11. ورود ۳D + Warp. 12. PageToolbar/Skeleton/تایپوگرافی. 13. راستی‌آزمایی گزارش Gemini (جدول در گزارش).

## باقی‌مانده / ادامه از اینجا (نسخه قدیمی فهرست حذف نشده)
- یادآوری ۷/۲/۰ روز + Escalation (فقط اگر موتور موجود Scheduler ندارد: ثبت DEFERRED).
- مسیر رسید پرداخت→ERP: وضعیت‌ها + ضدتکرار؛ انتقال ERP = NOT_CONFIGURED.
- طراحی Solar Ember: فیلتر/جستجوی مشترک، فونت ورودی ۱۶px، کامپوننت‌ها.
- Guard باقی‌مانده: Customer360، Calendar، Activities، Cases، Settings.

## مسدود
SQL Server آزمایشی؛ backend/API؛ ERP؛ Scheduler/Push واقعی؛ Build/Lint (نبود node_modules و شبکه).

## تست‌های اجراشده (واقعی)
- npm test: rbac 170 + reminders 22 + policy 9 + receipt 29 PASS
- npm run audit:contracts: PASS (استاتیک)
- syntax transpile: 99 فایل، 0 خطا (نه type-check)
- اجرا نشده: tsc/lint/build، مرورگر، SQL، چت دو-حساب.

## ادامه پیشنهادی
اجرای `npm i && npm run lint && npm run build && npm test`؛ سپس: guardهای Calendar/Activities/Cases/Settings، UI قانون Workflow، تایید حذف مودال‌های مرده، تصمیم سیاست جریمه/قرارداد، فونت محلی، تست مرورگر shader.


---

### منبع ادغام‌شده: `docs/history/r10/FRONTEND_ACTION_PERMISSION_AUDIT-r10.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# FRONTEND_ACTION_PERMISSION_AUDIT-r10

> هشدار: همه کنترل‌های زیر **سمت کلاینت** هستند. در این معماری backend/API وجود ندارد؛ هیچ‌کدام جایگزین enforcement سمت سرور/RLS نیستند.

## موتور
`RBACService` (src/lib/rbac.ts) — بدون موتور دوم. افزوده‌ها: `PERMISSION_MATRIX` (۱۷ ماژول × ۷ عملیات)، `can(module, action)`، `canActOnRecord(module, action, record)`، `useCan` (src/hooks/useCan.ts).
- ترتیب تصمیم: کلید صریح `module.action` در permissionSet ← نگاشت موقت به CapabilityPermissionهای موجود (any-of) ← در غیر این صورت **رد**.
- `canActOnRecord`: مجوز عملیات + Tenant (ناسازگار/نامعلوم = رد) + رکورد حذف‌شده (فقط VIEW) + Scope (ORG/BRANCH/TERRITORY/TEAM/OWNER؛ داده ناقص = رد).
- چت: فقط عضویت واقعی؛ ویرایش فقط پیام خود؛ حذف نرم = پیام خود یا مدیر گفتگو؛ مدیر سیستم خودکار عضو/مدیر گفتگوی خصوصی نیست.

## نگاشت موقت (باید با تصمیم کسب‌وکار نهایی شود)
مجوزهای مستقل `tasks.*`, `groups.*`, `opportunities.*`, `calendar.*`, `payments.*` هنوز در `CapabilityPermission` تعریف نشده‌اند؛ تا آن زمان به نزدیک‌ترین مجوز موجود نگاشت شده‌اند (جدول در rbac.ts). افزودن کلید صریح در permissionSet بدون تغییر کد اثر می‌کند.

## اکشن‌های guard‌شده این دور
| ماژول | اکشن | مجوز |
|---|---|---|
| Tasks | ایجاد/باز کردن فرم | tasks.CREATE |
| Tasks | ویرایش، تغییر وضعیت | tasks.EDIT + Scope (مسئول/عضو گروه) |
| Tasks | ارجاع به دیگری | tasks.ASSIGN؛ مسئول غیرفعال رد می‌شود |
| Finance | پرداخت / فاکتور+چک / تعهد وصول | payments.CREATE / finance.CREATE / finance.EDIT |
| Quotes | صدور | quotes.CREATE |
| Quotes | درخواست تایید/پذیرش/رد | quotes.EDIT |
| Quotes | تایید و HANDOFF | quotes.APPROVE |
| Quotes | تبدیل به فاکتور | quotes.EDIT + finance.CREATE |
| Customers | ایجاد | accounts.CREATE |
| Leads | ایجاد / مرحله / تبدیل | leads.CREATE / leads.EDIT / leads.EDIT+accounts.CREATE |
| Opportunities | ایجاد / مرحله | opportunities.CREATE / EDIT |
| Internal | ثبت / تایید و رد | internal.CREATE / internal.APPROVE |
| Chat | ساخت گروه، مدیریت اعضا | groups.CREATE / groups.EDIT یا مدیر گروه |
| Chat | ویرایش/حذف پیام | messages.EDIT / SOFT_DELETE با عضویت و مالکیت |
| Chat | تبدیل پیام به وظیفه | tasks.CREATE (+ASSIGN)، عضویت مسئول، **Idempotent** (taskId روی پیام داخل updater) |
| Chat | Mention | فقط عضو فعال همان گفتگو (جلوگیری از افشای پیش‌نمایش پیام به غیرعضو) |
پس از رد: اعلان واقعی «دسترسی غیرمجاز» در مرکز اعلان (dedupe ۱۵ ثانیه‌ای).

## تست اجراشده
`node tests/rbac.test.mjs` → **PASS: ۱۶۴ assertion، ۱۱۹ ترکیب ماتریس**. پوشش: ۷ عملیات، ۵ Scope، کاربر غیرفعال/ناشناخته/نقش ناموجود، Tenant، رکورد حذف‌شده، چت (غیرعضو/مدیر سیستم/مالک پیام/مدیر گفتگو)، ترکیب‌های تعریف‌نشده = رد.
**اجرا نشده:** تست مرورگر نقش‌به‌نقش، دو-کاربر/دو-Tenant واقعی.

## افزوده‌های دور دوم
| ماژول | اکشن | مجوز |
|---|---|---|
| Customer360 | افزودن/ویرایش مخاطب | accounts.EDIT + Scope رکورد |
| Finance | تایید و تخصیص رسید | payments.ALLOCATE |
| Finance | بازگشت برای اصلاح | payments.APPROVE |
| Quotes | افزودن/حذف قلم/بسته | قفل `canEditQuoteLines` (Snapshot/غیر DRAFT) |
| Opportunities | دکمه‌های UI | `can()` |
| فیلد حساس | SecureField | `getFieldVisibility` (fail-closed در مجموعه پیکربندی‌شده) |
تست: rbac ۱۷۰ assertion PASS.

## شکاف‌های باقی‌مانده
- Guardها اکشن‌های Customer360 (Notes/Quotes/Tasks داخل پروفایل)، Calendar، Activities، Cases، Settings و حذف‌های داخل ماژول‌های کوچک را هنوز کامل پوشش نمی‌دهند (WORKING/PARTIAL مشخص نشده‌اند — نیازمند دور بعد).
- `getFieldVisibility` برای فیلد بدون تنظیم هنوز `DO` برمی‌گرداند (تصمیم r9 حفظ شد؛ ریسک ثبت شد).
- دکمه‌های UI بر اساس `can()` پنهان/غیرفعال نشده‌اند؛ فقط handler guard و اعلان دارند.


---

### منبع ادغام‌شده: `docs/history/r11/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r11-b12.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — ممیزی سورس و اصلاحات محدود r11-cp9 / b12

## 1) مبنا و نتیجه
- مبنای ممیزی: بسته دریافتی `AkhavanCRM-SolarEmber_r11-cp9_b11.zip` به‌همراه HANDOFF همان بسته.
- نسخه محصول: `0.11.0`؛ دور/چک‌پوینت: `r11/cp9`؛ این خروجی فقط شمارنده بسته را به `b12` می‌رساند.
- تغییر عملکردی محصول یا ماژول کسب‌وکار انجام نشد؛ دو اصلاح ابزار توسعه/ممیزی انجام شد.

## 2) اصلاحات اعمال‌شده
1. `package.json`: اجرای تست‌ها با `node --experimental-strip-types` برای سازگاری با فایل‌های `.ts` موقت مورد استفاده تست‌ها در Node 22؛ `tests/financeRequests.test.mjs` که وجود داشت اما از اسکریپت اصلی `npm test` جا افتاده بود، به زنجیره اضافه شد.
2. `scripts/audit-actions.mjs`: الگوی شناسایی handler اصلاح شد تا اعلان متغیرهایی مانند `assigneeType` را به‌اشتباه به‌عنوان handler تابع تشخیص ندهد. هیچ guard کسب‌وکاری حذف یا تضعیف نشد.

## 3) معماری مشاهده‌شده در 10 خط
1. UI فارسی/RTL با React 19 و Vite؛ پوسته و مسیرها در `src/App.tsx` و ناوبری در `src/lib/navigation.ts`.
2. طراحی Solar Ember و توکن‌های سراسری در `src/index.css`.
3. وضعیت برنامه با Zustand در `src/lib/storage.ts` نگهداری می‌شود.
4. ذخیره‌سازی محلی از IndexedDB در `src/lib/idb.ts` استفاده می‌کند و fallback به localStorage دارد.
5. `generateSeedData()` در مسیر integrity storage وجود دارد؛ باید داده‌های seed از داده عملیاتی واقعی تفکیک شوند.
6. منطق مجوز `src/lib/rbac.ts` و `src/hooks/useCan.ts` سمت کلاینت است؛ کنترل امنیتی سمت سرور وجود ندارد.
7. فرم پویا از `src/services/dynamicFormEngine.ts` و `src/components/shared/DynamicFormRenderer.tsx` استفاده می‌کند.
8. CPQ و گردش رسید/درخواست مالی موتورهای موجودند؛ نباید موتور موازی ساخته شود.
9. اسکریپت‌های SQL Server و قراردادهای Connector در مخزن وجود دارند، اما پیش‌نویس/قراردادی‌اند.
10. در این بسته Backend/API، اتصال runtime به SQL Server و اتصال واقعی ERP تأیید نشد؛ این موارد `NOT_CONFIGURED` هستند.

## 4) ماتریس ماژول و وضعیت

| ماژول | مسیرهای کلیدی | وضعیت | دلیل/مرز |
|---|---|---|---|
| پوسته و ناوبری | `src/App.tsx`, `src/lib/navigation.ts` | PARTIAL | مسیرها در کد موجود؛ مرورگر و build این دور قابل اجرا نبود |
| مشتری/Customer 360 | `src/components/CustomersWorkspace.tsx`, `Customer360.tsx` | PARTIAL | ذخیره‌سازی محلی؛ Backend تأیید نشده |
| پیش‌فاکتور/CPQ | `src/components/QuotesWorkspace.tsx`, `src/lib/cpqEngine.ts` | PARTIAL | پیش‌فاکتور با سفارش/فاکتور قطعی یکی نیست؛ یک مغایرت دامنه‌ای در UI هنوز در HANDOFF ثبت است |
| مالی و رسید | `FinanceWorkspace.tsx`, `src/lib/receiptFlow.ts`, `financeRequests.ts` | PARTIAL | جریان محلی و تست‌پذیر؛ ثبت ERP/مالی قطعی خارج از اتصال فعال است |
| RBAC | `src/lib/rbac.ts`, `src/hooks/useCan.ts` | PARTIAL | منطق کلاینت و آزمون واحد؛ امنیت سمت سرور نیست |
| فرم پویا | `src/services/dynamicFormEngine.ts`, `DynamicFormRenderer.tsx` | PARTIAL | موتور موجود؛ باید فرم‌ها و persistence هر مسیر جداگانه رگرسیون شوند |
| وصول مطالبات | `src/services/collectionEngine.ts` | PARTIAL | محاسبات/وظایف محلی؛ داده مرجع مالی ERP متصل نیست |
| یادآورها و اتوماسیون | `src/lib/reminders.ts`, `automation.ts`, `orgPolicy.ts` | PARTIAL | زمان‌بندی پایدار سمت سرور وجود ندارد |
| استخدام/پرونده | `src/lib/onboarding.ts`, `src/components/onboarding/*` | PARTIAL | ذخیره محلی؛ ثبت‌نام عمومی روی همان دستگاه، بدون هویت واقعی |
| SQL Server schema | `database/sqlserver/v1/*.sql` | PARTIAL | 7 اسکریپت draft؛ هیچ اجرای واقعی دیتابیس تأیید نشده |
| Backend/API و Auth واقعی | در مخزن endpoint اجرایی یافت نشد | NOT_CONFIGURED | هیچ اتصال runtime اثبات نشد |
| ERP/SMS/Scheduler سرور | `docs/integrations/*` قراردادها | NOT_CONFIGURED | قرارداد هدف هست؛ provider/credential/endpoint و health check واقعی نیست |

## 5) دیتابیس و مرز CRM/ERP
- در SQL draft جدول `crm.Account` موجودیت کانونیکال حساب/مشتری است؛ جدول مستقل `Customer/Customers` تعریف نشده و طبق تصمیم فعلی نباید موازی ساخته شود.
- `crm.Quote` پیش‌فاکتور است؛ فاکتور، پرداخت، تخصیص و بستانکاری در مدل پیشنهادی mirrorهای خواندنی از ERP/حسابداری هستند.
- مانده از view محاسبه می‌شود؛ جدول قابل‌ویرایش جداگانه برای مانده نباید اضافه شود.
- قراردادهای فعلی SQL Server و Connector فقط static/draft هستند؛ نسخه SQL Server، mapping واقعی schema ERP، RLS runtime، backup/restore و rollback هنوز نیازمند آزمون‌اند.
- پیش از اجرای هر migration: تأیید مالک داده، schema واقعی ERP، FKهای Tenant، نسخه SQL Server و آزمون دو Tenant و connection pooling الزامی است.

## 6) نتایج اجرای واقعی در این دور
- `npm test`: PASS پس از اصلاح اسکریپت؛ 6 فایل تست و 324 assertion گزارش‌شده.
- `node scripts/audit-actions.mjs`: `handlers(mutating)=58 guarded=58 unguarded=0` پس از رفع false-positive.
- `node scripts/audit-sqlserver-contracts.mjs`: PASS ایستا؛ 7 SQL files، 46 tables، 44 tenant-scoped، 44 RLS targets و 5 required views.
- `npm run lint`: NOT PASS / متوقف شد؛ `vite/client` type definitions موجود نیستند چون dependencies نصب نیستند.
- `npm run build`: NOT RUN successfully؛ دستور `vite` پیدا نشد چون dependencies نصب نیستند.
- مرورگر/Safari، اتصال SQL Server، RLS runtime، ERP و SMS: NOT_RUN.

## 7) ریسک‌ها و کار بعدی
1. اول نصب وابستگی‌ها در محیط توسعه و اجرای `npm run lint`, `npm run build`, `npm test`؛ رفع خطاها فقط بر اساس خروجی واقعی.
2. سپس تست بصری Safari/iOS برای Bottom Sheet، هاله و Swipe؛ بدون این مرحله، پیاده‌سازی UIهای با ریسک کامپایل مانند Split-View متوقف می‌ماند.
3. بعد از build موفق، تکمیل تدریجی DatePicker، Split-View، Morph/Toolbar و اتصال `useCountUp` با state واقعی.
4. مغایرت «صدور فاکتور قطعی در QuotesWorkspace» باید با مرز CRM/ERP حل شود؛ این دور آن را حذف نکرده است چون حذف قابلیت نیازمند تأیید صریح است.
5. `npm test` از Node experimental type stripping استفاده می‌کند؛ در صورت تثبیت محیط توسعه، می‌توان آن را به loader/compiler ثابت و سازگار با CI منتقل کرد.


---

### منبع ادغام‌شده: `EXTERNAL_AUDIT/AKHAVAN_CRM_FULL_MODULE_AUDIT_r11_cp9_b12.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — ممیزی جامع همه ماژول‌ها

- **مبنای بررسی:** `AkhavanCRM-SolarEmber_r11-cp9_b12(1).zip`
- **نسخه محصول:** `0.11.0` / `r11-cp9` / بسته `b12`
- **هدف:** تطبیق معماری، مستندات، UI، موتورهای منطق، مدل SQL و آزمون‌های موجود بدون حذف قابلیت.
- **دامنه تغییر این دور:** ممیزی و مستندسازی؛ فایل اجرایی محصول تغییر داده نشده است.

## 1. نتیجه مدیریتی

این بسته یک فرانت‌اند React/Vite نسبتاً گسترده با ذخیره‌سازی محلی Zustand + IndexedDB/LocalStorage، تعداد زیادی workspace، موتورهای دامنه و ۷ اسکریپت SQL Server پیشنهادی است. وجود schema یا قرارداد API، به معنی Backend، دیتابیس یا اتصال ERP عملیاتی نیست.

**وضعیت واقعی:**
- تست واحد: PASS، شش فایل تست، ۳۲۴ assertion.
- ممیزی ایستای اکشن‌ها: ۵۸ handler تغییردهنده شناسایی‌شده، ۵۸ guarded، صفر مورد بدون guard در خروجی اسکریپت.
- ممیزی ایستای قرارداد SQL: PASS؛ ۷ فایل SQL، ۴۶ جدول، ۴۴ جدول tenant-scoped، ۴۴ هدف RLS و ۵ view الزامی. این آزمون SQL را اجرا نمی‌کند.
- Lint/TypeScript: اجرا شد اما شکست خورد؛ `vite/client` نصب نیست.
- Build: اجرا شد اما شکست خورد؛ دستور `vite` در محیط نصب نیست.
- تست مرورگر/Safari/iOS، Backend، احراز هویت سمت سرور، SQL Server runtime/RLS، ERP، پیامک و Scheduler سرور: تأیید نشده / پیکربندی نشده.

## 2. ماتریس ماژول‌های محصول

وضعیت «موجود-محلی» یعنی مسیر UI و منطق فرانت‌اند دیده می‌شود، نه اینکه چندکاربره/سروری/متصل به ERP باشد.

| حوزه / ماژول | شواهد اصلی در سورس | وضعیت | شکاف یا آزمون لازم |
|---|---|---|---|
| پوسته، مسیرها و ناوبری | `src/App.tsx`, `src/lib/navigation.ts`, `src/components/Layout.tsx`, `Sidebar.tsx`, `NavigationDrawer.tsx` | موجود-محلی | تست route/access واقعی و مرورگر پس از نصب dependencies؛ احراز هویت سروری وجود ندارد |
| خانه | `HomeWorkspace.tsx` | موجود-محلی | صحت KPIها با داده مرجع و جلوگیری از نمایش داده seed به‌عنوان واقعی |
| داشبورد | `DashboardWorkspace.tsx`, `charts/*` | موجود-محلی | تطبیق تعریف KPI، scope، داده‌های seed و عملکرد در حجم بالا |
| مرکز فرماندهی | `CommandCenterWorkspace.tsx` | موجود-محلی | اثبات هر شاخص از داده معتبر؛ tenant/scope در سرور هنوز وجود ندارد |
| سرنخ‌ها | `LeadsWorkspace.tsx`, `dynamicFormEngine.ts` | موجود-محلی | تست تبدیل Lead→Account، تکراری‌بودن، audit و اتصال persistence |
| حساب‌ها/مشتریان | `CustomersWorkspace.tsx`, `Customer360.tsx` | موجود-محلی | Account/Customer canonical، ادغام تکراری، تاریخچه و scope باید رگرسیون شوند |
| فعالیت‌ها | `ActivitiesWorkspace.tsx` | موجود-محلی | صحت ارتباط فعالیت با حساب/کاربر و تاریخچه قابل‌ردیابی |
| فرصت‌ها/مذاکرات | `NegotiationsWorkspace.tsx` | موجود-محلی | تفکیک forecast از فروش قطعی و کنترل انتقال مراحل |
| پیش‌فاکتور و CPQ | `QuotesWorkspace.tsx`, `QuoteWizardModal.tsx`, `QuoteWizardModal`, `src/lib/cpqEngine.ts` | موجود-محلی؛ نیازمند اصلاح دامنه | Quote نباید با Order/Invoice یکی شود؛ snapshot قیمت، مجوز حاشیه سود، handoff و ثبت پاسخ ERP باید آزمون شوند |
| صدور فاکتور از Quote | `QuotesWorkspace.tsx`, `FinanceWorkspace.tsx` | ریسک دامنه‌ای | مسیر محلی ایجاد فاکتور با معماری مرجع که فاکتور قطعی را از سیستم مالی/ERP می‌گیرد هم‌راستا نیست؛ حفظ رفتار فعلی تا طراحی مسیر جایگزین امن، بدون حذف خام |
| مالی/وصولی | `FinanceWorkspace.tsx`, `receiptFlow.ts`, `financeRequests.ts`, `collectionEngine.ts` | موجود-محلی | منبع حقیقت مالی بیرونی متصل نیست؛ مانده، allocation، برگشتی، ابطال، ارز و sync باید با داده واقعی تست شوند |
| چک‌ها | `FinanceWorkspace.tsx`, `types.ts` | مدل/بخشی از UI موجود | چرخه واقعی چک صیادی، برگشتی و رویدادهای بانکی/ERP تأیید نشده |
| وظایف و پیگیری | `TasksWorkspace.tsx`, `TaskCard.tsx`, `reminders.ts` | موجود-محلی | زمان‌بندی سرور، SLA/escalation و اعلان چندکاربره عملیاتی نیست |
| تقویم | `CalendarWorkspace.tsx`, `jalali.ts` | موجود-محلی | آزمون منطقه زمانی، مرز روز شمسی/میلادی و sync چندکاربره لازم است |
| گروه‌ها/پیام‌ها | `GroupsWorkspace.tsx`, `collaboration.ts` | موجود-محلی | ارسال real-time، حضور/خوانده‌شدن چنددستگاهی، فایل و امنیت پیام سروری تأیید نشده |
| اعلان‌ها | `App.tsx`, `storage.ts`, `reminders.ts` | موجود-محلی | push/dispatch سروری و تضمین تحویل ندارند |
| موارد پشتیبانی/شکایت | `EnterpriseWorkspaces.tsx` → `CasesWorkspace` | موجود-محلی | گردش وضعیت، SLA، دسترسی رکورد و audit کامل end-to-end نیازمند تست است |
| کمپین/بازاریابی | `EnterpriseWorkspaces.tsx` → `CampaignsWorkspace`, `segments.ts` | موجود-محلی | اجرای کانال بیرونی، consent، ارسال واقعی و نتایج campaign پیکربندی نشده‌اند |
| پایگاه دانش | `EnterpriseWorkspaces.tsx` → `KnowledgeWorkspace` | موجود-محلی | جست‌وجو، انتشار، نسخه‌بندی و سطح دسترسی نیازمند تست رگرسیون |
| اتوماسیون/درخواست داخلی | `InternalAutomationWorkspace.tsx`, `automation.ts`, `internalAutomation.ts`, `useWorkflowEngine.ts` | موجود-محلی | پردازش درون‌مرورگر است؛ scheduler سروری، دوام صف و اجرای چند worker وجود ندارد |
| گزارش‌ها/تحلیل | `ReportsWorkspace.tsx`, `insights.ts`, `agents.ts`, `database/sqlserver/v1/004_analytics_semantic_layer.sql` | جزئی/محلی | semantic views پیش‌نویس‌اند؛ Power BI gateway، aggregate سمت سرور و صحت KPI با داده واقعی تأیید نشده |
| تنظیمات/سیاست سازمان | `SettingsWorkspace.tsx`, `orgPolicy.ts` | موجود-محلی | تغییر تنظیمات محلی است؛ اعمال سیاست امن در API/DB هنوز وجود ندارد |
| کاربران/نقش‌ها/RBAC | `rbac.ts`, `permissions.ts`, `useCan.ts`, `SettingsWorkspace.tsx` | منطق کلاینت موجود | RBAC کلاینت مرز امنیتی نیست؛ هر API آینده باید مجوز و scope را سمت سرور دوباره ارزیابی کند |
| ورود/Auth | `LoginWorkspace.tsx`, `AuthService.ts` | عمداً NOT_CONFIGURED | `authenticate()` تا اتصال provider واقعی fail-closed می‌ماند؛ SSO/session/password reset/MFA سمت سرور موجود نیست |
| استخدام/درخواست همکاری | `onboarding/*`, `onboarding.ts` | موجود-محلی | فرم عمومی و داده‌های متقاضی روی همان دستگاه ذخیره می‌شوند؛ محرمانگی، آپلود امن و پیامک سروری ندارند |
| پرونده پرسنلی/پروفایل | `PersonnelFilePage.tsx`, `ProfileWorkspace.tsx` | موجود-محلی | اسناد هویتی/بانکی نباید در ذخیره‌سازی مرورگر به‌عنوان راهکار نهایی بمانند؛ دسترسی و retention سروری لازم است |
| فرم پویا | `dynamicFormEngine.ts`, `DynamicFormRenderer.tsx` | موتور مشترک موجود | هر فرم عملیاتی باید از schema/validation/save/reload/audit/permission عبور کند؛ استفاده کامل در تمام فرم‌ها هنوز اثبات نشده |
| CPQ/سیاست قیمت | `cpqEngine.ts`, `orgPolicy.ts`, `tests/policy.test.mjs` | موتور موجود | به یک موتور پایبند بماند؛ سناریوهای مرزی مالی/تخفیف/هزینه معتبر و snapshot تأییدشده بیشتر لازم است |
| وصول هوشمند | `collectionEngine.ts` | موتور موجود-محلی | ورودی‌های مالی فعلاً مرجع ERP متصل ندارند؛ نتیجه فقط تا زمان اتصال، تحلیلی/محلی است |
| آفلاین و صف sync | `idb.ts`, `offline.ts` | زیرساخت محلی موجود؛ sync واقعی ندارد | handler سروری/connector ثبت نشده؛ retry و ID mapping بین reloadها و تعارض چنددستگاهی باید تست شوند |
| عامل هوش مصنوعی | `agents.ts`, `aiAdvisorService.ts` | پیشنهاد/شبیه‌سازی | اقدام بیرونی باید پشت approval، kill-switch و adapter واقعی باشد؛ اجرای provider واقعی تأیید نشده |
| چاپ/خروجی | `PrintLayouts.tsx`, `utils.ts` | بخشی از UI موجود | خروجی رسمی، شماره‌گذاری، امضا/بارکد و تطبیق نسخه چاپی با snapshot باید آزمون شود |
| فایل/پیوست | `AttachmentManager.tsx`, `types.ts` | محلی/فرانت‌اند | SQL فقط StorageKey هدف دارد؛ object storage امن، antivirus, access URL و retention پیاده‌سازی نشده‌اند |
| موجودی/انبار | جست‌وجوی workspace و SQL v1 | **ماژول مستقل یافت نشد** | وجود ExternalProduct mirror به معنی موجودی نیست؛ نیاز به منبع موجودی واقعی و قرارداد نگاشت دارد |
| خرید/تأمین‌کنندگان | جست‌وجوی workspace و SQL v1 | **ماژول مستقل یافت نشد** | جداول/صفحات تأمین‌کننده، سفارش خرید و دریافت خرید در نسخه فعلی یافت نشدند |
| توزیع/برنامه حمل/خودرو | جست‌وجوی workspace و SQL v1 | **ماژول مستقل یافت نشد** | ظرفیت خودرو، حواله، مسیر و هزینه توزیع نباید با داده ساختگی شبیه‌سازی شود؛ باید تعیین شود کدام داده در CRM mirror می‌شود |
| پیکربندی صنعت | `types.ts`, `orgPolicy.ts`, `SettingsWorkspace.tsx` | بخشی/نیازمند تطبیق | پروفایل GENERAL / FMCG_DISTRIBUTION و پیکربندی قابل فروش باید بدون hardcode اخوان کامل شود |

## 3. موتورهای زیرساختی و وضعیت آن‌ها

| موتور/زیرساخت | مسیر | ارزیابی |
|---|---|---|
| Zustand persistence | `src/lib/storage.ts` | وضعیت سراسری در مرورگر و integrity normalization؛ backend persistence نیست |
| IndexedDB/localStorage | `src/lib/idb.ts` | ذخیره‌سازی دستگاه؛ fallback محلی دارد، اما چندکاربره و منبع مرکزی نیست |
| RBAC | `src/lib/rbac.ts`, `useCan.ts` | منطق قابل آزمون سمت کلاینت؛ enforcement سمت API غایب است |
| فرم پویا | `src/services/dynamicFormEngine.ts` | schemaهای متعدد و validation مشترک وجود دارد؛ پوشش تمام فرم‌ها باید با inventory کنترل شود |
| CPQ | `src/lib/cpqEngine.ts` | موتور واحد موجود؛ از ساخت موتور موازی اجتناب شود |
| Collection | `src/services/collectionEngine.ts` | aging/risk/task logic محلی؛ وابسته به داده‌های مالی موجود در state |
| Reminders/SLA | `src/lib/reminders.ts` | محاسبه محلی؛ زمان‌بندی پایدار سمت سرور ندارد |
| Automation/Jobs | `src/lib/automation.ts`, `internalAutomation.ts` | صف و retry محلی؛ worker سرور و durable queue وجود ندارد |
| Workflow | `src/hooks/useWorkflowEngine.ts` | hook سمت کلاینت؛ اجرای سروری/قابل بازیابی تأیید نشده |
| Offline queue | `src/lib/offline.ts` | صف دستگاه؛ handler sync فعال در این بسته اثبات نشده است |
| Events/audit | `src/lib/events.ts`, `storage.ts` | رخدادهای محلی؛ audit مرکزی و غیرقابل‌دستکاری سروری نیست |
| Agents/AI | `src/lib/agents.ts`, `aiAdvisorService.ts` | برخی اقدام‌ها صریحاً NOT_CONFIGURED؛ provider/kill-switch سروری لازم است |
| تقویم جلالی | `src/lib/jalali.ts`, `utils.ts` | منطق تبدیل موجود؛ آزمون مرزی منطقه زمانی و DST لازم است |
| گزارش/KPI | `insights.ts`, `charts/*`, `database/sqlserver/v1/004_analytics_semantic_layer.sql` | UI و viewهای پیشنهادی؛ داده و semantic layer عملیاتی نیست |
| هویت | `src/services/AuthService.ts` | `authenticate()` همواره `NOT_CONFIGURED` برمی‌گرداند؛ به‌درستی ورود موفق ساختگی نمی‌سازد |

## 3.1. مغایرت‌های مستنداتی و فنی اضافی

- عنوان معماری از «۲۸ موتور» حرف می‌زند، اما فهرست همان سند تا شماره ۳۰ ادامه دارد؛ تعداد موتورهای تعریف‌شده باید در سند مرجع یکسان شود، بدون اینکه موتور موجود حذف یا موازی‌سازی شود.
- `express` در `package.json` به‌عنوان dependency آمده، اما در سورس، entrypoint اجرایی سرور، routeهای API یا اتصال SQL Server یافت نشد؛ وجود dependency به معنی Backend آماده نیست.
- dependency اختصاصی SQL Server در `package.json` دیده نمی‌شود؛ انتخاب driver/ORM/migration runner باید پس از تثبیت معماری و نسخه SQL Server انجام شود.
- فایل `bun.lock` وجود دارد ولی `node_modules` در بسته نیست. آزمون‌های واحد با Node 22 اجرا می‌شوند؛ برای Lint/Build باید محیط نصب وابستگی تکرارپذیر فراهم شود و lockfile با package manager منتخب هماهنگ بماند.
- `src/lib/storage.ts` در صورت نبودن آرایه‌های خاص، بخشی از ساختار را از `generateSeedData()` برمی‌گرداند. این integrity fallback باید با داده عملیاتی واقعی و migration نسخه‌دار تست شود تا داده seed به‌صورت ناخواسته به state عملیاتی وارد نشود.

## 4. مدل داده و SQL Server

۷ اسکریپت SQL در `database/sqlserver/v1/` وجود دارد. آن‌ها **طرح پیشنهادی** هستند، نه دیتابیس اجراشده. طبق مدل مرجع:
- `crm.Account` موجودیت کانونیکال حساب است؛ جدول Customer موازی نباید ساخته شود.
- `crm.Quote` با سفارش و فاکتور یکی نیست.
- فاکتور، ردیف فاکتور، پرداخت، تخصیص و بستانکاری باید از سیستم مالی/ERP تأییدشده mirror شوند.
- مانده از `analytics.vw_InvoiceBalance` محاسبه می‌شود، نه از جدول مانده قابل ویرایش.
- `analytics.vw_FactSalesLine` view تحلیلی است، نه فروش کپی‌شده.
- `ExternalProduct` به‌تنهایی مدل موجودی، انبار، تأمین‌کننده یا خرید را پوشش نمی‌دهد.
- RLS با `SESSION_CONTEXT` فقط در اسکریپت ارائه شده و runtime/security test ندارد.
- قراردادهای OpenAPI/Connector draft هستند؛ provider، credential، endpoint و health check واقعی پیکربندی نشده‌اند.

### شکاف‌های مهم مدل داده برای سه حوزه کسب‌وکار
1. فروش/مشتری: mapping واقعی Account/Contact/Lead/Opportunity/Quote به داده موجود و تصمیم درباره شناسه‌های خارجی لازم است.
2. مالی: قرارداد invoice/payment/allocation/credit/void/return/currency/cost باید با ERP واقعی تطبیق داده شود.
3. موجودی/خرید/تأمین‌کنندگان: schema فعلی mirror صریح stock balance/movement, supplier, purchase document/line, goods receipt یا warehouse ندارد؛ پیش از طراحی جدول جدید، schema سیستم منبع و مالکیت داده باید بررسی شود.

## 5. ریسک‌ها و اولویت اجرایی

### P0 — پیش از بهره‌برداری
1. نصب وابستگی‌ها در محیط توسعه و رفع تمام خطاهای TypeScript/build؛ تا آن زمان هیچ نسخه‌ای release-ready نیست.
2. احراز هویت و session سمت سرور، API و RBAC/ABAC سمت سرور؛ UI guard به‌تنهایی امنیت نیست.
3. تعیین سیستم مرجع مالی/ERP و قرارداد واقعی؛ عدم ایجاد فاکتور/پرداخت قطعی محلی به‌عنوان واقعیت حسابداری.
4. اجرای SQL در محیط staging، migration/rollback، RLS، tenant isolation، connection pooling، backup/restore و آزمون نفوذ مجاز.
5. تفکیک seed/demo از داده عملیاتی و جلوگیری از نمایش seed به‌عنوان داده واقعی.

### P1 — سه حوزه اصلی
6. تکمیل قرارداد داده فروش و مشتریان، شناسه خارجی، dedupe، مالکیت فیلد و sync قابل تکرار.
7. تکمیل مالی با PaymentAllocation به‌عنوان منبع تخصیص و تست مانده/ابطال/بستانکاری/ارز.
8. دریافت schema و قرارداد واقعی سیستم موجودی/خرید؛ سپس مدل‌سازی mirror و نماهای تحلیل، بدون ساخت سیستم انبار موازی.

### P2 — پایداری و تجربه کاربری
9. تست تمام routeها، فرم‌ها، دکمه‌ها، permission، persistence و audit در browser.
10. آزمون موبایل Safari/iOS، دسترس‌پذیری، reduced motion، blur/performance و بارگذاری فهرست‌ها.
11. تست idempotency/retry/dead-letter، conflict resolution، sync restart و نگاشت شناسه‌های موقت.
12. ثبت Changelog و Diff واقعی برای هر تغییر بعدی و اجرای regression suite کامل.

## 6. برنامه تست کامل برای ادامه

- **Static:** `npm run audit:contracts`, `node scripts/audit-actions.mjs`, typecheck, lint.
- **Unit:** `npm test` (در این محیط PASS: ۳۲۴ assertions).
- **Build:** `npm run build` (در این محیط اجرا شد ولی `vite` یافت نشد؛ نتیجه FAIL/NOT VERIFIED).
- **UI regression:** هر route در نقش CEO، Sales Manager، Supervisor و Visitor؛ مجوز SEE/DO/HIDDEN و scopeهای ORG/BRANCH/TERRITORY/TEAM/OWNER.
- **Persistence:** create/edit/reload/reopen tab، migration version، IndexedDB unavailable fallback، concurrent tabs.
- **Finance invariants:** allocation <= remaining balance، idempotent payment, void/reversal, credit note, duplicate receipt, cost coverage unknown ≠ zero profit.
- **Connector:** retry, duplicate webhook, invalid payload, dead-letter, out-of-order events, source-owned field conflict, tenant isolation.
- **SQL:** اجرای واقعی تمام ۷ اسکریپت در نسخه SQL Server هدف، rollback و تست دو Tenant.
- **Browser:** Safari iOS و desktop Chromium؛ reduced-motion، responsive، console/network errors.

## 7. قواعد تغییر بدون رگرسیون

- هیچ workspace، action، route، engine یا field حذف نشود بدون اثبات استفاده‌نشدن، impact analysis، migration و تأیید صریح.
- از موتور CPQ، فرم پویا، RBAC، collection، reminder، offline queue و audit موجود استفاده شود؛ موتور موازی ساخته نشود.
- UI و seed هیچ‌گاه جایگزین API/ERP واقعی معرفی نشوند.
- هر تغییر باید شامل Diff، changelog، تست قبل/بعد و وضعیت صریح PASS/FAIL/NOT RUN باشد.
- تا زمانی که سیستم منبع انبار/خرید و ERP واقعی مشخص نیست، آن بخش‌ها فقط به‌صورت شکاف/قرارداد قابل طراحی‌اند؛ نباید اطلاعات ساختگی وارد گزارش یا سودآوری شود.

## 8. جمع‌بندی

نسخه b12 دارای پوشش گسترده CRM در فرانت‌اند است، اما Backend/API/Auth واقعی، اتصال SQL Server/ERP، runtime RLS و حوزه مستقل موجودی/خرید/تأمین‌کننده در این سورس تأیید نشده‌اند. این ممیزی برای تعیین دقیق ادامه کار است و **به‌معنی تکمیل عملیاتی محصول نیست**. این دور کد محصول را تغییر نداده و قابلیت موجودی را حذف نکرده است.


---

### منبع ادغام‌شده: `EXTERNAL_AUDIT/AKHAVAN_CRM_AUDIT_RECONCILIATION_r11_cp9_b12.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# گزارش نهایی تطبیق و تثبیت ممیزی — AKHAVAN CRM r11 / cp9 / b12

**مبنای سورس:** `AkhavanCRM-SolarEmber_r11-cp9_b12(1).zip`  
**نسخه مقایسه‌ای:** `AkhavanCRM-SolarEmber_r11-cp9_b11.zip` و diff همراه  
**تاریخ اجرا:** 2026-10-25  
**وضعیت تغییر محصول:** هیچ فایل اجرایی محصول تغییر نکرده است. این سند فقط یافته‌های قابل‌اثبات را تثبیت می‌کند.

## 1. جمع‌بندی مدیریتی

b12 یک برنامه فرانت‌اند React/Vite با ماژول‌های واقعی، state و ذخیره‌سازی محلی، تست‌های واحد، موتورهای موجود و پیش‌نویس SQL Server/Connector است. این بسته هنوز به‌عنوان سامانه عملیاتی متصل به SQL Server یا ERP، دارای احراز هویت سروری، یا دارای صدور مالی قطعی قابل تأیید نیست.

**نتیجه ممیزی:** `PARTIAL — نیازمند تکمیل پیش از بهره‌برداری عملیاتی`، نه PASS صددرصدی.

## 2. تطبیق نسخه b11 با b12

مقایسه مستقیم پوشه‌های استخراج‌شده نشان داد:

- b11: تعداد 173 فایل؛ b12: تعداد 174 فایل.
- 4 مسیر موجود در هر دو نسخه تغییر کرده‌اند: `HANDOFF.md`، `VERSION.md`، `package.json`، `scripts/audit-actions.mjs`.
- یک فایل جدید به تاریخچه افزوده شده: `docs/history/r11/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r11-b12.md`.
- بنابراین 5 مسیر تغییرکرده/افزوده‌شده وجود دارد. در این diff تغییری در کامپوننت‌های عملیاتی فروش، مشتری، مالی یا سایر ماژول‌های محصول دیده نمی‌شود.
- این مقایسه فقط درباره b11 و b12 ارائه‌شده است و جایگزین تست رگرسیون رفتاری در مرورگر نیست.

## 3. آزمون‌های واقعاً اجراشده در محیط ممیزی

| بررسی | خروجی واقعی | تفسیر |
|---|---|---|
| `npm test` | PASS؛ شش فایل تست، مجموع 324 assertion | منطق‌های پوشش‌داده‌شده در تست‌ها موفق‌اند؛ این نتیجه build یا end-to-end نیست |
| `node scripts/audit-actions.mjs` | `handlers(mutating)=58 guarded=58 unguarded=0` | ممیزی ایستای handlerهای شناسایی‌شده؛ اثبات امنیت کامل نیست |
| `node scripts/audit-sqlserver-contracts.mjs` | PASS ایستا؛ 7 فایل SQL، 46 جدول، 44 جدول tenant-scoped، 44 هدف RLS، 5 view الزامی | فقط بررسی ایستا؛ هیچ SQL روی سرور اجرا نشده است |
| `npm run lint` | متوقف با `TS2688: Cannot find type definition file for 'vite/client'` | وابستگی‌های لازم در محیط حاضر نصب نیستند؛ نتیجه lint ناموفق/تأییدنشده است |
| `npm run build` | متوقف با `vite: not found` | build انجام نشده است |
| SQL Server / RLS / ERP / SMS / Scheduler / Safari | اجرا نشد | وضعیت runtime تأیید نشده است |

## 4. یافته‌های اولویت بالا

### P1 — تبدیل پیش‌فاکتور به فاکتور به دو مسیر محلی تقسیم شده

**شواهد:**
- `src/components/QuotesWorkspace.tsx`، تابع `handleConvertToInvoice`، مستقیماً رکورد را در `draft.invoices` درج می‌کند، مانده و `totalRevenue` حساب را افزایش می‌دهد و پیش‌فاکتور را به `ACCEPTED` تغییر می‌دهد.
- `src/components/FinanceWorkspace.tsx`، تابع `handleCreateInvoice` نیز مسیر جداگانه‌ای برای ساخت فاکتور محلی دارد.
- مدل پیشنهادی SQL در `docs/architecture/SQL_SERVER_DATA_MODEL_v1.md`، فاکتور و ردیف فروش را mirror خواندنی از ERP/حسابداری تعریف می‌کند؛ در مقابل، UI فعلی فاکتور محلی می‌سازد.

**خطر:** احتمال دو مسیر صدور، دوباره‌شماری مانده/درآمد، و نمایش سند محلی به‌عنوان فاکتور رسمی. در حال حاضر هیچ‌کدام از این دو مسیر به ERP متصل نیست.

**اقدام ایمن:** قابلیت‌ها حذف نشوند. پیش از تغییر رفتار باید مالکیت صدور فاکتور روشن شود. اگر ERP منبع رسمی است، دکمه/فرآیند باید به درخواست صدور و handoff قابل رهگیری تبدیل شود و فاکتور فقط پس از دریافت شناسه/سند معتبر ERP در mirror ظاهر شود. اگر فاکتور داخلی CRM مجاز است، باید صریحاً از «فاکتور رسمی ERP» تفکیک شود. تا روشن‌شدن این تصمیم، تغییر کد این مسیر متوقف می‌ماند.

### P1 — احراز هویت و مجوز سمت سرور پیکربندی نشده

- `src/services/AuthService.ts` طبق ممیزی موجود، `NOT_CONFIGURED` برمی‌گرداند.
- RBAC در `src/lib/rbac.ts` و `src/hooks/useCan.ts` سمت کلاینت اجرا می‌شود.
- `src/lib/storage.ts` وضعیت محلی را با `generateSeedData()` مقداردهی می‌کند.

**نتیجه:** برای توسعه/دمو قابل استفاده است؛ اما برای داده حساس چندکاربره، کنترل کلاینت جایگزین session امن و authorization سمت سرور نیست.

### P1 — Backend/API و اتصال runtime به SQL Server/ERP موجود یا اثبات‌شده نیست

- پوشه اجرایی backend/server و routeهای API در سورس پیدا نشد؛ وجود dependencyهایی مانند `express` به‌تنهایی backend قابل اجرا ایجاد نمی‌کند.
- قراردادهای `docs/integrations/*` و هفت اسکریپت `database/sqlserver/v1/*.sql` طرح/قرارداد هستند.
- `006_row_level_security.sql` و `007_preflight_validation.sql` جایگزین اجرای واقعی، آزمون tenant isolation، pooling، backup/restore و rollback نیستند.

### P1 — Build و lint تأیید نشده‌اند

خروجی‌های بالا را نمی‌توان به PASS تعبیر کرد. پس از نصب وابستگی‌ها در محیط توسعه، `npm run lint`, `npm run build`, `npm test` باید مجدداً اجرا و خروجی دقیق ثبت شود.

## 5. مغایرت‌های مستندات داخلی

1. `docs/architecture/AUDIT_REPORT_V1.md` ادعای `PASS - 100%` و موفقیت build/lint/runtime را مطرح می‌کند؛ این ادعاها با خروجی‌های قابل‌تکرار این ممیزی پشتیبانی نمی‌شوند. آن سند باید به‌عنوان گزارش تاریخی تلقی شود، نه وضعیت جاری معتبر.
2. تاریخ همان گزارش «پاییز ۱۴۰۳ (اکتبر ۲۰۲۶)» ناسازگار است؛ اکتبر ۲۰۲۶ با پاییز ۱۴۰۳ هم‌زمان نیست.
3. `AKHAVAN_CRM_ARCHITECTURE_FA.md` در عنوان از ۲۸ موتور یاد می‌کند، ولی فهرست آن تا شماره ۳۰ ادامه دارد. تعداد/مرزبندی باید به capabilityهای واقعی نگاشت شود، نه اینکه برای هر capability موتور مستقل جدید ساخته شود.
4. `MASTER_ARTIFACT_FA.md` چک‌لیست را با `[x]` علامت زده، درحالی‌که تست درگاه پیام‌رسان، kill-switch در محیط واقعی، SQL/ERP، تاریخ شمسی در همه مسیرها و آزمون‌های end-to-end در این ممیزی اجرا نشده‌اند.
5. سند `SQL_SERVER_DATA_MODEL_v1.md` صریحاً می‌گوید اسکریپت‌ها پیش‌نویس‌اند و در محیط تولید اجرا نشده‌اند؛ این یادداشت معتبرتر از هر ادعای اجرای قطعی در گزارش ممیزی قدیمی است.

## 6. قابلیت‌های موجودی که باید حفظ و بازاستفاده شوند

| قابلیت | مرجع موجود | سیاست |
|---|---|---|
| CPQ و قیمت‌گذاری | `src/lib/cpqEngine.ts` | همان موتور حفظ شود؛ موتور موازی ساخته نشود |
| فرم پویا | `src/services/dynamicFormEngine.ts`, `src/components/shared/DynamicFormRenderer.tsx` | گسترش همین قرارداد و رگرسیون فرم‌ها |
| گردش رسید/تخصیص | `src/lib/receiptFlow.ts` | مسیر واحد حفظ شود؛ تخصیص پرداخت منبع حقیقت باقی بماند |
| درخواست‌های مالی | `src/lib/financeRequests.ts` | برای درخواست/تأیید داخلی استفاده شود؛ ادعای ثبت ERP نکند |
| RBAC کلاینت | `src/lib/rbac.ts`, `src/hooks/useCan.ts` | حفظ شود؛ با کنترل سرور تکمیل شود، نه جایگزین |
| یادآور/اتوماسیون | `src/lib/reminders.ts`, `src/lib/automation.ts`, `src/hooks/useWorkflowEngine.ts` | همان موتورهای موجود توسعه یابند |
| ذخیره‌سازی محلی | `src/lib/storage.ts`, `src/lib/idb.ts` | تا زمان مهاجرت کنترل‌شده حفظ شود؛ مسیر آفلاین بی‌دلیل حذف نشود |
| UI و هویت بصری | `src/index.css`, `src/App.tsx`, اجزای فعلی | Solar Ember و RTL حفظ؛ bottom navigation طبق تصمیم قبلی معلق بماند |

## 7. ماتریس وضعیت حوزه‌ها

| حوزه | وضعیت | دلیل |
|---|---|---|
| فرانت‌اند/صفحات و ماژول‌ها | `PRESENT / PARTIAL` | کد و مسیرهای واقعی وجود دارند؛ مرورگر و build تأیید نشده‌اند |
| تست واحد | `PASS` | 324 assertion در شش مجموعه اجرا شد |
| مجوزهای handlerهای شناخته‌شده | `STATIC PASS` | 58/58 guarded؛ محدود به تحلیل ایستا |
| SQL schema و قراردادها | `DRAFT / STATIC PASS` | اسکریپت‌ها و قراردادها وجود دارند؛ اجرا نشده‌اند |
| Backend/API | `NOT_CONFIGURED` | runtime server/API اثبات نشد |
| Auth امن | `NOT_CONFIGURED` | سرویس واقعی هویت/جلسه و authorization سروری اثبات نشد |
| ERP/SMS/Scheduler | `NOT_CONFIGURED` | provider/credential/endpoint/health check واقعی وجود یا تأیید ندارد |
| Build/lint | `BLOCKED` | وابستگی‌های نصب‌نشده در محیط ممیزی |
| عدم رگرسیون UI در Safari/iOS | `NOT_RUN` | آزمون بصری/دستگاهی اجرا نشده |

## 8. ترتیب اجرای امن بعدی

### گام 0 — تثبیت مبنا (این گزارش)
- b12 به‌عنوان مبنای بررسی ثبت شد؛ کد محصول تغییر نکرد.
- نتایج واقعی تست و شکاف‌ها ثبت شدند.

### گام 1 — قرارداد دامنه و منبع حقیقت
- تعیین مالک صدور فاکتور قطعی: ERP یا CRM.
- تعیین سیستم‌های مرجع برای محصول، قیمت، موجودی، فاکتور، پرداخت، تخصیص، بستانکاری و برگشت.
- تعریف شناسه منبع، وضعیت sync، idempotency و سیاست داده کهنه/ناقص.

### گام 2 — محیط Backend و SQL Server
- تعیین نسخه/محیط SQL Server و runtime هدف؛ فراهم‌کردن migration runner و secret management.
- اجرای migration فقط در دیتابیس آزمایشی؛ آزمون rollback، tenant isolation، RLS، pooling و FKهای tenant.
- پیاده‌سازی API/Auth بر اساس قرارداد تثبیت‌شده؛ secrets هرگز در frontend یا جداول عمومی Connector قرار نگیرند.

### گام 3 — فروش و مشتریان
- نگاشت Account/Contact/Lead/Opportunity/Quote به مدل کانونیکال؛ حفظ `Quote ≠ Order ≠ Invoice`.
- اتصال handoff پیش‌فاکتور به outbox و ERP؛ رسیدن فاکتور از ERP با external identity map و upsert idempotent.

### گام 4 — مالی و خزانه‌داری
- mirror فاکتور/ردیف/پرداخت/تخصیص/بستانکاری؛ مانده از view مشترک، نه فیلد قابل ویرایش یا جدول دوم.
- تطبیق گردش رسید فعلی با قرارداد API؛ تست تخصیص جزئی، پرداخت تخصیص‌نیافته، برگشت و ابطال.

### گام 5 — انبار، موجودی، خرید و تأمین‌کنندگان
- فقط پس از تعیین منبع مرجع و قراردادهای واقعی؛ عدم ساخت انبار/موجودی موازی در CRM.

### گام 6 — رگرسیون و تحویل
- lint/build/tests، تست‌های API/DB، تست دو tenant، end-to-end مرورگر، Safari/iOS، بررسی دسترس‌پذیری/کارایی، diff و changelog نهایی.

## 9. مواردی که این ممیزی عمداً انجام نداد

- هیچ قابلیت یا دکمه‌ای حذف/غیرفعال نشد.
- هیچ کد محصولی تغییر نکرد.
- هیچ migration روی دیتابیس اجرا نشد.
- هیچ اتصال ساختگی به ERP، SMS، SQL Server یا Auth ایجاد نشد.
- هیچ مقدار مالی یا داده عملیاتی ساختگی به‌عنوان داده واقعی معرفی نشد.

**شرط عبور به پیاده‌سازی عملیاتی:** تصمیم مالکیت فاکتور و قراردادهای منبع داده تثبیت شود و محیط تست Backend/SQL Server فراهم باشد. بدون این دو، تغییر کد می‌تواند قابلیت موجود را ظاهراً حفظ کند اما صحت مالی و معماری را خراب کند.

## b16 — Seed پرحجم و نمای مالی/خزانه/هزینه
- نسخه محصول: `0.11.3` / `r11-cp9-b16`، بر پایه b15 و با حفظ فایل‌های قبلی.
- Seed دمو گسترش یافت: ۸۰ مشتری، ۲۴۰ پیش‌فاکتور، ۶۰ سفارش، ۱۲ برنامه پخش، ۲۴ برگشتی، ۴۸ فاکتور خرید، داده هزینه شش‌ماهه و داده بیشتر پرداخت/چک/ویزیت/فعالیت/تسک.
- FinanceWorkspace اکنون KPIهای مطالبات باز/معوق، هزینه پرداخت‌شده و نیاز نقدینگی برنامه‌ای چک‌های پرداختی ۷ روز آینده را نشان می‌دهد؛ نمودار روند ۶ ماهه و تب‌های «خزانه و سررسید» و «هزینه‌ها» اضافه شده‌اند.
- `npm test` و audit handlerها PASS با ۶۸/۶۸ handler محافظت‌شده؛ ۱۰۷ فایل TS/TSX بدون خطای syntax در transpile بررسی شدند.
- محدودیت: Build/lint و تست مرورگر واقعی هنوز تأیید نشده‌اند؛ گردش ثبت/پرداخت هزینه، دفتر بانک و تطبیق بانکی کامل نیستند. داده‌های `demo-*` آزمایشی‌اند.
