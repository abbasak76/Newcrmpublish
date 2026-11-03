# 02 — سیستم دیزاین Solar Ember

> **مرجع فعلی طراحی:** Solar Ember؛ محتوای تاریخی پایین برای ردیابی تصمیم‌ها نگه‌داری شده است و به‌تنهایی مجوز بازگرداندن طرح‌های قدیمی نیست.

## اصول جاری
- ظاهر گرم، پریمیوم، مینیمال و خوانا؛ فارسی/RTL و Vazirmatn.
- توکن‌های مرکزی و مشترک در `src/index.css`؛ از تکرار HEX در صفحات و ساخت پالت دوم خودداری شود.
- پالت مرجع: ivory `#F7F0E7`، plum `#71364B`، coral `#C96F55`، gold `#D5A15E`، sand `#E7D5C5`، sage `#667D68`؛ رنگ‌های معنایی نیز فقط از توکن‌ها مصرف شوند.
- سطوح سفید/گرم، مرزبندی لطیف، سایه‌های کنترل‌شده، شعاع‌های 8/12/18/24px و گام فاصله‌گذاری پایه 4px. افکت‌های blur/glass باید محدود و از نظر عملکرد موبایل بررسی شوند.
- بدون تم تیرهٔ سراسری، نئون، گرادیان تمام‌صفحه، blur متحرک پرهزینه یا افکت نمایشیِ بدون ارزش کاربردی. اتمسفر آب‌وهوا صرفاً تزئین کم‌هزینه است و نباید خوانایی یا عملکرد را مختل کند.
- اجزای فرم، دکمه، کارت، Badge، Modal/Sheet، تقویم، نمودار و حالت‌های خالی باید از کامپوننت‌ها و توکن‌های مشترک استفاده کنند.
- هر بازطراحی باید موبایل، Safari/iOS، دسترس‌پذیری، focus، کاهش حرکت و صفحات پرتراکم مالی را بررسی کند.
- تصمیم ناوبری پایین و Quick Add در این بسته باز نیست؛ تغییرش خارج از دامنهٔ استانداردسازی مستندات است.

## روند تغییر طراحی
1. بررسی توکن‌ها و کامپوننت‌های فعلی. 2. نمونه‌برداری از صفحات پرتراکم و موبایل. 3. تغییر کمینه. 4. بررسی عدم رگرسیون. 5. ثبت تصمیم در همین سند و افزودن یک یادداشت کوتاه به بخش تغییرات اجرایی.

---

## منابع تاریخی ادغام‌شده (متن اصلی حفظ شده)


---

### منبع ادغام‌شده: `docs/SOLAR_EMBER_MIGRATION_REPORT.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — گزارش ممیزی و مهاجرت Solar Ember (فاز ۱ + بخش اصلی فاز ۲)

> فقط بر اساس کارهای واقعاً انجام‌شده. «اجرا نشده» یعنی در این محیط امکان اجرا نبود (بدون node_modules و بدون شبکه).

## ۱. وضعیت اولیه کشف‌شده
- Vite + React 19 + Tailwind v4 + react-router 7 + zustand، RTL فارسی، ۹۵ فایل TS/TSX.
- **یافته بحرانی:** `src/index.css` فقط یک خط (`@import "tailwindcss"`) بود؛ تمام توکن‌ها و کلاس‌های سفارشی (`bg-brand`, `text-ink`, `glass`, `shadow-lux`, `anim-*`, `animate-in`, ...) تعریف‌نشده بودند.
- `ThemeProvider` هیچ‌جا mount نشده بود.
- `NavDock` و منوی بالا با رجیستری `navigation.ts` تغذیه می‌شدند؛ منوی کشویی فیلتر مجوز نداشت.
- ۲۱ route در `App.tsx` (شمارش: `grep "<Route "`)؛ ۲۲ آیتم منو در `navigation.ts`.
- ۸ اسکیمای فرم پویا (`dynamicFormEngine.ts`) و یک renderer مشترک.

## ۲. تغییرات انجام‌شده
| فایل | تغییر |
|---|---|
| `src/index.css` | منبع واحد توکن Solar Ember (پالت، معنایی، نمودار، سایه، شعاع، motion)، نگاشت پالت‌های Tailwind به رنگ‌های معنایی گرم، کلاس‌های glass/se-*، هاله جوی، کپسول ناوبری، پنل Quick Add، RTL، reduced-motion، چاپ |
| `src/lib/haptics.ts` (جدید) | HapticsAdapter با fallback بی‌صدا، احترام به reduced-motion و کلید خاموش/روشن |
| `src/theme/ThemeProvider.tsx` | افزودن حالت جوی (auto/گرگ‌ومیش/صبح/غروب/شب)؛ API قبلی حفظ شد |
| `src/components/AtmosphereLayer.tsx` (جدید) | لایه هاله جوی، ماه/ستاره انتزاعی در شب، حالت ساده برای دستگاه ضعیف |
| `src/components/Sidebar.tsx` (جدید) | سایدبار ۲۷۲/۷۶، گروه‌بندی از رجیستری، فیلتر RBAC، tooltip در حالت جمع، انتخاب‌گر هاله |
| `src/components/NavDock.tsx` | حذف (ادغام در Sidebar؛ تمام ماژول‌ها در Sidebar هستند) |
| `src/components/Layout.tsx` | بازنویسی: بدون هدر در Home (کنترل‌های شناور)، کپسول چهارآیکونی + کپسول + مستقل، Quick Add، swipe چت، swipe-down، Escape، مدیریت focus |
| `src/lib/navigation.ts` | `filterSections` (فیلتر مجوز) و `BOTTOM_NAV_IDS` |
| `src/components/NavigationDrawer.tsx` | فیلتر مجوز منو؛ جایگزینی دکمه تم تیره با انتخاب‌گر هاله |
| `src/hooks/useDeepLinkCreate.ts` (جدید) | `?new=1` فرم ایجاد واقعی ماژول را باز می‌کند (Tasks, Leads, Customers, Internal Automation, Opportunities) |
| `src/components/NegotiationsWorkspace.tsx` | فرم ایجاد فرصت به `DynamicFormRenderer` + `OPPORTUNITY_FORM_SCHEMA` متصل شد؛ audit و رویداد کسب‌وکار حفظ شد |
| `src/components/ui/Button.tsx`, `Avatar.tsx` + ۲۵ فایل | حذف HEX خام (≈۳۸۰ مورد) به توکن؛ گرادیان‌های قدیمی دکمه‌ها حذف شد |
| `src/App.tsx` | mount شدن ThemeProvider |
| `index.html`, `public/manifest.json` | رنگ‌ها، viewport-fit=cover، theme-color |
| ۱۶ workspace | ریشه از `bg-canvas` به transparent تا هاله جوی دیده شود |

## ۳. موتور فرم پویا
- اسکیماها: ۸ (Customer, CollectionPromise, Activity, Note, Task, Opportunity, ServiceCase, PaymentReceipt).
- نقاط استفاده renderer: Customers(۱) + Finance(۱) + Customer360(۶) + **Negotiations(۱، جدید)** = ۹.
- **هنوز متصل نیست (ناقص):** فرم Task در `TasksWorkspace` (قابلیت‌های انتساب گروه/نقش، پیوست و ارجاع دارد؛ جایگزینی بدون قابلیت‌کم‌شدن نیازمند توسعه اسکیما)، Lead جدید، درخواست داخلی، Cases/Campaigns/Knowledge، `CustomerActionModals` (۲۹ ورودی دستی)، گروه‌ها.
- اعتبارسنجی سمت سرور: backend وجود ندارد (state محلی/IDB) → NOT_CONFIGURED.

## ۴. موارد Mock / شبیه‌سازی یافت‌شده (اصلاح نشده؛ نیازمند تصمیم)
- `SettingsWorkspace.handleTestPingChannel` و `handleSendTestMessage`: تأخیر تصادفی، وضعیت `CONNECTED` و پاسخ ورودی ساختگی (تخطی از قواعد ۷ و ۱۲).
- `Math.random()` برای کدهای ACC/TRX/INV/CHQ: شناسه ساختگی سمت کلاینت تا زمان backend.
- `seed.ts`: Seed موجود حفظ شد (فقط محیط تست/درخواست صریح).

## ۵. انحراف‌ها از سند
- **تم تیره:** سند تم تیره سراسری را ممنوع می‌کند؛ CSS تم تیره اصلاً وجود نداشت. کلید «تیره/روشن» با انتخاب‌گر هاله جایگزین شد (API `useTheme` حفظ شد). در صورت نیاز به تم تیره واقعی اعلام کنید.
- **Quick Add:** حداکثر ۵ اکشن؛ «لیست پیش‌فاکتورها»، «امور مالی»، «فرصت» از پنل برداشته شدند ولی از Sidebar/منو در دسترس‌اند.
- **تقویم** از کپسول پایین به «تعاملات» (گروه‌ها/چت) تغییر کرد؛ از منو در دسترس است.
- **Login:** در سورس صفحه ورود/احراز هویت وجود ندارد (`AuthService` فقط کاربر جاری را برمی‌گرداند). ساخت ورود جعلی انجام نشد → NOT_CONFIGURED؛ نیازمند backend/Auth. دکمه «خروج» منو فقط به پروفایل می‌رود (رفتار قبلی).

## ۶. اجرا نشده
build، lint/typecheck (tsc)، تست مرورگر/Safari/موبایل، کنتراست، رگرسیون تعاملی. تنها بررسی انجام‌شده: **سینتکس ۹۵ فایل با `ts.transpileModule` — ۰ خطا**. پیش از استفاده `npm i && npm run lint && npm run build` اجرا شود.

## ۷. کارهای باقی‌مانده (فاز ۲ ادامه)
بازطراحی بصری عمیق صفحات (Customer360, Finance, Settings...) فراتر از نگاشت توکن؛ اتصال فرم‌های ناقص بند ۳؛ Login؛ حذف شبیه‌سازی‌های بند ۴؛ اعلان خطای دریافت (به‌جای صفر)؛ تست‌ها.

## ۸. به‌روزرسانی دور دوم
- **اصلاح شبیه‌سازی‌ها (SettingsWorkspace):** تست ping دیگر وضعیت «متصل» و تأخیر تصادفی نمی‌سازد و صریحاً `NOT_CONFIGURED` اعلام می‌کند؛ پیام تستی فقط ثبت محلی با وضعیت `SENT` است و پاسخ ورودی/لاگ عامل ساختگی حذف شد.
- **فرم سرنخ** به موتور پویا وصل شد (`LEAD_FORM_SCHEMA`). تعداد استفاده renderer: ۱۰.
- **باگ UX یافت‌شده و رفع‌شده:** `Modal` در هر رندر مجدد والد (چون `onClose` تابع inline است) فوکوس را به اولین فیلد برمی‌گرداند، یعنی هنگام تایپ در فرم‌هایی که state در والد دارند، مکان‌نما می‌پرید. اکنون فوکوس فقط یک‌بار تنظیم می‌شود و پس از بستن به دکمه بازکننده برمی‌گردد.
- **Home:** بازطراحی با داده واقعی (۴ کارت اقدام، برنامه امروز، مشتریان اخیر)، حالت‌های خالی، هدف لمسی ۴۴px.
- **دسترس‌پذیری:** skip-link، landmark اصلی، `Input` با label/aria-invalid/role=alert، مرکز اعلان با `button` و `aria-live` و حالت خالی.
- **Card** پایه: border و سایه Solar Ember پیش‌فرض.

## ۹. مشکلات شناسایی‌شده (ثبت برای تصمیم)
1. `cn()` در `utils.ts` فقط join می‌کند (بدون tailwind-merge)؛ کلاس‌های متناقض (مثلاً Card + override) به ترتیب CSS بستگی دارند. پیشنهاد: افزودن `tailwind-merge`.
2. `OnboardingTour` فقط ۱۷ خط است (احتمالاً stub)؛ بررسی نشد.
3. `CustomerActionModals` (۷۹۳ خط، ۲۹ ورودی دستی) **هیچ importی ندارد** (grep بدون نتیجه) → کد مرده و موازی با فرم‌های Customer360؛ حذف نشد، تصمیم با شما.
4. ۳ نسخه تکراری `SKILL.md` در `skills/` و `docs/architecture/` (دست نخورد).
5. داده فقط در state محلی/IDB است: بدون backend، مجوز سمت سرور و اعتبارسنجی سرور ممکن نیست.
6. `TOP_TAB_IDS` در navigation.ts بلااستفاده شد (حذف نشد، بی‌خطر).
7. Task form و Internal Request هنوز دستی‌اند (بند ۳).


---

### منبع ادغام‌شده: `docs/history/DESIGN_SYSTEM_CHANGELOG-r6.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# Changelog — AKHAVAN CRM r6-cp4

## این دور
- افزوده‌شدن طرح نسخه‌دار SQL Server برای CRM core، RBAC، یکپارچه‌سازی، mirrorهای مالی و semantic analytics.
- افزودن view واحد `vw_InvoiceBalance` برای مانده فاکتور؛ مانده به‌صورت جدول تکراری نگهداری نمی‌شود.
- افزودن viewهای Fact فروش و پوشش هزینه؛ تفکیک فروش تحقق‌یافته، پیش‌بینی و سود با بهای معتبر.
- افزودن فرهنگ KPI نسخه‌دار با مالک، منبع، grain و تست عددی.
- افزودن قرارداد Connector/Webhook با وضعیت واقعی، timeout، retry، rate limit، idempotency، HMAC، نسخه‌بندی و تست‌های پذیرش.
- ثبت شکاف‌های باز: schema واقعی ERP، SQL Server target، RLS، secret manager، اتصال runtime و تست عددی مرجع هنوز فراهم نشده‌اند.

## تغییرات UI در این دور
این دور عمدتاً به مستندسازی و قرارداد داده اختصاص یافت؛ هیچ بازنویسی گسترده‌ای از UI انجام نشده و وضعیت همه صفحات/اکشن‌ها هنوز ممیزی نهایی نشده است.


---

### منبع ادغام‌شده: `docs/history/DESIGN_SYSTEM_CHANGELOG-r7-cp5.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# Changelog — AKHAVAN CRM r7-cp5

## این دور
- افزوده‌شدن طرح نسخه‌دار SQL Server برای CRM core، RBAC، یکپارچه‌سازی، mirrorهای مالی و semantic analytics.
- افزودن view واحد `vw_InvoiceBalance` برای مانده فاکتور؛ مانده به‌صورت جدول تکراری نگهداری نمی‌شود.
- افزودن viewهای Fact فروش و پوشش هزینه؛ تفکیک فروش تحقق‌یافته، پیش‌بینی و سود با بهای معتبر.
- افزودن فرهنگ KPI نسخه‌دار با مالک، منبع، grain و تست عددی.
- افزودن قرارداد Connector/Webhook با وضعیت واقعی، timeout، retry، rate limit، idempotency، HMAC، نسخه‌بندی و تست‌های پذیرش.
- ثبت شکاف‌های باز: schema واقعی ERP، SQL Server target، RLS، secret manager، اتصال runtime و تست عددی مرجع هنوز فراهم نشده‌اند.

## تغییرات UI در این دور
این دور عمدتاً به مستندسازی و قرارداد داده اختصاص یافت؛ هیچ بازنویسی گسترده‌ای از UI انجام نشده و وضعیت همه صفحات/اکشن‌ها هنوز ممیزی نهایی نشده است.


---

### منبع ادغام‌شده: `docs/history/DESIGN_SYSTEM_CHANGELOG-r7.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# Changelog — AKHAVAN CRM r7-cp5

## این دور
- افزوده‌شدن طرح نسخه‌دار SQL Server برای CRM core، RBAC، یکپارچه‌سازی، mirrorهای مالی و semantic analytics.
- افزودن view واحد `vw_InvoiceBalance` برای مانده فاکتور؛ مانده به‌صورت جدول تکراری نگهداری نمی‌شود.
- افزودن viewهای Fact فروش و پوشش هزینه؛ تفکیک فروش تحقق‌یافته، پیش‌بینی و سود با بهای معتبر.
- افزودن فرهنگ KPI نسخه‌دار با مالک، منبع، grain و تست عددی.
- افزودن قرارداد Connector/Webhook با وضعیت واقعی، timeout، retry، rate limit، idempotency، HMAC، نسخه‌بندی و تست‌های پذیرش.
- ثبت شکاف‌های باز: schema واقعی ERP، SQL Server target، RLS، secret manager، اتصال runtime و تست عددی مرجع هنوز فراهم نشده‌اند.

## تغییرات UI در این دور
این دور عمدتاً به مستندسازی و قرارداد داده اختصاص یافت؛ هیچ بازنویسی گسترده‌ای از UI انجام نشده و وضعیت همه صفحات/اکشن‌ها هنوز ممیزی نهایی نشده است.


---

### منبع ادغام‌شده: `docs/history/DESIGN_SYSTEM_CHANGELOG-r8.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# Changelog r8-cp6

## Quality & data-contract guardrails
- Added a dependency-free static SQL Server contract audit (`npm run audit:contracts`).
- Added SQL Server preflight checks for RLS enablement, SESSION_CONTEXT usage, tenant-table policy coverage, and required semantic views.
- Added a DBA review result set for foreign keys between tenant-scoped tables that do not include TenantId in the FK mapping; no automatic schema mutation is attempted.
- Added deterministic KPI calculation fixtures for receivables, realized sales vs. forecast, gross profit with incomplete cost coverage, and data-quality review.
- Added Persian SQL Server pre-deployment checklist for tenant isolation, pooled connections, financial reconciliation, and release-blocking conditions.

## Validation
- Static audit passed: 7 SQL scripts, 46 tables, 44 TenantId tables, 44 RLS targets, 5 required views.
- SQL Server execution, security penetration tests, real ERP reconciliation, application build, and browser tests remain unverified in this environment.


---

### منبع ادغام‌شده: `docs/history/DESIGN_SYSTEM_CHANGELOG-r9.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# Changelog — Solar Ember r9 / cp7

- Hardened frontend RBAC fallback behavior and record-scope checks.
- Added route-level permission guards for the existing workspaces without creating a parallel authorization engine.
- Restricted chat visibility to explicit group membership, including administrators, and hardened message edit/delete ownership checks.
- Extended SQL Server FK preflight output with both-side column mappings and constraint trust/disabled state; audit remains report-only.
- Added Persian security and FK review documents with explicit unverified items.
- No database FK was changed, no backend connector was marked active, and no production-readiness claim is made.


---

### منبع ادغام‌شده: `docs/history/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-legacy.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — گزارش ممیزی و توسعه Solar Ember / دور r6-cp4

تاریخ گزارش: 2026-10-22
مبنای سورس: `AkhavanCRM-SolarEmber-r5-cp3.zip` (ادامه همان محصول؛ بدون بازنویسی کل برنامه)

## 1) کارهای این دور

### تکمیل امنیت داده در این به‌روزرسانی
- افزودن `006_row_level_security.sql` برای سیاست اولیه SQL Server RLS با `SESSION_CONTEXT(N'TenantId')` روی جداول tenant-scoped؛ نبود context باید fail-closed باشد. این اسکریپت هنوز روی SQL Server اجرا نشده و نیازمند آزمون امنیتی، connection pooling و مجوزهای سرویس است.

### مدل SQL Server
- افزودن طرح نسخه‌بندی‌شده در `database/sqlserver/v1/` با ۵ اسکریپت:
  1. `001_core_schema.sql`: Tenant/سازمان/RBAC و موجودیت‌های CRM.
  2. `002_integration_schema.sql`: کنترل‌پلین Connector، اجرای اتصال، مالکیت فیلد، شناسه بیرونی، ورودی Webhook، RawRecord و Outbox.
  3. `003_external_mirror_and_finance.sql`: mirrorهای read-only برای محصول/فاکتور/ردیف فاکتور/پرداخت/تخصیص/بستانکاری و view مانده مطالبات.
  4. `004_analytics_semantic_layer.sql`: تعریف KPI، کنترل کیفیت، Fact view فروش و پوشش بهای تمام‌شده.
  5. `005_kpi_catalog_seed.sql`: کاتالوگ اولیه نسخه‌دار KPI با تست‌های قراردادی.
  6. `006_row_level_security.sql`: سیاست اولیه SQL Server RLS با `SESSION_CONTEXT`, fail-closed در نبود tenant context و فهرست جدول‌های tenant-scoped.
- تعریف محاسبه مانده به شکل view واحد؛ هیچ جدول جداگانه‌ای برای مانده حساب ایجاد نشده است.
- تفکیک فروش تحقق‌یافته از پیش‌بینی؛ Opportunity/Quote در فروش قطعی وارد نمی‌شوند.
- سود ناخالص فقط روی ردیف‌هایی محاسبه می‌شود که بهای تمام‌شده معتبر دارند؛ پوشش هزینه جداگانه گزارش می‌شود.

### قرارداد اتصال
- افزودن `docs/integrations/CONNECTOR_API_CONTRACTS_v1.md` شامل مالکیت داده/فیلد، idempotency، timeout، retry، rate limit، خطاها، versioning، HMAC Webhook و ۱۲ سناریوی پذیرش قابل تکرار.
- افزودن قرارداد OpenAPI 3.1 پیش‌نویس در `docs/integrations/connector-openapi-v1.yaml` برای فهرست Connector، health check واقعی و دریافت webhook.
- وضعیت `NOT_CONFIGURED` تا زمان پیکربندی و آزمون واقعی، تنها وضعیت صادقانه اتصال‌های بدون زیرساخت است.

### تحلیل و فرهنگ KPI
- افزودن `docs/analytics/KPI_DICTIONARY_v1.md` با تعریف، فرمول، grain، منبع، مالک و کنترل عددی KPIهای فروش، پیش‌بینی، سود، پوشش هزینه، مطالبات، وصول، مشتری فعال، مراجعه، SLA و پرونده.
- افزودن `docs/architecture/SQL_SERVER_DATA_MODEL_v1.md` و `DATA_MODEL_DECISIONS_AND_GAPS.md` برای مالکیت جداول، قواعد عدم تکرار، نکات SQL Server و شکاف‌های پیش از استقرار.

## 2) اصول مدل که حفظ شده‌اند
- Account یک موجودیت کانونیکال است؛ Customer موازی ساخته نشده.
- Quote با Order/Invoice یکی نیست.
- فاکتور، پرداخت و تخصیص پرداخت CRM-owned نیستند؛ mirror کانونیکال از ERP/حسابداری‌اند.
- هیچ جدول جداگانه‌ای برای مانده/سود/فروش تجمیعی به‌عنوان منبع حقیقت ساخته نشده؛ Fact فروش و مانده به‌صورت view تعریف شده‌اند.
- CRM همچنان لایه مدیریت و تصمیم‌سازی است؛ جایگزین ERP/DMS/WMS/PIM یا سفارش‌گیری نیست.
- این دور عمدتاً روی قرارداد داده و یکپارچه‌سازی متمرکز است؛ بازطراحی بصری صفحات و ممیزی همه handlerها هنوز کامل نیست.

## 3) فهرست Routeهای موجود در سورس
`/`, `/command`, `/journey`, `/dashboard`, `/leads`, `/accounts/*`, `/opportunities`, `/quotes`, `/activities`, `/tasks`, `/finance`, `/cases`, `/marketing`, `/knowledge`, `/internal_automation`, `/groups`, `/calendar`, `/reports`, `/settings`, `/profile`; مسیر ورود `/login` نیز در نسخه قبلی شرطی است.

وجود route در کد به معنی آزمون runtime یا تکمیل تمام اکشن‌های آن نیست. این گزارش ادعای تست دستی همه صفحات را ندارد.

## 4) وضعیت اتصال و محدودیت اجرایی
- SQL Server: **طرح و اسکریپت ایجاد شده، اما اجرا نشده**؛ connection string، سرور هدف، schema واقعی ERP، secret manager و migration runner موجود/تأیید نشده‌اند.
- Connector/Webhook: **قرارداد draft شده، اتصال runtime وجود ندارد**. هیچ اتصال واقعی به ERP/حسابداری/GPS/Power BI تأیید نشده است.
- Power BI: semantic layer مستند شده؛ gateway/dataset/credentials و refresh schedule هنوز ایجاد نشده‌اند.
- RBAC: مدل داده پیشنهادی دارد؛ RLS و enforce سمت سرور هنوز اجرا نشده‌اند.
- مالی: تطبیق عددی با گزارش واقعی حسابداری اجرا نشده؛ باید با نمونه‌های مصوب و تلورانس مالی انجام شود.

## 5) خطرها و اقدامات پیش از تولید
1. بازبینی DBA روی نسخه SQL Server، سازگاری syntax، FKهای مرکب Tenant، indexها، transaction/rollback، migration ordering و سیاست RLS/connection pooling.
2. تطبیق کامل نام فیلدها/وضعیت‌ها با schema واقعی ERP و حسابداری؛ قرارداد فعلی الگوی پیشنهادی است.
3. طراحی و آزمون RLS با `SESSION_CONTEXT`, مجوزهای row/field، secret manager، TLS، encryption، backup/restore و retention.
4. آزمون تطبیق فروش/مطالبات/تخصیص/بستانکاری با داده واقعی؛ تعریف رسمی بهای تمام‌شده، مرجوعی، تخفیف، مالیات و ارز.
5. اجرای آزمون قطع‌و‌وصل، 429/5xx، timeout، idempotency، webhook replay، payload ناسازگار، retry و dead-letter برای هر Connector.
6. تست `npm run lint`, `npm run build`، تست مرورگر/Safari و آزمون responsive بعد از نصب وابستگی‌ها؛ این محیط فاقد `node_modules` است.

## 6) روش اعتبارسنجی این دور
- بررسی ساختار فایل‌ها و route registry در سورس.
- بررسی syntax با `typescript.transpileModule` روی ۹۸ فایل TS/TSX: صفر خطای syntax.
- OpenAPI YAML با parser محلی بارگذاری شد؛ OpenAPI 3.1.0 و ۳ مسیر تعریف‌شده شناسایی شد (اعتبارسنجی کامل schema/operation انجام نشده).
- `tsc --noEmit` اجرا شد اما به‌دلیل نبود dependency/type package `vite/client` متوقف شد (`TS2688`)؛ این نتیجه خطای کامپایل برنامه را ثابت نمی‌کند و typecheck کامل انجام‌نشده محسوب می‌شود.
- **SQL Server parser/integration tests اجرا نشده‌اند** و نباید این خروجی به‌عنوان migration تولیدی تأییدشده تلقی شود.
- build و browser tests اجرا نشده‌اند.

## 7) موارد باقی‌مانده در نقشه راه مادر
- ممیزی تک‌تک دکمه‌ها، event handlerها، فرم‌ها، settings و permission gates با برچسب ACTIVE/PARTIAL/NOT_CONFIGURED/BLOCKED.
- اجرای واقعی DynamicFormRenderer برای فرم‌های باقی‌مانده بدون از دست رفتن قابلیت‌های اختصاصی.
- کامل‌کردن طراحی بصری/حرکتی همه صفحات با رعایت Solar Ember، RTL، reduced-motion، عملکرد موبایل و دسترس‌پذیری.
- Connector واقعی پس از مشخص‌شدن ERP/حسابداری/GPS، مستندات API و دسترسی‌های مورد تأیید.
- RLS و تست امنیت tenant/scope در SQL/API.
- اجرای تست‌های عددی KPI با داده مرجع و امضای مالک KPI.

## 8) خروجی‌های تحویل
- سورس کامل: `AkhavanCRM-SolarEmber-r7-cp5.zip`
- Diff دور جاری: `AkhavanCRM-SolarEmber-r7-cp5.diff`
- Diff تجمیعی از r3-cp1: `AkhavanCRM-SolarEmber-r3-cp1-updated-r7.diff`
- گزارش: همین فایل
- Changelog: `DESIGN_SYSTEM_CHANGELOG-r6.md`


---

### منبع ادغام‌شده: `docs/history/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r8.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — گزارش ممیزی و توسعه Solar Ember / دور r8-cp6

تاریخ: 2026-10-22  
مبنای تغییرات: `AkhavanCRM-SolarEmber-r7-cp5.zip`  
رویکرد: ادامه افزایشی؛ هیچ صفحه یا منطق کسب‌وکار موجود برای این دور بازنویسی نشده است.

## 1. تغییرات انجام‌شده

### 1.1 ممیزی ایستای قرارداد SQL Server
- فایل `scripts/audit-sqlserver-contracts.mjs` اضافه شد.
- دستور `npm run audit:contracts` به `package.json` اضافه شد.
- کنترل‌های فعلی: تعداد و تکراری‌نبودن تعریف جدول‌ها، وجود `TenantId`، پوشش جدول‌های Tenant-scoped در RLS، عدم ارجاع policy به جدول ناشناخته یا بدون TenantId، استفاده از `SESSION_CONTEXT`, فعال بودن policy، وجود viewهای مالی/تحلیلی مورد انتظار و جلوگیری از ایجاد جدول‌های تجمیعی موازی برای مانده/فروش/KPI.
- نتیجه اجرا روی سورس فعلی: **PASS**؛ ۷ فایل SQL، ۴۶ جدول، ۴۴ جدول دارای TenantId، ۴۴ هدف RLS و ۵ view ضروری شناسایی شدند.
- این آزمون ایستا است و SQL را اجرا نمی‌کند؛ بنابراین جایگزین parser/اجرای SQL Server، آزمون امنیتی یا تطبیق داده نیست.

### 1.2 Preflight واقعی درون SQL Server
- `database/sqlserver/v1/007_preflight_validation.sql` اضافه شد.
- پس از اجرای اسکریپت‌های 001 تا 006، وضعیت فعال RLS، وجود predicate وابسته به `SESSION_CONTEXT('TenantId')`، پوشش همه جدول‌های دارای TenantId و وجود viewهای اصلی را بررسی می‌کند.
- هر شکست در کنترل‌های حیاتی با `THROW` متوقف می‌شود.
- در انتها، روابط Foreign Key بین جدول‌های Tenant-scoped را که در تعریف FK، TenantId را هم‌زمان در بر نمی‌گیرند، برای بازبینی DBA فهرست می‌کند. این گزارش عمداً بدون اصلاح خودکار است؛ تغییر گسترده FKها بدون بررسی کلیدها و داده‌های واقعی پرریسک است.

### 1.3 آزمون‌های عددی KPI
- `docs/analytics/KPI_TEST_FIXTURES_v1.md` افزوده شد.
- fixtureهای دستی برای مانده مطالبات، فروش قطعی در برابر پیش‌بینی، سود با پوشش ناقص بهای تمام‌شده و قواعد کیفیت داده مستند شدند.
- مثال مانده: 1,000,000 − 400,000 تخصیص معتبر − 50,000 بستانکاری = 550,000؛ تخصیص برگشتی و فاکتور باطل حذف می‌شوند.
- مثال سود: فقط ردیف‌های دارای بهای معتبر وارد سود می‌شوند؛ پوشش هزینه جداگانه محاسبه می‌شود.

### 1.4 چک‌لیست پیش از استقرار
- `docs/qa/SQL_SERVER_PREDEPLOYMENT_CHECKLIST_FA.md` افزوده شد؛ شامل ترتیب migration، آزمون دو Tenant، اتصال‌های pooled، کنترل دسترسی، تطبیق مالی و معیارهای توقف انتشار.

## 2. اصول حفظ‌شده
- سورس اصلی و منطق‌های قبلی مبنا باقی مانده‌اند؛ این دور روی کنترل کیفیت و مستندسازی اجرایی تمرکز دارد.
- فاکتور/پرداخت/تخصیص پرداخت mirror سامانه مرجع‌اند؛ CRM منبع اصلی مالی ایجاد نمی‌کند.
- مانده و KPIهای تجمیعی به‌صورت view محاسبه می‌شوند؛ جدول موازی برای مانده یا فروش ساخته نشده است.
- وضعیت Connector بدون پیکربندی و آزمون واقعی `NOT_CONFIGURED` می‌ماند.

## 3. اعتبارسنجی این دور

| کنترل | نتیجه | تفسیر |
|---|---|---|
| `node scripts/audit-sqlserver-contracts.mjs` | PASS | بررسی ایستا روی سورس |
| تعداد جداول / Tenant-scoped / RLS | 46 / 44 / 44 | هم‌پوشانی ایستا کامل در این نسخه |
| Required semantic views | 5 از 5 | در متن اسکریپت‌ها یافت شدند؛ وجود اجرایی هنوز باید در SQL Server تأیید شود |
| SQL Server execution | NOT RUN | در این محیط اتصال دیتابیس در دسترس نیست |
| RLS penetration / pooled connection | NOT RUN | نیازمند محیط SQL Server و دو Tenant آزمایشی |
| تطبیق KPI با ERP/حسابداری | NOT RUN | fixtureها مستندند؛ داده مرجع و تأیید مالک مالی لازم است |
| Build و browser/Safari | NOT RUN | وابستگی‌های پروژه در این محیط نصب نشده‌اند |

## 4. محدودیت‌ها و ریسک‌های باز

1. گزارش FK در `007_preflight_validation.sql` باید در دیتابیس آزمایشی اجرا و بررسی شود؛ روابطی که TenantId را در FK مرکب لحاظ نمی‌کنند باید قبل از تولید با راهکار مورد تأیید DBA ایمن شوند.
2. `SESSION_CONTEXT` باید فقط در لایه سرور مورد اعتماد از هویت احراز‌شده تنظیم شود؛ نباید از ورودی مرورگر پذیرفته شود.
3. اجرای SQL، تست‌های قطع‌و‌وصل Connector، secret manager، ERP واقعی و Power BI هنوز انجام نشده است.
4. ممیزی تمام handlerها، مجوزهای فیلدی، فرم‌های باقی‌مانده و تست UX همه صفحات همچنان ادامه دارد.

## 5. فایل‌های این دور
- `scripts/audit-sqlserver-contracts.mjs`
- `database/sqlserver/v1/007_preflight_validation.sql`
- `docs/analytics/KPI_TEST_FIXTURES_v1.md`
- `docs/qa/SQL_SERVER_PREDEPLOYMENT_CHECKLIST_FA.md`
- `package.json` — دستور `audit:contracts`

این نسخه برای بازبینی فنی و آزمون در محیط غیرتولیدی آماده‌تر شده، اما تأیید استقرار تولیدی محسوب نمی‌شود.


---

### منبع ادغام‌شده: `docs/history/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r9.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# AKHAVAN CRM — گزارش ممیزی و اصلاحات Solar Ember r9 / cp7

## خلاصه این دور
تمرکز دور r9 بر بستن چند شکاف قابل مشاهده در مجوزهای فرانت‌اند و محرمانگی چت، و بهتر کردن گزارش FK برای بررسی امن DBA بود. بازنویسی معماری یا موتور موازی انجام نشد؛ هیچ FK موجودی به‌صورت حدسی تغییر نکرد.

## فایل‌های اصلاح‌شده
- `src/lib/rbac.ts`: عدم fallback به اولین کاربر، رد کاربر غیرفعال، بررسی fail-closed برای محدوده شعبه/منطقه، و حذف استنباط محدوده TEAM از عضویت گروه گفتگو. قواعد صریح برای dashboard/tasks/activities/calendar/reports و default-deny برای workspace ناشناخته.
- `src/App.tsx`: guard فرانت‌اند برای مسیرهای موجود بر اساس مجوزهای فعلی.
- `src/components/GroupsWorkspace.tsx`: عضویت واقعی شرط دیدن گفتگو؛ بررسی دوباره گروه/فرستنده در ویرایش و حذف پیام؛ ثبت `deletedAt` برای حذف نرم.
- `database/sqlserver/v1/007_preflight_validation.sql`: نمایش ستون‌های FK، نگاشت TenantId و وضعیت constraint برای بازبینی DBA.
- مستندات ممیزی FK و اکشن/مجوز افزوده شد.

## تصمیم‌هایی برای جلوگیری از خرابی
- FKها خودکار تغییر نکردند؛ نیاز به اجرای SQL Server و بررسی واقعی کلیدها و داده وجود دارد.
- default فیلدهای فاقد تنظیم در `getFieldVisibility()` فعلاً تغییر نکرد تا فرم‌ها ناخواسته پنهان نشوند؛ این gap در سند امنیت ثبت شده است.
- مجوزهای مستقل برخی ماژول‌ها هنوز در مدل موجود تعریف نشده‌اند؛ از نزدیک‌ترین مجوزهای موجود استفاده شده و این نگاشت موقت مستند شده است.
- هیچ اتصال واقعی backend/realtime/push/ERP فعال اعلام نشده است.

## تست‌ها و وضعیت اعتبارسنجی
- `npm run audit:contracts`: PASS پس از تغییرات (۷ فایل SQL، ۴۶ جدول، ۴۴ جدول دارای TenantId، ۴۴ هدف RLS و ۵ view الزامی). این بررسی ایستا است و SQL را اجرا نمی‌کند.
- TypeScript syntax transpile: PASS — ۹۸ فایل TS/TSX، صفر خطای syntax؛ این تست فقط syntax است نه type-check کامل.
- `npm run lint` و `npm run build`: در این محیط به‌دلیل نبود `node_modules` قابل اجرای قابل اتکا نیستند، مگر وابستگی‌ها در محیط موجود نصب شوند.
- SQL Server runtime, RLS two-tenant test, Safari/iOS visual test, realtime chat, push, financial reconciliation و role-by-role E2E اجرا نشده‌اند.

## موارد باقی‌مانده با اولویت بالا
1. اتصال backend/API برای enforce کردن مجوزها در سمت سرور؛ فرانت‌اند security boundary نیست.
2. اجرای 007 روی SQL Server آزمایشی و دسته‌بندی FKها، سپس migration مرکب فقط برای روابط tenant-owned تأییدشده.
3. تکمیل ماتریس CRUD/approve/assign/delete و مجوزهای مستقل tasks/groups/opportunities/calendar/reports.
4. آزمون واقعی چت با دو حساب، دو مرورگر/دستگاه، قطع شبکه، پیوست، منشن و جلوگیری از اعلان تکراری.
5. ادامه پیاده‌سازی موتورهای وصول، اعتبار، یادآوری/esc escalation و پوشش ویزیت فقط پس از تعیین source-of-truth و قرارداد داده؛ هیچ موتور موازی مالی/سفارش‌گیری ساخته نشد.


---

### منبع ادغام‌شده: `docs/history/r10/DESIGN_SYSTEM_CHANGELOG-r10.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# DESIGN_SYSTEM_CHANGELOG-r10
- **Tokens/تایپوگرافی:** کلاس‌های `se-display/title/subtitle/body/label/caption/num` (منبع واحد در index.css).
- **موبایل:** ورودی‌ها ≥۱۶px؛ viewport بدون قفل zoom (دسترس‌پذیری).
- **حالت‌ها:** `Skeleton` (aria-busy)، `ErrorState` (role=alert)، `.se-skeleton` shimmer با reduced-motion و تم تیره.
- **جدول:** `.se-table-wrap` (اسکرول افقی داخلی، header چسبان، hover ملایم).
- **PageToolbar:** جستجوی `type=search` با پاک‌کردن، chip فیلتر فعال، «پاک‌کردن همه»، تعداد نتایج (aria-live). اتصال: فرصت‌های تجاری (جستجو واقعی روی عنوان/مشتری + مرحله).
- **اکشن مجاز:** دکمه‌های ثبت/تغییر مرحله فرصت بر اساس `can()` پنهان/غیرفعال با title توضیحی.
- **مالی:** نشان وضعیت رسید، دلیل اصلاح، وضعیت ERP، دکمه «تایید و تخصیص» فقط برای مجاز.
- **ورود:** `LightHighwayCanvas` (WebGL)، Light Sweep متالیک، Breathing Glow، کراس‌فید EN↔FA، Warp (لوگو دو طرف، زوم دوربین، نام ماژول‌ها از رجیستری منو، دالان radial)، پالس بیومتریک؛ fallback CSS بدون WebGL/reduced-motion.
- **مخاطبین Customer360:** افزودن/ویرایش بازیابی‌شده؛ نمایش `role` به‌جای فقط `title`.


---

### منبع ادغام‌شده: `docs/history/r10/SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r10.md`

> متن منبع تاریخی؛ برای تصمیم فعلی، بخش وضعیت جاری ابتدای سند و مرجع معماری را ملاک قرار بده.

# SOLAR_EMBER_AUDIT_AND_PATCH_REPORT-r10

## ۱. مبنا و زنجیره
- مبنا: `AkhavanCRM-SolarEmber-r9-cp7.zip` (flat). Diff تجمیعی r9 روی **خروجی cp1 همین گفتگو** بدون خطا اعمال و با zip برابر شد؛ روی audited-patch اعمال نمی‌شود. بنابراین Diff تجمیعی r10 نسبت به cp1 ساخته شد و اعمال‌پذیری آن آزموده شد (IDENTICAL).

## ۲. راستی‌آزمایی «گزارش ممیزی» پیوستی (Gemini) — قبل از اجرا
| ادعا | یافته با سورس | تصمیم |
|---|---|---|
| ACTION-001 پیش‌فرض ۵۰/۱۲۰ میلیون در Finance | **درست** (خط ۴۴، ۵۴ و fallback ۵۰ میلیون تعهد وصول) | رفع شد |
| HARDCODE-001 آستانه در `insights.ts` | **جزئاً غلط**: فایل‌ها `useWorkflowEngine`, `WorkflowEngine.tsx`, `aiAdvisorService`؛ مهم‌تر: **سقف اعتبار پیش‌فرض ۱۰۰M** در ۴ جا (مشتری جدید، collectionEngine، Customer360) | `orgPolicy.ts` منبع واحد از `settings.orgConfig`؛ پیش‌فرض تاریخی به‌صورت `LEGACY_*` علامت‌گذاری شد (تصمیم کسب‌وکار لازم) |
| RBAC-001 فیلد fail-open | **درست** | اگر `fieldPermissions` پیکربندی شده: ناشناخته=HIDDEN (+`entity.*`)؛ پیکربندی‌نشده=رفتار قبلی (وگرنه تمام فیلدهای SecureField همه نقش‌ها بی‌دلیل پنهان می‌شد) |
| DUP-002 `cn` بدون merge | درست ولی نیازمند وابستگی جدید `tailwind-merge` | **DEFERRED** (بدون شبکه/نصب، build قابل‌اثبات نیست؛ lockfile تغییر نکرد) |
| «CustomerActionModals ۱۰۰٪ زباله، rm شود» | **غلط**: `NewContactModal` تنها UI افزودن/ویرایش مخاطب است و Customer360 آن را نداشت (قابلیت از دست‌رفته) | حذف **نشد**؛ مخاطب در Customer360 بازیابی و متصل شد؛ بقیه مودال‌ها بی‌مصرف ولی حذف‌شان منوط به تایید پوشش (NewNegotiation/NewPayment) |
| `WorkflowEngine.tsx` | بی‌مصرف + منطق تکراری + باگ تاریخ UTC | **DEAD_CODE_CONFIRMED → حذف** (هیچ import؛ useWorkflowEngine جایگزین است) |
| «قوانین Workflow هاردکد و بدون UI» | درست (UI تعریف قانون وجود ندارد) | DEFERRED (نیاز به طراحی مدل قانون؛ نه حدس) |
| Snapshot قیمت بدون Enforcement | **درست** (افزودن/حذف قلم بدون قفل) | `canEditQuoteLines` در cpqEngine + guard در ۳ handler |
| «Contract Engine وجود ندارد» | **نیمه‌غلط**: `contractRebatePercent` در cpqEngine هست؛ مدل `state.contracts` وجود ندارد | BLOCKED (نیاز به تصمیم/مدل داده؛ کد پیشنهادی بر مدل ساختگی بود) |
| Penalty Engine | درست که نیست؛ کد پیشنهادی نرخ/سقف را اختراع می‌کند | BLOCKED تا سیاست جریمه سازمان تعریف شود |
| `window.print` / PDF | درست | DEFERRED (نیازمند کتابخانه) |
| DEAD_LETTER | **نیمه‌غلط**: وضعیت نهایی `FAILED` پس از `maxAttempts` وجود دارد | DEFERRED پنل پایش |
| `evaluateRule` پیشنهادی (fallback=true) و `autoAssignLead` (fallback کاربر جاری) | **Fail-open / تخصیص خودسرانه** | رد شد؛ اجرا نشد |

## ۳. تغییرات انجام‌شده (فایل‌های کلیدی)
- مجوز: `lib/rbac.ts` (ماتریس ۱۷×۷، `can`, `canActOnRecord`, field fail-closed)، `hooks/useCan.ts`، guard ۲۶ اکشن + Customer360 مخاطب.
- چت: عضویت-محور، Mention فقط اعضای فعال، حذف/ویرایش مالکیت‌محور، تبدیل پیام به وظیفه Idempotent، اعلان با `recipientId`.
- اعلان: `recipientId/dedupeKey/entityId`؛ هر کاربر فقط اعلان خودش را می‌بیند.
- یادآوری: `lib/reminders.ts` (۷/۲/۰ روز، معوق، Escalation به مدیر مستقیم فقط اگر قابل‌تعیین)، ضدتکرار `reminderLog`، تایم‌زون واقعی (رفع باگ UTC)، لغو برای وظایف تکمیل‌شده.
- مالی: `lib/receiptFlow.ts` + اتصال به Finance: اعتبارسنجی مبلغ، ضدتکرار قطعی/احتمالی، وضعیت صادقانه (PENDING نه CLEARED)، تایید حسابدار + تخصیص FIFO با `PaymentAllocation`، جلوگیری از اضافه‌پرداخت و تخصیص مجدد، `NEEDS_FIX` با دلیل، انتقال ERP = NOT_CONFIGURED. حذف `Math.random` از کد رهگیری پرداخت و کاهش مانده حساب هنگام ثبت (اکنون فقط هنگام تخصیص).
- طراحی: PageToolbar (جستجو + فیلتر فعال + پاک‌کردن + تعداد نتیجه) و اتصال واقعی به Opportunities، Skeleton/ErrorState، مقیاس تایپوگرافی، ورودی ۱۶px در موبایل، جدول واکنش‌گرا.
- ورود: صحنه ۳D زنده WebGL (shader سفارشی، بدون دارایی خارجی)، Idle (Breathing/Light Sweep ۴۵°/ذرات/کراس‌فید EN↔FA)، انتقال Warp. **احراز هویت همچنان NOT_CONFIGURED** (ورود جعلی ساخته نشد)؛ Warp فقط پس از `AUTHENTICATED` واقعی یا پیش‌نمایش حرکتی DEV اجرا می‌شود.
- SQL: سرشماری FK و ۵۷ کاندید (بدون Migration).

## ۴. تست‌های واقعاً اجراشده
`npm test` (Node 22، بدون وابستگی): rbac **۱۷۰**، reminders **۲۲**، policy/cpq **۹**، receipt **۲۹** assertion — همه PASS. `audit:contracts` PASS (استاتیک). Syntax transpile ۱۰۳ فایل: ۰ خطا.
**اجرا نشده:** `tsc`/lint/build (نبود node_modules و شبکه)، مرورگر/Safari/موبایل، رندر واقعی shader (GPU موجود نیست؛ GLSL با بازبینی دستی اصلاح شد)، SQL Server، چت دو حساب، Push/Scheduler.

## ۵. محدودیت‌ها و مسدودها
Backend/ERP/Auth واقعی؛ Scheduler سمت سرور (یادآوری فقط تا زمانی که برنامه باز است)؛ فونت Vazirmatn از Google Fonts بارگذاری می‌شود (نیاز به فایل woff2 محلی برای PWA آفلاین)؛ `viewport` بدون `user-scalable=no` ماند (دسترس‌پذیری کم‌بینایان؛ iOS با ورودی ۱۶px حل شد).

## ۶. پاسخ معیار پذیرش
مشتق از مبنا: بله. قابلیت‌ها حفظ: بله (به‌جز حذف WorkflowEngine.tsx بی‌مصرف؛ مخاطب بازیابی شد). موتور موازی: نه. مجوز فقط UI: **سمت کلاینت است و enforcement سرور وجود ندارد (شکاف ثبت‌شده)**. داده ساختگی: افزوده نشد. Build/Lint: **اجرا نشده**. Diffها: آزموده و قابل اعمال.
