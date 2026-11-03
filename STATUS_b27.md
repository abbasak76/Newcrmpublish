# وضعیت — AKHAVAN CRM b27

- نسخه: `0.12.3` — `r11-cp9-b27`، مبنا b26.
- انجام‌شده در این مرحله: افزودن لایه‌های ماه/ابر با حرکت بسیار آهسته، رعایت reduced-motion و حالت گرافیک کم‌مصرف؛ همگام‌سازی منبع نسخه؛ ثبت وضعیت تغییر در changelog و handoff.
- آزمون‌های اجراشده: `npm test` برابر 608 assertion PASS؛ `audit-actions` برابر 77/77 guarded؛ `audit:contracts` ایستا PASS. Lint و build به علت dependencyهای نصب‌نشده BLOCKED هستند.
- SQL/مدل‌های SalesOrder، NegotiationScenario، DispatchPlan و SalesOrderLine در migration موجود `008_sales_dispatch_extension.sql` هستند؛ در این مرحله جدول تکراری اضافه نشده است.
- محدودیت مهم: ظاهر دقیق روی Safari/iPhone، مصرف واقعی GPU/باتری، build کامل، SQL Server runtime، API/ERP و realtime server هنوز آزمایش نشده‌اند.
