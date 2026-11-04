# STATUS — AKHAVAN CRM b18

- نسخه: `0.11.4` — `r11-cp9-b18`
- مبنا: b16 (کد محصول افزایشی؛ اسناد ممیزی b17 حفظ شده‌اند).
- انجام‌شده در این دور: قابل‌تنظیم کردن CapabilityPermissionهای پروفایل، محدوده/فضای کاری/نقش بالادست، سرپرست مستقیم کاربران، ثبت audit محلی، جلوگیری از چرخه‌های مدیریتی؛ مدل دامنهٔ GeoJSON polygon، نسخه‌بندی هندسه و کاتالوگ ۸ سنجهٔ مکانی با fail-closed availability؛ تست‌های RBAC و Geo.
- آزمون: `npm test` PASS؛ 423 assertion. `npm run audit:contracts` PASS (static-only). TypeScript transpile syntax PASS.
- مسدود: Build و Lint به علت عدم نصب وابستگی‌ها؛ npm install به دلیل `EAI_AGAIN` در registry. مرورگر/iOS و SQL Server اجرا نشده‌اند.
- هوش مکانی: مدل دامنه، اعتبارسنجی polygon، point-in-polygon، نسخه‌بندی هندسه و کاتالوگ سنجه‌ها پیاده شده‌اند؛ نقشهٔ UI، tile provider، رسم/ویرایش روی نقشه، چاپ، تخصیص مشتری و اتصال داده‌های واقعی هنوز باقی است. مشخصات و معیارهای پذیرش در `docs/06_MASTER_AUDIT_AND_TRACEABILITY_b17.md` ثبت است؛ نقشه/چندضلعی/Heatmap متصل به داده واقعی هنوز پیاده‌سازی نشده.
- وضعیت کلی: یک گام اجرایی روی RBAC انجام شد؛ پروژه کامل نیست و نباید آمادهٔ اتصال تولیدی/SQL معرفی شود.
