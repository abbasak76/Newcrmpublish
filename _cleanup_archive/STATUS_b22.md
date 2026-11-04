# STATUS — AKHAVAN CRM b22

- نسخه: `0.11.8` — `r11-cp9-b22`؛ مبنا: b21.
- توسعهٔ این دور: گزارش عملکرد وصول زون، تفکیک وضعیت و نتیجه، تجمیع بر اساس مسئول، خروجی CSV، حذف دوباره‌شماری پرداخت‌ها، اعتبارسنجی مجدد منبع مبلغ از پرداخت CLEARED، خنثی‌سازی CSV formula injection و اعمال scope مشاهدهٔ task در فهرست گزارش.
- رفع: `rbac` اکنون به‌صراحت از `useCan` دریافت می‌شود؛ این مشکل پیش‌تر در کد workspace به شناسهٔ تعریف‌نشده منجر می‌شد.
- آزمون‌ها: `npm test` PASS پس از اضافه‌شدن suite گزارش؛ `audit-actions` PASS (76/76 guarded)؛ `audit:contracts` PASS ایستا فقط.
- TypeCheck: هنوز مسدود است؛ اجرای `tsc --noEmit` با خطای `TS2688: Cannot find type definition file for 'vite/client'` متوقف شد. Build/Lint و مرورگر/iOS واقعی در این محیط تأیید نشده‌اند.
- امنیت: scope کلاینتی به‌تنهایی جایگزین Backend/API authorization یا SQL Server RLS نیست.
- وضعیت محصول: نسخهٔ توسعه‌ای؛ production-ready اعلام نمی‌شود.
