# CHANGELOG — AKHAVAN CRM b21

- نسخه محصول: 0.11.7؛ مبنا: `r11-cp9-b20`؛ نوع تغییر: افزایشی.
- اتصال evidence وظیفهٔ وصول به `state.attachments` و `entityType=TASK` با kind مشخص؛ از سامانه پیوست موازی استفاده نشده است.
- allowlist: JPEG/PNG/WebP/PDF؛ سقف ۵ MiB؛ فایل خالی و نوع ناشناخته رد می‌شود.
- دریافت مدرک به وظیفهٔ انتخاب‌شده محدود و نیازمند بررسی دسترسی همان وظیفه است؛ audit محلی برای پیوست ثبت می‌شود.
- `npm test`: PASS؛ 500 assertion در suiteهای ثبت‌شده. `audit-actions`: PASS، 76/76 guarded. `audit:contracts`: PASS ایستا.
- Build/Lint و مرورگر واقعی هنوز تأیید نشده‌اند؛ این پیاده‌سازی client-side و local base64 است، نه امنیت production سمت سرور.

- افزودن تخصیص گروهی وظایف وصول از مشتریان انتخاب‌شده در زون؛ استفاده از همان task list، `processTaskCollaborationEvents` و مجوزهای `tasks.CREATE/ASSIGN`.
- جلوگیری از ساخت وظیفهٔ باز تکراری برای یک مشتری/زون؛ عملیات گروهی audit می‌شود. تا زمان اتصال ماندهٔ مالی معتبر، UI صریحاً اعلام می‌کند که انتخاب بر اساس عضویت زون است، نه اولویت مانده.
