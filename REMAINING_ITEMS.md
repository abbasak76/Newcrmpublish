# REMAINING ITEMS — مرجع یکپارچه (b43)

## قابل‌حل در سورس / در حال انجام
- [ ] تکمیل منشن در فرم‌های اختصاصی که DynamicFormRenderer را دور می‌زنند؛ ممیزی صفحه‌به‌صفحه و ادغام فقط با همان موتور/قرارداد موجود.
- [ ] کارت پیش‌نمایش و مقصد واقعی برای همه انواع entity mention در چت؛ تأیید مسیرها و مجوز دسترسی.
- [ ] ممیزی چهار حالت Loading/Empty/Error/Success در همه صفحات.
- [ ] ممیزی فرم‌ها، جست‌وجوها، گریدها، فیلتر سریع، ناوبری کیبورد، کنتراست و target لمسی.
- [ ] آزمون واقعی موبایل، IndexedDB، reload و offline؛ افزودن virtualization پس از اندازه‌گیری.
- [ ] پوشش واحد برای همه مسیرهای ساخت/ویرایش تسک، SLA، ظرفیت، rollback و audit؛ ارزیابی SLA و پیشنهاد اقدام بعدی در b43 اضافه شد، ولی مسیرهای باقی‌مانده هنوز ممیزی کامل نشده‌اند.
- [ ] حذف نرم/چرخه عمر/تکرارناپذیری import به صورت سراسری و اثبات‌شده.
- [ ] تکمیل پنل استثناها و Next Best Action بر داده‌های موجود، با نمایش دلیل و کیفیت داده؛ پیشنهاد اقدام توضیح‌پذیر وظایف در b43 اضافه شد، اما مرکز استثناها و NBA سراسری هنوز باقی است.
- [ ] نقشه/heatmap فقط با مختصات معتبر؛ سیاست حریم خصوصی GPS و رضایت.
- [ ] progress پروفایل و onboarding با مراحل/فیلدهای واقعی.

## نیازمند تصمیم یا زیرساخت بیرونی — BLOCKED تا فراهم‌شدن
- [ ] قرارداد API و credential امن برای خواندن مانده، چک، برگشتی، فاکتور و سابقه ویزیت از ERP.
- [ ] ارسال دوطرفه CRM→ERP با idempotency، retry، reconciliation و تأیید sandbox؛ فعلاً انجام‌شده تلقی نشود.
- [ ] backend امن و اجرای RBAC/ACL سمت سرور؛ RBAC کلاینتی مرز امنیتی نیست.
- [ ] اجرای migrationهای SQL Server و آزمون واقعی RLS/tenant isolation در DB آزمایشی.
- [ ] cache سمت سرور با TTL/Redis و scheduler/worker برای SLA/escalation.
- [ ] provider نقشه، مختصات معتبر، matrix زمان سفر و محاسبه TSP/ETA واقعی.
- [ ] سرویس Push خارج برنامه: PWA/service worker یا native، مجوز کاربر، VAPID/APNs/FCM و سرور ارسال.
- [ ] درگاه پیامک و ایتا/روبیکا/واتساپ: حساب رسمی/API، کلید سرور، قالب، webhook و آزمون تحویل.
- [ ] انتخاب backend نهایی: SQL Server/بک‌اند فعلی یا Supabase؛ بدون تصمیم/backup مهاجرت ممنوع.
- [ ] دستیار هوشمند نیازمند API امن، سیاست داده و تأیید عملیات حساس.
- [ ] محاسبه سود واقعی نیازمند داده هزینه توزیع، تخفیف، برگشتی و وصول قابل اتکا.

## اعتبارسنجی انتشار
- [ ] `npm test` PASS در نسخه جاری.
- [ ] `npm run audit:contracts` PASS (استاتیک، نه runtime).
- [ ] `npm run build` PASS.
- [ ] `npm run lint` / TypeScript PASS.
- [ ] Browser E2E فرم، چت، ذخیره/بازیابی، reload و خطا PASS.
- [ ] تست موبایل و دسترس‌پذیری PASS.
- [ ] SQL Server/RLS و ERP end-to-end PASS در محیط آزمایشی.
- [ ] Push و پیام‌رسان‌ها با تحویل واقعی PASS.

## b45 — وظایف و پیگیری
- [x] تاریخچهٔ فعالیت محلی برای ایجاد، ویرایش/ارجاع، تکمیل و بازگشایی؛ نمایش آخرین رویداد در کارت.
- [ ] فرم مستقل ثبت مانع/نتیجه/اقدام بعدی با قواعد انتقال وضعیت و ثبت کامل فیلدهای outcome.
- [ ] پنل سراسری استثناها، تعهدات معوق و واگذاری‌های پذیرفته‌نشده با scope نقش.
- [ ] audit غیرقابل‌دستکاری سمت سرور و ثبت actor واقعی؛ تاریخچهٔ فعلی client-side است.
- [ ] تست Build/TypeScript و browser E2E در محیط دارای وابستگی‌ها.


## b46 update
- Task-level block/result/next-action workflow and blocked exception filter are now implemented in the source.
- Still open: server-authoritative audit, scheduler-based SLA escalation, notification delivery, cross-device sync, and broader cross-module exception center.


## b46 remaining items
- Server-authoritative immutable audit and actor identity; local IndexedDB activity is not tamper-resistant.
- Background SLA scheduler/escalation and cross-device task sync.
- Validate new workflow UI with full Vite/TypeScript build and browser regression once dependencies are available.
- Continue unified sales/collections/logistics planner, field evidence/offline sync, and end-to-end ERP document chain integration.

## b47 — تعیین تکلیف یکپارچه
- موارد قابل انجام در سورس مربوط به این انتشار در `RELEASE_EXECUTION_JOB_b47.md` ثبت و اجرا شدند.
- هیچ موردی در job بدون وضعیت نمانده است؛ ۱۲ مورد با وضعیت `BLOCKED_EXTERNAL` به محیط واقعی، وابستگی‌ها یا credential نیاز دارند.
- خطاهای تکرار import/state/modal/handler در پنل وظایف رفع و قراردادهای جلوگیری از بازگشت آن‌ها به تست اضافه شدند.
- صف استثناها اکنون تاریخ نامعتبر، مسئول مفقود، مانع بدون شرح و اولویت بالا بدون زمان‌بندی را نیز تشخیص می‌دهد.


## b48 — مرکز استثناهای عملیاتی
- [x] تجمیع استثناهای وظایف، مطالبات معوق، ریسک بالای وصول، چک برگشتی و وعده پرداخت سررسیدگذشته در یک صف خواندنی.
- [x] نمایش سطح اهمیت و اقدام پیشنهادی؛ وظایف از همان گردش کار موجود باز می‌شوند.
- [x] تست کامل `npm test` و ممیزی ایستای SQL اجرا و قبول شدند.
- [ ] Build و TypeScript به دلیل نبود `vite` و `vite/client` قابل تأیید نیستند.
- [ ] آزمون مرورگر/موبایل، اجرای واقعی SQL Server/RLS، ERP و ارسال اعلان هنوز به محیط معتبر نیاز دارند.


## b49 update — still open
- [x] Deterministic receivable aging with explicit reference date.
- [x] Invalid/missing due-date safety.
- [x] Explicitly broken collection promises included in the operational exception queue.
- [ ] Full production build and TypeScript verification after dependencies are installed.
- [ ] Runtime SQL Server/RLS, ERP, notification and multi-device/offline acceptance tests.
- [ ] Server-authoritative audit trail and background scheduler remain infrastructure-dependent.


## b50 — وضعیت پس از سخت‌سازی دسترسی مرکز استثناها
- [x] فیلتر سطح رکورد وظایف در مرکز استثناها.
- [x] محدودکردن استثناهای مالی به مجوز و scope مالی کاربر.
- [x] محدودکردن لیست به حساب فعال در context.
- [ ] ممیزی مجوزها در تمام صفحات و APIها؛ این تغییر فقط مرکز استثناهای TasksWorkspace را پوشش می‌دهد.
- [ ] امنیت قطعی سمت سرور، RLS واقعی، Build/TypeScript و آزمون مرورگر/موبایل.
- [ ] اتصال واقعی ERP، scheduler، اعلان‌ها و sync چنددستگاهی.

## b51 update — exception aggregation data quality
- [x] Exclude soft-deleted tasks from the exception queue via shared lifecycle helper.
- [x] Guard malformed collection profile rows, missing IDs, duplicate account rows and non-finite numeric amounts.
- [x] Add regression tests and pass the full configured test suite.
- [x] Static SQL contract audit passes (no database execution).
- [ ] Audit all page-level permissions and all record scopes.
- [ ] App-wide lifecycle/idempotency adoption and complete import reconciliation.
- [ ] Build/TypeScript/browser/mobile acceptance; dependencies are not available in this workspace.
- [ ] Live ERP/SQL Server RLS, server audit, scheduler, notifications and multi-device sync.

## Updated after b52
- [x] Reject malformed non-empty ERP source modification timestamps before upsert; add regression tests.
- [ ] Audit every ERP-owned field mapping and prevent accidental overwrite of CRM-owned fields by entity/field policy.
- [ ] Add backend/database unique constraints and distributed idempotency; client-tab serialization is not sufficient for multi-device concurrency.
- [ ] Complete app-wide permission and soft-delete adoption audit.
- [ ] Complete full browser/mobile E2E and build/typecheck after dependencies are installed.
- [ ] Execute SQL Server RLS/tenant isolation and ERP sandbox end-to-end tests.

## b53 source-surface audit additions
- [ ] تصمیم مستند درباره Progress/SearchableSelect/Skeleton و barrel بدون مصرف (ادغام یا حذف پس از بررسی UX).
- [ ] ورودی مدیریتی امن برای ERP import، پس از تعریف API/auth/idempotency/sandbox.
- [ ] اتصال صف offline به API همگام‌سازی واقعی، با conflict/retry/permission semantics.
- [ ] تعیین مالکیت و ادغام/حذف `taskAccessEngine` در کنار RBAC موجود؛ از دو منبع سیاست موازی جلوگیری شود.
- [ ] اتصال `ErpContextService` فقط پس از تعریف provider واقعی و سیاست stale data.
- [ ] اجرای build/lint، browser/mobile E2E، SQL Server/RLS و ERP sandbox در محیط دارای وابستگی و credentials.
