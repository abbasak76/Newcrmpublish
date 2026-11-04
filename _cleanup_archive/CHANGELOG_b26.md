# CHANGELOG — AKHAVAN CRM b26

- نسخه محصول: `0.12.2`؛ بسته `r11-cp9-b26`؛ مبنا b24 با تغییرات b25/b26 حفظ‌شده. هیچ قابلیت قبلی حذف نشده است.
- تمام تغییرات b25 حفظ شده‌اند: نقشهٔ کاشی‌ای با رسم polygon لمسی، انتخاب/آزمون UI برای provider، مدل read-only بستانکاری ERP، گردش جداگانه درخواست بستانکاری و اولویت وصول مشروط به تطبیق معتبر.
- تنظیم اندازهٔ رابط در Settings: `normal` (16px)، `large` (18px) و `extra-large` (20px) روی root اعمال می‌شود و از state موجود برنامه پیروی می‌کند.
- کیفیت گرافیک دستی/خودکار: `auto/high/low`; حالت low انیمیشن/بافت تزئینی هاله را سبک می‌کند؛ `prefers-reduced-motion` سیستم‌عامل همیشه رعایت می‌شود.
- `DynamicFormRenderer` از پیش‌نویس محلی خودکار با کلید user/schema/record، بازیابی هنگام بازگشت، پاک‌سازی پس از ارسال موفق و نگهداری پیش‌نویس در صورت خطای submit پشتیبانی می‌کند. فیلدهای دارای نام credential-like (password/token/secret/nationalCode/bankAccount/cardNumber/OTP) موجب غیرفعال شدن autosave برای کل آن فرم می‌شوند. این ذخیره‌سازی محلی است، نه سرور.
- `LiveAnnouncer` در سطح برنامه اضافه شد؛ خطاهای اعتبارسنجی فرم با اعلان assertive و submit معتبر با اعلان polite به فناوری‌های کمکی اعلام می‌شوند.
- `npm test`: PASS؛ 597 assertions. `audit-actions`: 77/77 guarded. `audit:contracts`: PASS static-only. Syntax transpilation: PASS برای 12 فایل تغییرکرده.
- Build/TypeCheck/Lint، browser/Safari/iOS، آزمون واقعی tile، SQL Server runtime، API/RLS و ERP end-to-end هنوز تأیید نشده‌اند.
