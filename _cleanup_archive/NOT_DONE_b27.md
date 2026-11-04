# موارد باقی‌مانده — AKHAVAN CRM b27

این فایل ادامهٔ بدون حذف `NOT_DONE_b26.md` است؛ برای فهرست کامل همهٔ موارد باز، فایل b26 را هم بخوانید.

## P0 — تأیید فنی پیش از انتشار
- [ ] نصب dependencyها در محیط دارای registry؛ رفع خطاهای واقعی TypeScript و اجرای `npm run lint`, `npm run build`.
- [ ] Smoke test واقعی Chromium و Safari/iPhone، شامل RTL، safe area، keyboard، touch، zoom/reflow و فرم‌ها.
- [ ] بررسی بصری هالهٔ جدید در دستگاه واقعی؛ ماه/ابر با تصویر مرجع مقایسه شود و خوانایی همهٔ صفحه‌ها تأیید شود.
- [ ] سنجش GPU/FPS/باتری/حرارت در حالت auto/high/low و reduced motion.
- [ ] اجرای migrationهای 008/009 و تست RLS منفی، tenant isolation و rowversion روی SQL Server تستی.

## P1 — یکپارچگی دامنه
- [ ] ممیزی موردبه‌مورد روابط Customer → Quote/NegotiationScenario → SalesOrder/Lines → DispatchPlan → ERP/InvoiceMirror → Invoice/PaymentAllocation/Receivable → Tasks/Notifications/Audit.
- [ ] برای هر رابطه، FK/شناسه مرجع، وضعیت مجاز، مالکیت، idempotency، رویداد audit، رفتار لغو/رد/ویرایش و معیار پذیرش ثبت شود.
- [ ] API/BFF و اتصال واقعی ERP، outbox/retry، mapping شناسه‌ها و تطبیق مانده/اقلام پیاده‌سازی و end-to-end تست شوند.
- [ ] Realtime chat/notifications فقط پس از وجود endpoint امن و احراز هویت سرور؛ offline queue و object storage همچنان باز هستند.
- [ ] Virtualization و تحلیل churn/next purchase/stock aging تنها پس از اتصال منبع واقعی و آزمون کارایی.

## P2 — دسترس‌پذیری و امنیت
- [ ] VoiceOver/NVDA، keyboard-only، کنتراست WCAG و storage quota/privacy mode.
- [ ] بازبینی امنیتی localStorage draft، retention، attachment scanning و server authorization.

هیچ‌یک از موارد بالا صرفاً به‌دلیل وجود رابط یا قرارداد استاتیک، انجام‌شده تلقی نمی‌شوند.
