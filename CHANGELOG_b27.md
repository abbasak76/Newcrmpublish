# CHANGELOG — AKHAVAN CRM b27

- نسخه محصول: `0.12.3`؛ بسته `r11-cp9-b27`؛ مبنا b26. تغییرات افزایشی‌اند و فایل‌های تاریخی b26 حفظ می‌شوند.
- هالهٔ جوی: افزودن ماه کم‌نور و سه لایه ابر/مه با حرکت بسیار آهسته (۹۶ و ۱۳۲ ثانیه) برای نزدیک‌شدن به حس عمق آسمان در مرجع iOS Weather؛ افکت‌ها decorative و پشت محتوا هستند.
- کاهش مصرف: حرکت ابر فقط در حالت `auto/high` و وقتی `prefers-reduced-motion` فعال نیست؛ حالت low افکت‌ها را کم می‌کند و reduced motion حرکت را متوقف می‌کند. عملکرد واقعی GPU/دما/باتری در iPhone هنوز اندازه‌گیری نشده.
- رفع ناسازگاری نسخه: `package.json`, `metadata.json`, `src/lib/version.ts`, `VERSION.md` و handoff همگام می‌شوند.
- ممیزی ساختار: جدول‌های `crm.SalesOrder`, `crm.NegotiationScenario`, `crm.DispatchPlan` و `crm.SalesOrderLine` از قبل در migration `008_sales_dispatch_extension.sql` وجود داشتند؛ جدول موازی ایجاد نشد. این migration همچنان باید روی SQL Server واقعی اجرا و اعتبارسنجی شود.
