# قرارداد یکپارچگی دامنه — AKHAVAN CRM b28

این سند قرارداد اجرایی/ممیزی است، نه ادعای اتصال زنده. وضعیت هر پیوند باید فقط پس از اجرای API و آزمون SQL/ERP واقعی به «تأییدشدهٔ عملیاتی» تغییر کند.

## 1) زنجیرهٔ مرجع و مالکیت داده

| موجودیت مبدأ → مقصد | شناسه/پیوند مرجع | منبع حقیقت | وضعیت فعلی | شرط پذیرش عملیاتی |
|---|---|---|---|---|
| Customer/Account → Activity/Task | AccountId + tenant/scope | CRM | UI/state محلی؛ نیازمند API | جلوگیری از ارجاع بین tenantها؛ audit برای create/update/complete |
| Account → Quote | Quote.AccountId؛ tenant-consistent FK | CRM | lifecycle و قراردادها موجود؛ runtime API تأیید نشده | مشتری فعال، مالک مجاز، optimistic concurrency و ثبت تغییر وضعیت |
| Quote → NegotiationScenario | QuoteId یا SalesOrderId، نه هر دو | CRM | موتور سناریو در کلاینت؛ persistence سروری تأیید نشده | snapshot قیمت/اقلام، دلیل، زمان انقضا؛ قبول سناریو فقط با محاسبهٔ مجدد |
| Quote → SalesOrder | تبدیل صریح با شناسهٔ مرجع Quote؛ تبدیل نباید Quote را Order معرفی کند | CRM تا handoff؛ ERP بعد از پذیرش | قرارداد SQL برای SalesOrder موجود؛ API/تبدیل انتهابه‌انتها تأیید نشده | idempotency key، جلوگیری از تبدیل تکراری، ذخیرهٔ quote revision و رویداد audit |
| SalesOrder → SalesOrderLine | SalesOrderId + TenantId | CRM | مدل SQL در migration 008 | جمع خطوط = Subtotal/DiscountTotal/NetAmount؛ مقدار منفی/تغییر tenant رد شود |
| SalesOrder → DispatchPlan | OrderId/DispatchPlanId یا جدول اتصال صریح | سامانهٔ عملیات/ERP برای تخصیص واقعی | رابط فعلی صراحتاً آزمایشی است؛ پیوند SQL عملیاتی اثبات نشده | تخصیص فقط به سفارش مجاز و تأییدشده؛ ظرفیت/وزن واقعی از منبع معتبر؛ وضعیت تحویل از رویداد معتبر |
| DispatchPlan → ERP delivery | ExternalId + source system + idempotency | ERP/TMS | متصل نیست | retry امن، عدم ارسال تکراری، تطبیق وضعیت و ثبت خطای قابل پیگیری |
| ERP InvoiceMirror → PaymentAllocation/CreditNoteMirror | ExternalInvoiceId/InvoiceMirrorId + TenantId | ERP برای فاکتور و credit؛ CRM برای allocation تا زمان طراحی مرجع مشترک | reconciliation محلی/قرارداد ایستا؛ sync واقعی متصل نیست | allocation معتبر و غیرتکراری؛ credit فقط از mirror معتبر و POSTED/APPROVED؛ مانده تطبیق‌پذیر |
| Receivable → collection Task | Invoice/Account ref + task evidence | ERP برای بدهی؛ CRM برای پیگیری | اولویت‌بندی عمداً تا اتصال منبع معتبر مسدود است | اولویت فقط با snapshot معتبر؛ نتیجهٔ پیگیری audit شود؛ تسویه با تسک به‌تنهایی ثبت نشود |
| Task/Workflow → Notification | event id + recipient/scope | CRM/API | اعلان زندهٔ سروری تأیید نشده | dedupe event، ترجیحات/مجوز گیرنده، read receipt سروری |
| تمام mutationها → Audit | entity type/id, actor, action, timestamp, correlation id | API/server | guard و audit محلی موجود؛ قابل اعتماد بودن کلاینت کافی نیست | ثبت سمت سرور و غیرقابل‌دستکاری برای رویدادهای حساس |

## 2) وضعیت‌ها و قواعد قطعی

- Quote: `DRAFT → PENDING_APPROVAL → APPROVED → SENT → ACCEPTED → HANDOFF_EXTERNAL`. هر گذار باید مجوز، نسخهٔ رکورد و رویداد audit داشته باشد؛ رد/لغو باید دلیل داشته باشد. پذیرش Quote مساوی صدور فاکتور یا ثبت سفارش ERP نیست.
- SalesOrder: وضعیت‌های مجاز در migration باید مرجع باشد؛ تغییر به `SENT_TO_ERP` فقط پس از پذیرش Outbox/connector و تأیید server-side ثبت شود، نه با کلیک UI.
- NegotiationScenario: فقط `SUGGESTED/ACCEPTED/REJECTED/EXPIRED`; پیشنهاد سود با `UNKNOWN/PARTIAL` نباید سود قطعی نشان دهد. قبول سناریو باید قیمت و اعتبار را دوباره محاسبه کند.
- DispatchPlan: وضعیت‌های migration مرجع‌اند. رابط فعلی عملیات پخش برچسب «آزمایشی» دارد؛ تحویل آزمایشی نباید به‌عنوان اثبات تحویل واقعی یا GPS تلقی شود.
- Invoice/Payment/Credit: فاکتور و credit mirror فقط‌خواندنی از ERP؛ PaymentAllocation منبع تخصیص CRM است و باید مجموع تخصیص از مبلغ دریافتی/فاکتور تجاوز نکند. تسویهٔ حساب از یک Task یا یادداشت به‌تنهایی مجاز نیست.

## 3) قرارداد یکپارچه‌سازی سمت سرور (هنوز پیاده‌سازی/اتصال نشده)

هر command حساس باید شامل `tenantId` (از هویت تأییدشده، نه payload قابل‌اعتماد)، `actorId`، `correlationId`، `idempotencyKey`، `expectedRowVersion` و payload schema-versioned باشد. API باید مجوز را مجدداً سمت سرور ارزیابی کند، FK/tenant consistency را در SQL enforce کند، audit/outbox را در همان تراکنش بنویسد و ارسال ERP را خارج از تراکنش با worker قابل retry انجام دهد.

Outbox حداقل به `EventId`, `TenantId`, `AggregateType`, `AggregateId`, `EventType`, `SchemaVersion`, `IdempotencyKey`, `Payload`, `CreatedAtUtc`, `AttemptCount`, `NextAttemptAtUtc`, `Status`, `LastError`, `CorrelationId` نیاز دارد. Consumer باید deduplicate کند. رازها/اطلاعات حساس نباید در payload/log ذخیره شوند. تا وقتی API، هویت سرویس و ERP endpoint در اختیار نیست، این قرارداد اجراشده محسوب نمی‌شود.

## 4) معیارهای پذیرش پیش از production

1. آزمون منفی tenant isolation برای تمام جدول‌های جدید/موجود و تمام APIها.
2. آزمون race/RowVersion برای ویرایش Quote، Order، Scenario و DispatchPlan.
3. تکرار یک درخواست با IdempotencyKey یک نتیجهٔ واحد ایجاد کند؛ retry پس از timeout نیز duplicate نسازد.
4. تست سناریوهای رد/لغو/ویرایش، partial ERP outage، dead-letter/replay و reconciliation.
5. تطبیق totals و currency precision با ERP؛ discrepancy به صف رسیدگی برود و بی‌صدا اصلاح نشود.
6. سنجش 100k رکورد با دادهٔ واقعی/شبه‌واقعی، server pagination و virtualization؛ بدون benchmark ادعای ظرفیت ممنوع.
7. WCAG keyboard/screen reader/contrast و Safari iOS safe-area/touch روی دستگاه واقعی.
8. اعتبارسنجی UI atmosphere در dawn/morning/sunset/night با reduced-motion، low mode و آزمون حرارتی/باتری واقعی.

## 5) موانع خارجی که از داخل سورس قابل رفع نیستند

- دسترسی به registry برای نصب dependency و build؛
- محیط Chromium/Safari/iPhone و دستگاه فیزیکی؛
- SQL Server آزمایشی با tenantهای مستقل و مجوز اجرای migration/RLS؛
- API/BFF، روش احراز هویت سرویس، endpoint و مستندات ERP؛
- endpoint احرازشدهٔ SignalR/WebSocket و object storage؛
- منبع معتبر موجودی، هزینه، وزن کالا و تاریخچهٔ خرید برای تحلیل‌های پیش‌بینانه.

بدون این موارد می‌توان قرارداد و guardهای محلی را تکمیل کرد، اما نمی‌توان صداقتاً گفت اتصال زنده، امنیت سروری یا آزمون دستگاه انجام شده است.
