# NOT DONE — AKHAVAN CRM b25

## P0 — اجرای نهایی در محیط قابل دسترس
- [ ] نصب dependencyها در محیط دارای npm registry؛ رفع خطاهای واقعی TypeScript، سپس `npm run lint` و `npm run build`.
- [ ] اجرای smoke test در Chromium روی `/geo-intelligence` و `/finance`؛ تست رسم/ویرایش/فعال‌سازی زون، reload، نقش‌ها، فرم درخواست بستانکاری و فیلترهای گزارش.
- [ ] آزمون واقعی iPhone/Safari: pointer/touch، zoom، RTL، safe area، keyboard/overflow و performance.
- [ ] اتصال به شبکه و آزمون tile واقعی؛ آزمون fallback/خطای tile، رفتار در اینترنت ضعیف و موبایل.
- [ ] آزمون SQL Server واقعی، RLS منفی و end-to-end ERP؛ تا آن زمان نتیجهٔ audit قراردادها صرفاً ایستا است.

## P1 — نقشه و داده جغرافیایی
- [x] نقشهٔ کاشی‌ای واقعی و مرکز اولیهٔ ایران؛ حرکت/زوم و ترسیم polygon لمسی/ماوس.
- [x] ذخیرهٔ رأس‌ها در قالب GeoJSON سازگار با versioning موجود؛ متن مختصات و نقشه با هم sync می‌شوند.
- [x] انتخاب OSM Standard یا URL سفارشی XYZ؛ آزمون کاشی در UI و attribution آشکار.
- [ ] انتخاب نهایی سرویس نقشه برای production با SLA، هزینه، شرایط attribution، rate limit و تضمین پوشش فارسی/ایران؛ OSM Standard سرور best-effort است و نباید برای ترافیک تجاری سنگین بدون بررسی ظرفیت استفاده شود.
- [ ] آزمون واقعی tile و رسم در مرورگر؛ شبکهٔ این محیط نام دامنهٔ tile را resolve نکرد.
- [ ] جست‌وجوی شهر/آدرس، مرزهای رسمی استان/شهرستان، geocoding و بررسی کیفیت مختصات مشتریان.
- [ ] آزمون polygonهای خودمتقاطع/پیچیده، تاریخ مؤثر و هندسه‌های بزرگ؛ کتابخانهٔ robust topology و چاپ/خروجی نقشه هنوز افزوده نشده است.
- [ ] Heatmap معتبر و cross-filter پس از اتصال منبع واقعی، تازگی داده، semantics رنگ و مجوزهای سرور.

## P1 — مطالبات و اولویت وصول
- [x] موتور تطبیق پرداخت‌های CLEARED و تخصیص معتبر با کنترل duplicate، مشتری، over-allocation و مغایرت مانده.
- [x] مدل read-only فرانت‌اند برای بستانکاری ERP و تفکیک آن از درخواست بستانکاری محلی.
- [x] گردش محلی درخواست بستانکاری: draft → pending approval → approved/void؛ تأیید محلی هیچ مانده‌ای را تغییر نمی‌دهد.
- [x] رتبه‌بندی بر اساس ماندهٔ معتبر نزولی، سپس ماندهٔ معوق/روز تأخیر؛ اتصال به انتخاب مشتری و ایجاد وظیفهٔ وصول گروهی.
- [ ] اتصال واقعی API/Sync از `crm.CreditNoteMirror` و `analytics.vw_InvoiceBalance` به `AppState`; تنظیم `creditNoteSourceStatus=CONNECTED` فقط توسط همگام‌سازی معتبر سمت سرور.
- [ ] تأیید نگاشت شناسه‌های ERP، ارز/واحد مبلغ، status mapping، حذف/ابطال، برگشت از سند و رکوردهای credit با `InvoiceMirrorId` تهی.
- [ ] تطبیق مقادیر UI با `analytics.vw_InvoiceBalance`/`vw_AccountReceivable` روی SQL Server واقعی و دادهٔ واقعی؛ بررسی rounding/decimal و تاریخ محلی.
- [ ] پس از اتصال واقعی، رتبه‌بندی و اولویت وظایف را با کاربران مالی و معیارهای کسب‌وکار تأیید کنید. اکنون اگر sourceStatus متصل نباشد یا هر مغایرتی وجود داشته باشد، رتبه‌بندی عمداً مسدود است.
- [ ] تعریف/تأیید قواعد سازمانی برای تبدیل رتبه به `URGENT/HIGH/NORMAL`؛ در نسخهٔ فعلی بالاترین رتبه فوری، یک‌چهارم اول زیاد و بقیه عادی است، فقط زمانی که مانده authoritative باشد.

## P1 — امنیت و ذخیره‌سازی
- [ ] Backend/API authorization و SQL RLS واقعی؛ مجوزهای کلاینت جایگزین کنترل سرور نیستند.
- [ ] اتصال درخواست بستانکاری به workflow رسمی/ERP به‌جای اجرای محلی؛ ثبت‌کننده نمی‌تواند درخواست خود را تأیید کند، اما enforce نهایی هنوز سمت سرور لازم دارد.
- [ ] محدودیت ذخیره‌سازی مدرک، retention، malware scanning و Object Storage امن.

## P2 — یکپارچه‌سازی
- [ ] API/Auth/DTO/validation و mapping واقعی mirror data.
- [ ] اجرای migrations و RLS روی SQL Server واقعی، recovery و audit.
- [ ] ERP/ETL با idempotency، outbox/retry، monitoring و reconciliation.
