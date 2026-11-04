# STATUS — AKHAVAN CRM b24

- نسخه: `0.12.0` — `r11-cp9-b24`؛ مبنا b23.
- گزارش وصول زون: KPI، مسئول، نتیجه، جزئیات task/customer، خروجی CSV خلاصه/تفصیلی و فیلتر بازه تاریخ.
- ممیزی مالی زون: تخصیص‌های معتبر از `PaymentAllocation` با بررسی پرداخت `CLEARED`، تطبیق مشتری، مبلغ مثبت، رکوردهای موجود و کنترل over-allocation محاسبه می‌شوند؛ مغایرت با `invoice.balance` گزارش می‌شود.
- این پنل صرفاً کیفیت داده را تشخیص می‌دهد. به علت نبود مدل معتبر Credit Note/بستانکاری، خروجی پیش از بستانکاری است، `authoritative=false` و برای اولویت‌بندی وصول/گزارش رسمی استفاده نمی‌شود.
- `npm test`: PASS؛ 553 assertion بر اساس خروجی suiteها. `audit-actions`: PASS 76/76 guarded. `audit:contracts`: PASS ایستا. Syntax transpilation فایل‌های تغییرکرده: PASS.
- TypeCheck: BLOCKED با `TS2688` (نبود `vite/client`). Build: BLOCKED (`vite: not found`). مرورگر، iPhone/Safari، SQL Server واقعی، API/RLS و ERP اجرا نشده‌اند.
- وضعیت محصول: توسعه‌ای؛ production-ready اعلام نمی‌شود.
