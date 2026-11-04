# نتایج اعتبارسنجی b47

- `npm test`: PASS پس از همگام‌سازی نسخه؛ suite موجود، ماتریس توسعه‌یافته گردش کار و آزمون قرارداد UI همگی موفق شدند.
- `npm run audit:contracts`: PASS استاتیک؛ 12 فایل SQL، 55 تعریف جدول، 53 جدول tenant/RLS target و 5 view الزامی.
- `npm run build`: BLOCKED — `vite: not found`؛ وابستگی‌ها در worktree نصب نیستند.
- `npm run lint`: BLOCKED — نوع `vite/client` قابل resolve نیست؛ وابستگی‌ها در worktree نصب نیستند.
- Browser/iOS E2E: NOT RUN.
- SQL Server runtime/RLS، ERP sandbox، push/messenger delivery، server audit و cross-device sync: NOT RUN؛ محیط/credential/سرویس واقعی موجود نیست.

**تفسیر:** PASS تست‌های Node و audit ایستا معادل تأیید production یا build نیست.
