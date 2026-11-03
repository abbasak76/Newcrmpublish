# AKHAVAN CRM — مستندات مرجع

برای توسعه، فقط این مجموعهٔ کوچک را دنبال کن:

1. [`01_PRODUCT_AND_ARCHITECTURE.md`](./01_PRODUCT_AND_ARCHITECTURE.md) — مأموریت، معماری، خطوط قرمز و قواعد AI.
2. [`02_DESIGN_SYSTEM.md`](./02_DESIGN_SYSTEM.md) — Solar Ember، توکن‌ها و قواعد UX.
3. [`03_BACKEND_DATA_AND_INTEGRATIONS.md`](./03_BACKEND_DATA_AND_INTEGRATIONS.md) — مدل داده، SQL Server، Backend و ERP.
4. [`04_AUDIT_CHANGES_AND_NEXT_STEPS.md`](./04_AUDIT_CHANGES_AND_NEXT_STEPS.md) — ممیزی جاری، تاریخچه، وضعیت آزمون و کارهای باقی‌مانده.
5. [`05_OPERATIONS_CENTER_TEST_GUIDE.md`](./05_OPERATIONS_CENTER_TEST_GUIDE.md) — نحوه seed داده‌های FMCG و آزمون سفارش، پخش، برگشت و گزارش.
6. [`06_MASTER_AUDIT_AND_TRACEABILITY_b17.md`](./06_MASTER_AUDIT_AND_TRACEABILITY_b17.md) — ممیزی جامع، ردیابی بندبه‌بند، مشخصات کامل هوش مکانی، معیارهای پذیرش و فهرست انجام‌شده/باقی‌مانده.

ورود سریع: [`../HANDOFF.md`](../HANDOFF.md). نسخه: [`../VERSION.md`](../VERSION.md).

**قاعدهٔ تقدم:** بخش «وضعیت جاری» ابتدای هر سند مرجع است. متن‌های منبع که در همان سند زیر عنوان «منابع تاریخی ادغام‌شده» آمده‌اند برای حفظ سابقه‌اند؛ ادعاهای تاریخی بدون تأیید مجدد، وضعیت جاری محسوب نمی‌شوند.

## آخرین تحویل
برای نسخه جاری b16 ابتدا `../HANDOFF.md`، `../CHANGELOG_b16.md` و `../NOT_DONE_b16.md` را بخوانید. ب16 روی ب15 به‌صورت افزایشی ساخته شده و نمای مالی/خزانه/هزینه و seed حجیم‌تر را اضافه می‌کند؛ این نسخه هنوز build و پذیرش مرورگر واقعی ندارد.


## آخرین افزوده مستنداتی
`../STATUS_b17_audit.md`, `../NOT_DONE_b17_audit.md` و `../CHANGELOG_b17_audit.md` وضعیت این دور را توضیح می‌دهند. این افزوده فقط مستندات است و به معنی پیاده‌سازی قابلیت‌های جدید نیست.

## آخرین نسخه اجرایی — b18
نسخهٔ جاری `0.11.4 / r11-cp9-b18` است. ابتدا `../HANDOFF.md`, `../STATUS_b18.md`, `../NOT_DONE_b18.md`, `../CHANGELOG_b18.md` و `../RBAC_AUDIT_b18.md` را بخوانید. b18 پیکربندی پروفایل مجوزها، محدوده و سلسله‌مراتب نقش‌ها و سرپرست مستقیم را قابل تنظیم کرده و لایهٔ دامنهٔ polygon/نسخه‌بندی/کاتالوگ سنجه‌های هوش مکانی را آغاز کرده است. تست‌های واحد و ممیزی‌های ایستا موفق‌اند؛ Build/Lint به علت عدم امکان نصب dependency در محیط اجرا مسدود مانده و آزمون واقعی مرورگر/iOS/SQL انجام نشده است.

## آخرین وضعیت اجرایی
- آخرین نسخه سورس: `r11-cp9-b27` / `0.12.3`.
- ممیزی جاری: `09_MASTER_AUDIT_AND_TRACEABILITY_b27.md`.
- وضعیت و backlog: `../STATUS_b27.md`, `../NOT_DONE_b27.md`, `../TEST_RESULTS_b27.md`, `../CHANGELOG_b27.md`.
- `SalesOrder`, `NegotiationScenario`, `DispatchPlan` در migration موجود 008 تعریف شده‌اند؛ قبل از ایجاد ساختار جدید، همان قراردادها را بررسی و روی SQL Server تستی اجرا کنید.
