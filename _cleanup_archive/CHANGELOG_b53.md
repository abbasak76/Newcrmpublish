# Changelog b53 — Source Surface Audit

- افزودن `scripts/audit-source-surface.mjs` برای ساخت گراف import استاتیک از `src/main.tsx`.
- افزودن `SOURCE_SURFACE_AUDIT.json` با فهرست کاندیداهای بدون مسیر import استاتیک.
- افزودن تست `tests/sourceSurfaceAudit.test.mjs` و فرمان `npm run audit:source`.
- افزودن گزارش تفصیلی `SOURCE_AUDIT_REPORT_b53.md` با مسیرهای Router، موتورهای فاقد ورودی UI و محدودیت‌های اتصال.
- هیچ قابلیت یا فایل مشکوکی حذف نشد؛ موارد بدون مسیر به‌عنوان کاندیدا برای تصمیم‌گیری مستند شدند.
- همگام‌سازی نسخه به 0.12.27.
