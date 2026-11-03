# STATUS — AKHAVAN CRM b25

- نسخه: `0.12.1` — `r11-cp9-b25`؛ مبنا b24.
- نقشه: نقشهٔ کاشی‌ای واقعی در UI با مرکز اولیهٔ ایران، زوم/حرکت، رسم لمسی polygon، اتصال رأس‌ها به GeoJSON و امکان انتخاب OSM Standard یا URL سفارشی XYZ؛ attribution آشکار و آزمون دستی tile از UI پیاده شده است.
- ارائه‌دهنده: OSM Standard برای مشاهدهٔ تعاملی سبک انتخاب پیش‌فرض است، نه تضمین نهایی production. آزمون واقعی endpoint از محیط ساخت به‌دلیل DNS ناموفق بود؛ دسترسی tile در مرورگر کاربر هنوز تأیید نشده. برای ترافیک تجاری/پرترافیک باید SLA، قیمت، محدودیت، attribution و self-host بررسی شود.
- بستانکاری: `CreditNote` اکنون فقط مدل read-only آینهٔ ERP است؛ `CreditNoteRequest` یک گردش محلی مستقل است و به مانده اثر نمی‌گذارد. SQL mirror، view مانده و RLS از قبل در سورس موجود بودند و در b25 جدول تکراری ساخته نشده است.
- اولویت وصول: رتبهٔ نزولی ماندهٔ معتبر، سپس ماندهٔ معوق و بیشترین روز تأخیر؛ به ساخت گروهی وظایف و انتخاب مشتری وصل شده است. رتبه‌بندی فقط با `creditNoteSourceStatus=CONNECTED` و تطبیق بدون مغایرت فعال می‌شود.
- `npm test`: PASS؛ 587 assertion. `audit-actions`: PASS؛ 77/77 guarded. `audit:contracts`: PASS static-only. TS `transpileModule`: PASS برای 5 فایل تغییرکرده.
- `tsc --noEmit`: BLOCKED، `TS2688` برای `vite/client`. Build: BLOCKED، `vite` نصب نیست. `curl` به tile endpoint: BLOCKED در محیط به‌دلیل DNS. مرورگر/iPhone Safari/SQL Server واقعی/Backend-RLS/ERP: اجرا نشده‌اند.
- وضعیت: توسعهٔ فرانت‌اند پیش رفته، اما به‌علت نبود اتصال واقعی ERP/Backend و آزمون شبکه/دستگاه، محصول production-ready اعلام نمی‌شود.
