# CHANGELOG b18 — RBAC configurability and audit

## تغییرات
- نسخهٔ محصول به `0.11.4` و release به `r11-cp9-b18` ارتقا یافت.
- تنظیمات پروفایل مجوز، محدودهٔ نقش، فضای کاری پیش‌فرض و نقش بالادست قابل تغییر شد.
- تنظیم سرپرست مستقیم برای کاربران افزوده شد.
- ثبت رخدادهای تغییر پیکربندی در audit log محلی اضافه شد.
- جلوگیری از چرخه در زنجیرهٔ نقش و سرپرستی افزوده شد.
- تست `tests/rbac-configurability.test.mjs` اضافه شد.
- مدل دامنهٔ زون، نسخه‌بندی هندسهٔ GeoJSON، اعتبارسنجی چندضلعی و تشخیص نقطه داخل زون در `src/lib/geoIntelligence.ts` افزوده شد.
- کاتالوگ ۸ سنجهٔ مکانی با واحد/منبع/تجمیع/جهت مطلوب تعریف شد؛ همه تا زمان اتصال منبع معتبر `available: false` هستند تا دادهٔ ساختگی به Heatmap تبدیل نشود.
- مجموعه‌های مکانی به AppState و integrity normalization افزوده شدند؛ هیچ جدول جدید یا دادهٔ seed ساختگی اضافه نشده است.
- تست `tests/geoIntelligence.test.mjs` برای مرز polygon، نسخه‌بندی و تعاریف سنجه افزوده شد.
- گزارش `RBAC_AUDIT_b18.md` و فایل‌های STATUS/NOT_DONE به‌روز شدند.

## اعتبارسنجی
- `npm test`: PASS، 446 assertion.
- `npm run audit:contracts`: PASS (static-only).
- Syntax/transpile سه فایل تغییرکرده: PASS.
- Build/Lint: به‌علت نبود dependencies اجراپذیر نبودند؛ npm install با EAI_AGAIN شکست خورد.
- Browser/iOS/SQL Server runtime: اجرا نشده‌اند.
