# ممیزی مادر و ردیابی نیازمندی‌ها — b28

## دامنهٔ این انتشار
نسخهٔ مبنا b27 (r11-cp9) حفظ شده و تغییر این مرحله مستندات یکپارچگی دامنه و آزمون قراردادهای آن است. این نسخه عمداً ادعای پایان اتصال‌های خارجی نمی‌کند.

## شواهد
- `DOMAIN_INTEGRATION_CONTRACT_b28.md`: ماتریس Customer/Quote/Negotiation/SalesOrder/Dispatch/ERP finance/Tasks/Notifications/Audit و معیار پذیرش هر پیوند.
- `tests/domainIntegrationContracts.test.mjs`: بررسی وجود پیوندها در قرارداد، وجود جدول‌های مورد انتظار در migration 008، preflight مربوط به RLS/FK در migration 009، و حفظ هشدارهای عدم اتصال.
- `NOT_DONE_b28.md`: فهرست صریح باقی‌مانده‌ها و موانع بیرونی.
- `CHANGELOG_b28.md`: تغییرات همین نسخه.

## وضعیت پذیرش
| حوزه | وضعیت | دلیل |
|---|---|---|
| ماتریس روابط و مالکیت منبع داده | تکمیل مستنداتی | قرارداد و معیار پذیرش افزوده شده؛ runtime هنوز نیازمند API/SQL/ERP است |
| SQL migration 008/009 | موجود؛ اجرای واقعی تأییدنشده | فقط فایل‌ها و preflight ایستا بررسی می‌شوند |
| Outbox/ERP sync | مسدود | backend، credentials و endpoint در دسترس نیست |
| RBAC/RLS | guardهای کلاینت/قرارداد ایستا موجود؛ امنیت سروری تأییدنشده | تست SQL Server و API لازم است |
| Realtime/offline/object storage | مسدود | endpoint احرازشده و storage موجود نیست |
| iOS atmosphere/performance/a11y | جزئیات پیاده‌سازی موجود؛ دستگاه واقعی آزمون‌نشده | نیازمند Safari/iPhone، VoiceOver و اندازه‌گیری فیزیکی |
| Build/lint | محیطی مسدود | dependency نصب نیست؛ اجرای build/lint موفق ادعا نمی‌شود |

## نتیجه
b28 انسجام قراردادی و قابلیت ممیزی را بهتر می‌کند. این نسخه «production-ready» نیست تا وقتی آزمون‌های محیطی و اتصال‌های واقعی ثبت و پاس شوند.
