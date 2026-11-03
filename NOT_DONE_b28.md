# موارد باز — AKHAVAN CRM b28

این فهرست عمداً وضعیت واقعی را حفظ می‌کند؛ «تمام» به معنی پیاده‌سازی قابل‌آزمون است، نه صرفاً سند یا UI.

## مسدود به دسترسی/محیط بیرونی
- [ ] نصب dependencyها در محیط دارای registry و اجرای `npm run lint` و `npm run build`؛ محیط حاضر `vite` و `vite/client` را ندارد.
- [ ] Smoke test واقعی Chromium و Safari/iPhone: RTL، safe area، keyboard، touch، zoom/reflow، فرم‌ها و screen reader.
- [ ] سنجش GPU/FPS/باتری/حرارت و مقایسهٔ هاله با تصویر مرجع روی آیفون واقعی.
- [ ] اجرای migrations 001–009 روی SQL Server آزمایشی؛ آزمون منفی RLS، tenant isolation، FK و RowVersion.
- [ ] Backend/BFF و ERP endpoint/auth/service credentials؛ اجرای Outbox worker، retry/dead-letter/idempotency و reconciliation واقعی.
- [ ] SignalR/WebSocket احرازشده، read receipts، offline queue و object storage S3/MinIO.
- [ ] دیتاست واقعی و benchmark برای virtualization 100k+ و تحلیل churn/next purchase/stock aging.
- [ ] بررسی امنیتی server-side authorization، localStorage draft/privacy/retention، attachment scanning و WCAG کامل.

## قراردادهای مستندشده در b28، اما هنوز اجرا نشده
- [x] ماتریس رابطه‌ها، مالکیت منبع حقیقت، وضعیت و معیار پذیرش برای Customer→Quote/Negotiation→Order→Dispatch→ERP/Finance→Tasks/Notifications/Audit.
- [x] مشخصات Outbox/idempotency/correlation/RowVersion و مرزبندی source-of-truth.
- [x] تست قراردادی برای جلوگیری از حذف مستندات یکپارچگی و برچسب آزمایشی عملیات پخش.

## وضعیت قابلیت‌های فعلی که نباید بیش‌ازحد ادعا شوند
- نقشه و برنامهٔ پخش فعلی در بخش‌هایی آزمایشی است؛ GPS/تحویل واقعی متصل نیست.
- اولویت‌بندی وصول تا اتصال منبع معتبر مالی عمداً مسدود می‌ماند.
- هالهٔ جوی پیاده‌سازی CSS دارد؛ کیفیت بصری/حرارتی روی دستگاه واقعی تأیید نشده.
- UI/guard کلاینت جایگزین مجوزدهی سرور و RLS اجراشده نیست.
