# وضعیت نسخه b37 — Task Intelligence & Mention Architecture

## تغییرات پیاده‌سازی‌شده در سورس
- `src/config/operations.ts`: تنظیمات مرکزی ظرفیت، SLA، وزن اولویت، TTL و debounce.
- `src/services/taskIntelligence.ts`: دسته‌بندی FINANCE/LOGISTICS/SALES/GENERAL، امتیاز فوریت، ظرفیت بر اساس تعداد و امتیاز، یافتن روز کاری بعدی، SLA و پیشنهاد سرریز/تفویض بدون تغییر خودکار خاموش.
- `src/components/TasksWorkspace.tsx`: هشدار ظرفیت قبل از ثبت تسک جدید، پیشنهاد انتقال به تاریخ خالی، و مسیر ارجاع اجباری فقط با مجوز `tasks.ASSIGN`; جست‌وجوی debounced؛ SLA و امتیاز اولیه روی تسک جدید.
- `src/services/taskAccessEngine.ts`: زنجیره سرپرست، سطح دسترسی FULL_DETAILS/METRICS_ONLY/NONE و کنترل cross-department سمت کلاینت. این helper جایگزین مجوز سمت سرور نیست.
- `src/services/mentionEngine.ts` و `DynamicFormRenderer.tsx`: پیشنهاد منشن چندموجودیتی در عنوان تسک از داده‌های در دسترس CRM؛ انتخاب منشن، مرجع ساختاریافته را به payload فرم اضافه می‌کند.
- `src/services/erpContextService.ts`: قرارداد استعلام on-demand و TTL cache با تزریق fetcher؛ در نبود آداپتور صریحاً خطا می‌دهد و داده زنده جعلی تولید نمی‌کند.
- `database/sqlserver/v1/012_task_intelligence_and_mentions.sql`: مهاجرت افزایشی برای ManagerUserId، وزن و نوع تسک، ظرفیت روزانه، ACL تسک، منشن‌ها، کش کانتکست و افزودن فیلترهای tenant به RLS موجود.
- تست‌های جدید: `taskIntelligence`, `mentionEngine`, `taskAccessEngine`, `erpContextService`, `taskArchitectureContracts`.

## نتایج آزمون
- `npm test`: PASS در محیط فعلی، شامل تست‌های پیشین و تست‌های جدید.
- `npm run audit:contracts`: PASS در سطح استاتیک: ۱۲ فایل SQL، ۵۵ جدول، ۵۳ جدول tenant-scoped/RLS و ۵ نمای الزامی.

## مواردی که صادقانه هنوز عملیاتی/تأییدشده نیستند
- Migration 012 روی SQL Server واقعی اجرا نشده؛ به‌ویژه صحت اعمال ALTER SECURITY POLICY و migration روی نسخه/تنظیم واقعی SQL Server نیازمند اجرای آزمایشی است.
- سرویس ERP فقط adapter contract است؛ URL، احراز هویت، credential امن سمت سرور، endpointهای مانده/چک/ویزیت و connector واقعی در اختیار نیست. `ContextCache` صرفاً مدل ذخیره‌سازی پیشنهادی است؛ این سرویس فعلاً کش حافظه‌ای است، نه Redis.
- منشن در این نسخه در فرم عمومی و عنوان تسک فعال است؛ همه فرم‌ها/صفحات هنوز مصرف‌کننده آن نشده‌اند. جست‌وجو در چک‌ها و اسناد فقط روی داده‌های محلی/آینه موجود است، نه استعلام زنده ERP.
- ACL و سلسله‌مراتب جدید در helper کلاینت پیاده شده‌اند؛ enforcement امنیتی کامل نیازمند API/DB فعال، تعیین هویت سمت سرور و آزمون RLS با SESSION_CONTEXT است.
- TSP واقعی، محاسبه مسیر روی سرویس نقشه، batch routing با زمان سفر و ETA هنوز پیاده نشده؛ در این نسخه فقط گروه‌بندی تسک بر اساس منطقه و مرتب‌سازی بر اساس امتیاز فراهم است.
- انتقال تاریخ و تفویض، پیشنهاد UI هستند؛ بدون تأیید کاربر تغییر نمی‌دهند. اخطار اشباع در فرم تسک فعال است، ولی پایش SLA پس‌زمینه و escalation scheduler هنوز به worker/backend نیاز دارد.
- Zod/React Hook Form و TanStack Virtual اضافه نشده‌اند: پروژه فعلی موتور فرم پویا و اعتبارسنجی مرکزی خود را دارد و وابستگی‌های جدید در محیط بدون نصب/آزمون اضافه نشدند. مجازی‌سازی سراسری فهرست‌ها و چهار حالت UI در همه صفحات هنوز کامل نیست.
- Supabase جایگزین نشده؛ هیچ پروژه/کلید/سیاست RLS واقعی ارائه نشده است. افزودن client-side key یا مهاجرت یک‌باره، بدون طرح مالکیت داده و سرور امن، ریسک امنیتی دارد.
- `npm run build` و `npm run lint` باید در محیطی با وابستگی‌های نصب‌شده دوباره اجرا شوند؛ این محیط فاقد `vite/client` و Vite نصب‌شده است.

## قواعد حفظ‌شده
- CRM مرجع نهایی حسابداری نیست؛ داده‌های رسمی مالی و فاکتور از ERP می‌آیند.
- هیچ endpoint، credential، داده زنده، ETA یا موفقیت integration جعل نشده است.
- migration افزایشی است و به اجرای آزمایشی قبل از production نیاز دارد.
