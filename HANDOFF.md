# HANDOFF — AKHAVAN CRM | برنامه اجرایی واحد و وضعیت واقعی (v1.0 / b55)

> **توجه الزامی برای تمام هوش‌های مصنوعی و مهندسان:**  
> پیش از انجام هر مأموریت و هرگونه تغییر در سورس، مطالعه سه سند مادر زیر الزامی است:
> 1. `INSTRUCTIONS.md` — قوانین دائمی رفتار، سلسله‌مراتب تصمیم‌گیری و خطوط قرمز توسعه.
> 2. `PROJECT_KNOWLEDGE.md` — دانش معماری محصول، مرزهای CRM/ERP، موتورهای CPQ، تسک و منشن.

## هدف و قواعد غیرقابل‌مذاکره
این سند مرجع واحد اجرای درخواست‌های کاربر است. پروژه باید یک CRM قابل‌استفاده، قابل‌ممیزی و قابل‌گسترش برای Customer360 و عملیات فروش/پخش باشد؛ نه ERP موازی. فاکتور رسمی، ثبت حسابداری، مانده قطعی و پرداخت ثبت‌شده مرجعشان ERP است. Quote با Order یکی نیست. تغییر افزایشی؛ بدون حذف قابلیت، موتور موازی، داده ساختگی یا دکمه تزئینی. Solar Ember، فارسی RTL، موبایل‌اول و دسترس‌پذیری حفظ شود.

## فهرست جامع خواسته‌ها و ترتیب اجرا
### 1. فرم‌ها، منشن و مرجع داده
- پیشنهاد مشتری، پرسنل، چک، فاکتور، کالا، تسک و پیش‌فاکتور فقط از رکوردهای محلی/آینه موجود.
- انتخاب پیشنهاد باید مرجع ساختاریافته `entityType/entityId/displayText/source` را ثبت کند؛ از ثبت تکراری یک مرجع جلوگیری شود.
- منشن باید در DynamicFormRenderer، فرم‌های اختصاصی، یادداشت‌ها، گفتگوهای مستقیم/گروهی و مسیرهای ساخت تسک از پیام پوشش داده شود.
- وضعیت منشن انتخاب‌شده، حذف/ویرایش متن و بازیابی داده آزمون شود؛ داده حساس در متن پیشنهادها افشا نشود.

### 2. چت عملیاتی
- منشن کارکنان و رکوردهای CRM/ERP mirror؛ کارت پیش‌نمایش هر موجودیت، برچسب منبع و اقدام/لینک مقصد معتبر.
- ساخت تسک از پیام باید ارتباط پیام، مشتری و مراجع منشن را حفظ کند و SLA/ظرفیت را اعمال کند.
- خطا، پیام حذف‌شده، متن خالی، آفلاین/ارسال ناموفق و مجوزهای چت باید حالت واضح داشته باشند.

### 3. عملیات، SLA و برنامه روزانه
- طبقه‌بندی/اولویت تسک، ظرفیت، پیشنهاد زمان و تفویض موجود؛ تکمیل همه مسیرهای ایجاد/ویرایش تسک.
- مرکز استثناها: هر هشدار باید علت، مالک، مهلت و اقدام بعدی داشته باشد.
- برنامه مشترک فروش/وصول/لجستیک با تفکیک مهارت، منطقه، شیفت و ظرفیت.
- مسیر واقعی TSP/ETA نیازمند مختصات و سرویس مسیر است؛ گروه‌بندی منطقه‌ای جایگزین نیست.
- SLA پس‌زمینه و escalation نیازمند scheduler/worker سمت سرور است.

### 4. چرخه معامله تا تسویه و سلامت مالی
- زنجیره قابل‌ردیابی Quote/مذاکره → شناسه سفارش ERP → فاکتور ERP → تحویل/مرجوعی → وصول/تخصیص → تسویه.
- تطبیق اختلاف‌ها و مالک/مهلت حل؛ CRM نباید سند مالی رسمی یا مانده موازی تولید کند.
- اعتبار و وصول بر مبنای داده واقعی ERP: سن بدهی، چک برگشتی، اختلاف، ریسک و اقدام پیشنهادی.
- سود مشتری/کالا/ویزیتور پس از تخفیف، برگشت، توزیع و وصول؛ هر خروجی برچسب واقعی/تخمینی/ناقص داشته باشد.

### 5. Next Best Action و دستیار عملیاتی
- پیشنهاد تماس، وصول، پیگیری چک، ویزیت، مذاکره مجدد یا توقف برای بررسی اعتبار؛ همراه دلیل قابل توضیح و داده منبع.
- دستیار چت فقط بر داده مجاز و قابل ردیابی؛ اقدامات حساس نیازمند تأیید صریح و API امن است.

### 6. عملیات میدانی و نقشه
- شروع/پایان ویزیت، نتیجه، چک‌لیست، مدرک، GPS با رضایت/سیاست روشن و صف همگام‌سازی آفلاین.
- نقشه نقاط مشتری، پوشش منطقه، نقشه حرارتی بر مبنای داده مکانی واقعی و فیلترها؛ نقشه بدون مختصات معتبر نباید داده جعلی نمایش دهد.

### 7. اعلان و ارتباط بیرونی
- پنل ارتباطی قابل‌استفاده از هر نقطه مناسب: پیامک، ایتا، روبیکا، واتساپ، اعلان داخل برنامه و Push خارج برنامه.
- قالب پیام، گیرنده، رضایت/مبنای ارسال، وضعیت صف/ارسال/تحویل/خطا و ممیزی لازم است.
- هیچ سرویس بیرونی بدون ارائه‌دهنده، API، کلید سمت سرور، webhook و تست واقعی «فعال» محسوب نمی‌شود. کلید محرمانه هرگز در فرانت‌اند نیست.
- اعلان وظیفه، مانده/سررسید، تغییر وضعیت، پرسشنامه استخدامی و تکمیل پروفایل باید از یک لایه مشترک استفاده کند، نه پیاده‌سازی‌های تکراری.

### 8. تجربه کاربری و دسترس‌پذیری
- ممیزی تمام صفحات، منوها، فرم‌ها، چت، جست‌وجو، جدول/گرید و فیلترهای سریع.
- چهار حالت Loading/Empty/Error/Success، خطاهای قابل اقدام، فوکوس کیبورد، نام دسترس‌پذیر، کنتراست، target لمسی حداقل مناسب و RTL.
- نوار پیشرفت پروفایل در مسیرهای تکمیل اطلاعات؛ مرحله بعدی و فیلدهای باقی‌مانده واضح.
- ژست‌ها فقط در نواحی بدون تداخل با اسکرول/دسترسی؛ swipe باید جایگزین دکمه قابل‌دسترسی نداشته باشد. haptics فقط در دستگاه پشتیبانی‌شده.
- مجازی‌سازی فهرست‌های حجیم فقط پس از بررسی اندازه داده و سازگاری وابستگی؛ حفظ optimistic updates با rollback و ثبت خطا.

### 9. امنیت، داده و چرخه عمر
- RBAC/ACL باید در مرز قابل‌اعتماد سمت سرور enforce شود؛ کنترل UI به‌تنهایی امنیت نیست.
- soft-delete، audit trail، جلوگیری از import تکراری، صحت تخصیص پرداخت و tenant isolation باید آزمون شوند.
- SQL Server/RLS و migrationها باید در محیط تست واقعی اجرا شوند؛ audit استاتیک اثبات امنیت اجرایی نیست.

### 10. یکپارچه‌سازی و انتشار
- تصمیم backend: SQL Server/بک‌اند فعلی یا Supabase فقط پس از بررسی کد، نیازها و تصمیم مالک؛ مهاجرت بدون تصمیم و backup ممنوع.
- ERP دوطرفه: قرارداد هر endpoint، idempotency، mapping، retry/dead-letter، reconciliation و ثبت نتیجه. هیچ ارسال به ERP بدون قرارداد/اعتبارنامه واقعی ادعا نمی‌شود.
- تست واحد/قراردادی، build، typecheck/lint، مرورگر E2E، IndexedDB reload/offline و آزمون موبایل.
- Zod/React Hook Form/virtualization تنها پس از بررسی سازگاری؛ dependency بدون lockfile، build و تست تکمیل نیست.

## نقشه راه کم‌فاز (۳ فاز)
### فاز 1 — بستن شکاف‌های قابل‌حل در سورس (این انتشار و ادامه بعدی)
منشن در چت/فرم‌ها، کارت‌های ارجاع، مسیرهای تسک، حالت‌های UI و دسترس‌پذیری، ممیزی صفحات و فیلترها، گزارش آزمون‌ها. معیار پایان: تست‌های مربوط PASS، Build/typecheck PASS، گزارش تغییر و فهرست دقیق اقلام مسدود.
### فاز 2 — هوشمندی عملیاتی و میدانی (طبق ترتیب اجرایی کاربر)
تکمیل اتصال درون‌سورس سفارش تا تسویه، اعتبار/وصول، Next Best Action توضیح‌پذیر، برنامه‌ریز، ویزیت و صف آفلاین، نقشه و گزارش سودآوری با برچسب کیفیت/منبع داده. قابلیت‌های نیازمند داده واقعی باید صریحاً ناقص/غیرقابل محاسبه بمانند؛ مسیر تقریبی منطقه‌ای نباید به‌جای ETA واقعی معرفی شود. معیار پایان: تست end-to-end با sandbox/اعتبارنامه و ثبت شواهد؛ وجود adapter به‌تنهایی کافی نیست.
### فاز 3 — اتصال امن زیرساخت واقعی
API/backend، RBAC/ACL سمت سرور، ERP دوطرفه، SQL Server/RLS، cache پایدار، scheduler، پیامک/پیام‌رسان‌ها و Push. معیار پایان: تست end-to-end با sandbox/اعتبارنامه و ثبت شواهد؛ وجود adapter به‌تنهایی کافی نیست. معیار پایان: سناریوهای واقعی، کیفیت داده و توضیح‌پذیری خروجی.

## وضعیت جاری b45
- نسخهٔ جاری: `0.12.19 / r11-cp9-b45-task-activity-trail`؛ مبنا b44.
- تغییر b45: تاریخچهٔ فعالیت محلی برای چرخهٔ وظیفه و نمایش آخرین رویداد؛ جزئیات در `CHANGELOG_b45.md` و `TEST_RESULTS_b45.md`.
- آزمون‌ها و مرزهای انتشار در `TEST_RESULTS_b45.md` ثبت شده‌اند؛ Build/Lint همچنان به‌علت نبود وابستگی‌ها مسدود است.

## وضعیت جاری b43
- پایه: b41 (`0.12.15`); b42 پوشش جست‌وجوی منشن ساختاریافته را به فرصت‌ها، پرونده‌ها، درخواست‌های داخلی و انبارها توسعه داده و مقصد انبار را به فضای عملیات وصل می‌کند. آزمون‌های قرارداد و موتور منشن به‌روزرسانی شده‌اند.
- هر موردی که به سرویس/کلید/محیط بیرونی نیاز دارد در `REMAINING_ITEMS.md` به‌صورت BLOCKED ثبت می‌شود؛ نباید به‌عنوان انجام‌شده گزارش شود.
- تحویل هر فاز: کد، تست، `CHANGELOG_PHASE_N.md`, `PHASE_N_EVIDENCE.md`, `TEST_RESULTS_bNN.md`, به‌روزرسانی این فایل و اقلام باز.

## معیار نهایی «آماده بهره‌برداری»
فقط زمانی اعلام شود که build و typecheck/lint، مرورگر/IndexedDB، تست موبایل و دسترس‌پذیری، SQL Server/RLS، ERP end-to-end و اعلان‌های بیرونی در محیط واقعی PASS باشند. تا پیش از آن وضعیت را دقیقاً «سورس آماده اعتبارسنجی محیطی» بنویسید.


## وضعیت جاری b45
- نسخهٔ جاری: `0.12.19 / r11-cp9-b45-task-activity-trail`؛ مبنا b44.
- تغییر b45: تاریخچهٔ فعالیت محلی برای چرخهٔ وظیفه و نمایش آخرین رویداد؛ جزئیات در `CHANGELOG_b45.md` و `TEST_RESULTS_b45.md`.
- آزمون‌ها و مرزهای انتشار در `TEST_RESULTS_b45.md` ثبت شده‌اند؛ Build/Lint همچنان به‌علت نبود وابستگی‌ها مسدود است.

## وضعیت جاری b43 — وظایف و پیگیری
- `src/services/taskIntelligence.ts` اکنون ارزیابی SLA، اقدام بعدی توضیح‌پذیر و رتبه‌بندی توجه را دارد.
- `TaskCard` وضعیت مهلت و اقدام پیشنهادی/علت را نشان می‌دهد؛ هیچ ارجاع، اعلان یا escalation خودکاری انجام نمی‌شود.
- آزمون `tests/taskSlaActions.test.mjs` به `npm test` اضافه شده است.
- گام بعدی: ممیزی همه مسیرهای ایجاد/ویرایش/تبدیل پیام به تسک، ثبت تاریخچه تغییر و نتیجه، پنل استثناها، دسترسی و پیوندهای مرتبط. سپس برنامه مشترک فروش/وصول/لجستیک.
- ارزیابی SLA فعلاً هنگام نمایش محاسبه می‌شود؛ اجرای زمان‌بندی‌شده و اعلان قطعی تا زمان آماده‌شدن worker سمت سرور انجام‌شده محسوب نمی‌شود.


## الحاقیهٔ اجرایی b44 — صف اولویت‌بندی و تریاژ SLA
- صف اصلی وظایف از مرتب‌سازی صرف بر اساس تاریخ سررسید به موتور موجود `rankTasksForAttention` متصل شد.
- شمارنده‌های «مهلت گذشته»، «در آستانه تأخیر» و «بدون مهلت معتبر» و فیلترهای قابل‌فعال/غیرفعال‌سازی به فضای وظایف اضافه شد.
- فیلتر فعال با `aria-pressed` مشخص است و امکان پاک‌کردن فیلتر وجود دارد.
- این منطق client-side است؛ زمان‌بندی پس‌زمینه، اعلان و ارجاع خودکار هنوز ادعا نمی‌شود.
- شواهد: `CHANGELOG_b44.md`, `TEST_RESULTS_b44.md`, `tests/taskTriageWorkspaceContracts.test.mjs`.

## الحاقیهٔ اجرایی b45 — تاریخچهٔ فعالیت وظایف
- helper مشترک `src/services/taskActivity.ts` رویدادهای ایجاد، ویرایش، ارجاع، تکمیل و بازگشایی را به تاریخچهٔ همان وظیفه اضافه می‌کند؛ event ID تکراری دوباره ثبت نمی‌شود.
- کارت وظیفه آخرین رویداد، زمان، خلاصه و تعداد رویدادها را نمایش می‌دهد.
- تاریخچه در این مرحله در state محلی است؛ audit تغییرناپذیر سمت سرور و همگام‌سازی چنددستگاهی جزو فاز زیرساخت امن است.
- شواهد: `CHANGELOG_b45.md`, `TEST_RESULTS_b45.md`, `tests/taskActivity.test.mjs`.


## b46 continuation — Task workflow and exceptions
- Implemented validated task transitions: start, block with required reason, unblock, complete with required result, reopen, and result-only updates.
- Added workflow panel on task cards and blocked-task triage filter/counter.
- Uses existing `taskActivity` local event trail; no duplicate engine introduced.
- See `CHANGELOG_b46.md` and `TEST_RESULTS_b46.md`.
- Remaining: server-authoritative audit/actor identity, scheduler/background escalation, exception center across all operational entities, backend synchronization, and full browser/SQL/ERP E2E verification.


## Increment b46 — task workflow and exception queue
Task cards now expose a workflow panel with guarded state transitions, mandatory block reason/completion result, result and next-action fields, and recent activity history. Task workspace exposes an exception queue for blocked, overdue, unscheduled and unassigned work. These are local client-side operations; server-authoritative audit, scheduled escalation and cross-device sync remain infrastructure work.

## b47 — ادامه بده تغییرات را، یکپارچه‌سازی و تثبیت
- نسخه: `0.12.21` / `r11-cp9-b47-integrated-stabilization`.
- رفع regressionهای ناشی از ادغام b46 در `TasksWorkspace.tsx`: import/state/modal/handler/function تکراری حذف شد.
- صف استثناها کیفیت داده را بهتر بررسی می‌کند: مهلت نامعتبر، مسئول نامشخص، مانع بدون شرح و اولویت بالا بدون برنامه.
- آزمون‌های گردش کار توسعه و تست قرارداد رابط به suite اضافه شدند.
- گزارش اجرای ۱۲ فاز و ۷۲ کار در `RELEASE_EXECUTION_JOB_b47.md` است.
- تست Node و ممیزی SQL ایستا اجرا می‌شوند؛ Build/TypeScript به دلیل نبود وابستگی‌ها در این محیط مسدود است.
- اتصال ERP، SQL Server runtime/RLS، push، audit سمت سرور و sync چنددستگاهی تا اجرای محیط واقعی تأیید نشده‌اند.


## Latest release b48
- Version `0.12.22`, label `r11-cp9-b48-operational-exception-center`.
- Unified read-only operational exception queue integrated into Tasks Workspace; it reuses existing task workflow and collection profile calculations.
- Full `npm test` PASS; `npm run audit:contracts` PASS (static only).
- Build/Lint blocked because Vite dependencies are not installed in this worktree; runtime integrations remain unverified.
- Start next work from b48; do not treat collection exceptions as ERP write operations.


## b49 — Collection determinism and broken promises
- Version `0.12.23`, label `r11-cp9-b49-collection-determinism`.
- Collection aging now accepts an explicit reference date and uses calendar-day boundaries; invalid/missing dates safely return zero.
- The operational exception center includes promises explicitly marked `BROKEN`.
- New regression coverage: `collectionDeterminism.test.mjs`; expanded operational exception coverage.
- Remaining external gates: browser build/TypeScript with dependencies installed; SQL Server runtime/RLS; ERP and notification integration; device/offline E2E.


## b50 — Exception visibility hardening
- Task exception cards are filtered through existing `tasks.VIEW` record scope.
- Collection/financial exception cards require `finance.VIEW` plus account record scope.
- Active account context limits the exception list.
- Added `tests/operationalExceptionAccessContracts.test.mjs`.
- Client-side RBAC remains non-authoritative; backend enforcement and SQL Server RLS remain open.
- See `RELEASE_EXECUTION_JOB_b50.md` and `TEST_RESULTS_b50.md`.

## b51 handoff — operational exception data quality
- Release: `r11-cp9-b51-exception-data-quality` (`0.12.25`).
- Exception aggregation now ignores soft-deleted tasks and malformed/duplicate collection profiles; amounts are guarded against non-finite values.
- Added `tests/operationalExceptionDataQuality.test.mjs` and completion evidence in `COMPLETION_MATRIX_b51.md`.
- `npm test` and `npm run audit:contracts` pass. Build/lint and runtime integration remain unverified due to missing dependency/runtime setup.

## b52 handoff — ERP import timestamp guard
- Version: `0.12.26` (`r11-cp9-b52-erp-import-timestamp-guard`).
- Import planner rejects malformed non-empty `sourceModifiedAtUtc` values as conflicts; tests assert no insert or state mutation.
- `npm test`: PASS. `npm run audit:contracts`: PASS (static-only).
- `npm run build`: BLOCKED (`vite: not found`). `npm run lint`: BLOCKED (`vite/client` unresolved).
- See `CHANGELOG_b52.md`, `TEST_RESULTS_b52.md`, `COMPLETION_MATRIX_b52.md`.

## b53 — Source surface audit
- نسخه 0.12.27؛ گزارش: `SOURCE_AUDIT_REPORT_b53.md`.
- ممیزی گراف import: 129 فایل منبع، 121 قابل دسترس استاتیک، 8 کاندیدای بدون مسیر.
- موتورهای ERP import، ERP context، offline queue و task access در گزارش به‌عنوان موارد فاقد اتصال کامل/ورودی UI بررسی شده‌اند؛ اتصال ساختگی انجام نشده است.
- تست‌های جدید: `tests/sourceSurfaceAudit.test.mjs`؛ فرمان: `npm run audit:source`.


## b54 backend API foundation continuation
- Release: `0.12.30` / `r12-cp10-b54-transactional-account-outbox`, based on the supplied b54 source bundle.
- Added Express API entry point, health/readiness routes, HMAC bearer-token primitives, scrypt password verification, tenant-context transaction helper, permission-guarded account read endpoint, SQL migration 013, and backend security contract test.
- `npm test`, `npm run audit:contracts`, and `npm run audit:source` are required checks for this continuation.
- This is not a production-ready backend: SQL Server runtime/RLS, browser build/lint, ERP sandbox, durable rate limiting, token revocation, full audit writes, outbox worker, and frontend migration remain unverified/open.

## b55 — اصلاح ساختاری پوسته، هدر معلق سراسری و نوار ناوبری کپسولی
- رفع زردی زمینه: انتقال پالت اصلی به سفید مرواریدی/اسلیت تمیز (`#F8F9FA` / Slate خنک) و اصلاح هاله‌های نوری Aurora به سمت آبی اقیانوسی، رز محو و بنفش ملایم.
- حذف کامل دکمه شناور FAB (`se-add-capsule` و `se-action-panel`) و واگذاری ساخت رکوردها به دکمه‌های درون‌صفحه‌ای (Inline Action Buttons).
- پیاده‌سازی هدر معلق شیشه‌ای سراسری (`se-floating-header`) با حاشیه‌های منحنی نرم، بلور ایمن و عبور روان محتوا از زیر هدر.
- پیاده‌سازی نوار ناوبری کپسولی ۴ تایی سبک اینستاگرامی با تراز بهینه و حاشیه امن استاندارد پایین صفحه (`safe-area-inset-bottom`).
- رفع تله اسکرول در شناسنامه مشتری (`Customer360.tsx`) با حذف `h-full` و کانتینر اسکرول تودرتو جهت اسکرول طبیعی کل صفحه.
- بهبود تم تیره در دراور ناوبری (`NavigationDrawer.tsx`) و چیدمان منظم کنترل‌ها و اطلاعات نگارش.
- اعتبارسنجی: پاس‌شدن کامل ۴۶ سوئیت تست (`npm test`)، ساخت موفق بدون خطای پکیج (`compile_applet`) و اجرای پایدار سرور روی پورت ۳۰۰۰.

## b56 — Batch B0 (پاکسازی ساختار)، Batch B1 (طراحی پوسته D1-D31) و موتور پیش‌بینی ریزش مشتری (بخش 3.4.3)
- **پاکسازی ساختاری و خطوط قرمز (Batch B0):**
  - حذف دائمی `AGENTS.md` طبق بند Z1 و پاکسازی کلیه ارجاعات به آن در اسناد راهنما.
  - انتقال ۱۵۳ فایل غیرضروری `*.patch` و گزارش‌های قدیمی به پوشه آرشیو `_cleanup_archive/` و ایجاد مانیفست رسمی `/docs/CLEANUP_MANIFEST.md` (بند Z6).
  - اصلاح مسیر ایمپورت در `tests/domainIntegrationContracts.test.mjs` به آرشیو مرجع بدون ایجاد شکست در تست‌ها (بند Z5).
  - راستی‌آزمایی اینونتوری ماژول‌ها (`/docs/FEATURE_INVENTORY.md`) و ممیزی مقادیر هاردکد (`/docs/HARDCODE_MOCK_AUDIT.md`) (بند Z7).
- **ارتقای پوسته و سیستم طراحی (Batch B1 / D1–D31):**
  - تقویت Scrim و محوشدگی هدر معلق (`#ttl`) با شفافیت ۹۵٪ و Blur عمیق جهت جلوگیری از تداخل متن پس‌زمینه با عنوان صفحه (D1).
  - افزایش فاصله امن انتهای کانتینر اسکرول اصلی (`pb-[calc(var(--safe-bottom)+104px)]`) و اعمال کلاس `no-scrollbar` جهت ممانعت از هم‌پوشانی کارت‌ها با نوار ناوبری پایین (D3, D26).
  - تقویت افکت شیشه‌ای نوار ناوبری ۵گانه اینستاگرامی با تاری ۲۰ پیکسل و تنظیم حداقل ارتفاع لمسی ۴۴ پیکسل برای تمام کلیدهای تعاملی (D5, D29).
  - اصلاح محدودیت عرض پنل دراور همبرگری (`.dr .pn`) به حداکثر ۴۰٪ نمایشگر در تبلت و دسکتاپ (`min(85vw, 380px)`) با آکاردئون‌های تفکیک‌شده (D30, D31).
- **موتور هوش تحلیلی پیش‌بینی ریزش مشتری (بخش 3.4.3):**
  - توسعه سرویس تحلیلی اختصاصی `src/services/churnPredictionService.ts` با محاسبه امتیاز ۰ تا ۱۰۰ و سطوح ریسک (`کم`، `متوسط`، `زیاد`، `بحرانی`) بر اساس کهنگی سفارش، فاصله آخرین فعالیت، کهنگی مطالبات معوق، چک‌های برگشتی و افت حجم خرید.
  - تعبیه کارت تحلیلی پیش‌بینی ریزش در شناسنامه مشتری (`Customer360.tsx`) همراه با دلایل کلیدی، راهکارهای پیشنهادی و دکمه تک‌کلیکه ایجاد وظیفه پیشگیری از ریزش (Retention Task).
  - تعبیه ویجت نظارت بر ریزش پرتفوی در داشبورد مدیریتی (`DashboardWorkspace.tsx`) با شمارنده‌های تفکیکی و لیست ۳ مشتری نیازمند مداخله فوری.
- **اعتبارسنجی:**
  - ۴۷ سوئیت تست خودکار با موفقیت کامل پاس شدند (۱۹۵+ اعتبارسنجی بدون خطا).
  - کامپایل بدون خطا و بیلد تمیز (`compile_applet`).

## b57 — سیستم تور آموزشی و راهنمای تعاملی (Interactive Tour) و معماری ناوبری B2
- **موتور مرکزی راهنمای تعاملی (`src/services/tourEngine.ts`):**
  - پیاده‌سازی زیرساخت مرکزی و ماژولار آموزش گام‌به‌گام برای ۷ حوزه عملیاتی (پوسته سراسری، داشبورد، مشتریان، پیش‌فاکتور، مالی، عملیات، وظایف).
  - تفکیک هوشمند گام‌های آموزشی بر اساس نقش و سطح دسترسی کاربر (مدیر سیستم، مدیر فروش، کارشناس مالی، ویزیتور و پخش).
  - پشتیبانی از قابلیت‌های رد کردن (Skip)، مکث (Pause)، ادامه (Resume) و ریست وضعیت آموزش‌ها در `localStorage`.
  - ایجاد قابلیت «تازه‌های نگارش (What's New)» برای اطلاع‌رسانی قابلیت‌های جدید (مانند پیش‌بینی ریزش و اعتبارسنجی صیاد).
- **کامپوننت بصری نورافکن (`src/components/InteractiveTour.tsx`):**
  - فوکوس تعاملی روی المان‌های واقعی صفحه با افکت نورافکن (Spotlight Ring) و پس‌زمینه نیمه‌تاریک بلور.
  - کارت راهنمای شناور با شمارنده گام، بج قابلیت جدید، نشانگرهای پیشرفت و کلیدهای ناوبری کیبورد سازگار با چیدمان راست‌به‌چپ (RTL).
  - تعبیه راه‌اندازهای سریع آموزش و تازه‌های نگارش در منوی همبرگری (`NavigationDrawer.tsx`).
- **اصلاحات معماری ناوبری و مسیرها (Batch B2):**
  - پوشش کامل زیرمسیرها و تب‌های پارامتری در عنوان هدر معلق (`Layout.tsx`) برای فاکتورها، چک‌های صیادی، وصولی، مرجوعی و ناوگان.
  - جلوگیری از هایلایت نادرست تب خانه در هنگام مرور صفحات فرعی و اعمال دسترسی‌های مرتبط.
- **اعتبارسنجی:**
  - افزوده شدن سوئیت جدید `tests/interactiveTour.test.mjs` با ۴ تست اختصاصی برای فیلتر نقش‌ها، ساختار گام‌ها و What's New.
  - موفقیت کامل تمام ۴۸ سوئیت تست (۱۹۹+ شرط آزمون خودکار، ۰ خطا).
  - کامپایل موفق و بدون خطای تایپ‌اسکریپت (`compile_applet`).


