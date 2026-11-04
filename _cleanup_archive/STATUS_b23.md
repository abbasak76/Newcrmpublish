# STATUS — AKHAVAN CRM b23

- نسخه: `0.11.9` — `r11-cp9-b23`؛ مبنا b22.
- گزارش وصول اکنون شامل KPIها، تفکیک مسئول و نتیجه، جدول جزئیات task/customer، خروجی خلاصه CSV، خروجی تفصیلی CSV و فیلتر بازه تاریخ است.
- فیلتر تاریخ شامل هر دو روز ابتدا/انتهاست؛ برای وظیفه دارای نتیجه، تاریخ آخرین نتیجه و برای وظیفه بدون نتیجه، تاریخ ایجاد ملاک است.
- وصول فقط از payment CLEARED همان مشتری و با مبلغ مثبت استخراج می‌شود؛ پرداخت‌های تکراری بین taskها دوباره شمرده نمی‌شوند.
- `npm test`: PASS؛ 531 assertion بر اساس خروجی suiteها.
- `audit-actions`: PASS (76/76 guarded). `audit:contracts`: PASS ایستا (9 SQL files, 46 tables, 44 tenant-scoped, 44 RLS targets, 5 required views).
- TypeCheck/Build: همچنان مسدود در این محیط به دلیل نبود `vite/client` و executable `vite`; اجرای کامل در محیط دارای dependency لازم است.
- محصول هنوز production-ready نیست: API authorization، SQL Server runtime/RLS، ذخیره امن فایل سمت سرور، نقشه واقعی و تست iOS/Safari باقی‌اند.
