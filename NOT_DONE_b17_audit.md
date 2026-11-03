# موارد انجام‌نشده — وضعیت پس از ممیزی مستنداتی b17

این نسخه فقط اسناد ممیزی را به سورس افزوده است. موارد زیر به‌علت افزودن سند، انجام‌شده محسوب نمی‌شوند.

## P0 — تأیید سلامت سورس
- [ ] در محیط clean اجرا و ثبت شود: `npm install`, `npm test`, `npm run lint`, `npm run build`.
- [ ] تست مرورگر دسکتاپ و Safari/iOS، RTL، responsive، overflow و رگرسیون.
- [ ] تست دسترسی allow/deny برای CEO، Sales Manager، Supervisor، Salesperson، Accountant و Visitor.
- [ ] تعیین تکلیف seed قدیمی که با شناسه‌های تازه داده جدید اضافه می‌کند؛ جداسازی کامل `LOCAL_TEST`/`demo-*`.

## P1 — فرانت‌اند/منطق کسب‌وکار
- [ ] تکمیل فیلترهای مالی، drill-down و خروجی‌های مجاز CSV/XLSX/PDF.
- [ ] گردش کامل هزینه، دفتر بانک/صندوق، تطبیق بانکی و گردش چک.
- [ ] تست جامع `PaymentAllocation` و جلوگیری از دوباره‌شماری پرداخت/چک/اعتبار.
- [ ] چرخه Quote → handoff خارجی → پخش/تحویل → پیوند سندی فاکتور با حفظ تمایز Quote/Order/Invoice.
- [ ] تکمیل validation، override reason، audit و RBAC عملیات حساس.
- [ ] اثبات یکسانی KPIها و فیلترها بین نماها، همراه با source/freshness/drill-down.

## P1 — زیرسیستم هوش مکانی و مدیریت زون‌ها (پیاده‌سازی کامل در بسته یافت نشد)
- [ ] ممیزی داده مختصات مشتری، visit/route، task، مالی و RBAC.
- [ ] انتخاب نهایی MapLibre/tile provider پس از آزمون پوشش ایران، دسترسی، هزینه، مجوز، RTL، چاپ و self-host/cache.
- [ ] Zone/polygon: رسم/ویرایش/ذخیره/reload، نام/کد، نسخه هندسه، تاریخ اعتبار و audit.
- [ ] point-in-polygon و انتخاب مشتری واقعی داخل زون؛ زون متنی فعلی جایگزین آن نیست.
- [ ] تعریف KPIهای Heatmap (فرمول، واحد، منبع، aggregation، بهتر/بدتر)، انتساب معتبر تولیدکننده و مالی.
- [ ] Heatmap تک‌شاخصی، legend، فیلتر مشترک، cross-filter، منبع و زمان تازگی.
- [ ] task وصول/پیگیری از زون، مجری/ناظر/مهلت، نتیجه واقعی، مبلغ وصول معتبر، علت شکست و evidence مجاز.
- [ ] گزارش سلسله‌مراتبی، مقایسه مسیر برنامه‌ریزی‌شده/واقعی، چاپ نقشه و فهرست، clustering و performance.
- [ ] تست هندسه، permission, privacy، حجم زیاد و پنج مرحله پذیرش مستند.

## P2 — فاز مستقل پس از تکمیل فرانت‌اند
- [ ] Backend/API/Auth و RBAC سمت سرور.
- [ ] اجرای واقعی SQL Server migrations/RLS، integrity، security و recovery tests.
- [ ] ERP/ETL واقعی با mapping، outbox، retry، idempotency، monitoring و reconciliation.
- [ ] آزمون end-to-end با ERP/داده واقعی؛ هیچ اتصال واقعی در بسته فعلی تأیید نشده است.

## نکته انتشار
تا زمانی که P0 و معیارهای پذیرش مربوط به هر قابلیت اجرا و مستند نشده‌اند، بسته را release عملیاتی معرفی نکنید.
