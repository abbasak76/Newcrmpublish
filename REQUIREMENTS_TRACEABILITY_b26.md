# REQUIREMENTS TRACEABILITY — b19

| الزام | محل کد/سند | وضعیت فعلی | معیار پذیرش باقی‌مانده |
|---|---|---|---|
| حفظ معماری افزایشی و عدم ساخت موتور RBAC موازی | `src/lib/rbac.ts`, diff b18→b19 | رعایت شد در این دور | regression کامل پس از build |
| مجوز نقش قابل تنظیم | `src/types.ts`, `src/lib/rbac.ts`, `SettingsWorkspace.tsx`, tests | `geo.view/manage` افزوده و در UI مجوزها قابل تنظیم است | تست UI واقعی و API enforcement |
| scope مشتری | `GeoIntelligenceWorkspace.tsx` → `rbac.canActOnRecord` | client-side اعمال شده | تست همه scopeها و سرور/RLS |
| صفحه مستقل هوش مکانی | `src/App.tsx`, `src/lib/navigation.ts`, `GeoIntelligenceWorkspace.tsx` | پیاده و route-guard شده | browser/iOS |
| سه حالت زون/Heatmap/عملیات | `GeoIntelligenceWorkspace.tsx` | پوسته و رفتار پایه | Heatmap و عملیات هنوز منبع/موتور واقعی ندارند |
| تعریف نام/کد زون | `GeoIntelligenceWorkspace.tsx` | کد یکتا در state، نام اجباری | قید یکتا و validation سمت سرور |
| GeoJSON polygon | `src/lib/geoIntelligence.ts`, workspace | validation و preview شکل | نقشه واقعی، polygon self-intersection و تست داده واقعی |
| versioning و audit | `ZoneGeometryVersion`, `auditLogs` | محلی و نسخه‌دار | DB transaction, audit server-side, reload test |
| انتساب مشتری به زون | `isPointInsideZone`, `assignCustomersInZone` | فقط مختصات معتبر و مشتریان قابل مشاهده | بررسی کیفیت مختصات و داده واقعی |
| Heatmap مالی/فروش/برگشتی/وصول | `GEO_METRIC_CATALOG` | قرارداد سنجه موجود؛ عمداً disabled | منبع واحد، فرمول، freshness، تطبیق عددی |
| نقشهٔ ایران/tile provider | backlog و master audit | پیاده نشده | انتخاب/هزینه/مجوز/provider و آزمون ایران |
| تسک وصول و گزارش سرپرست | `GeoIntelligenceWorkspace.tsx` و `processTaskCollaborationEvents` | task برای یک مشتری با مسئول/ناظر/مهلت/اولویت به tasks موجود متصل است | ثبت نتیجه/مبلغ/evidence، batch, report drill-down و route/visit واقعی |
| چاپ/cross-filter/clustering | `NOT_DONE_b19.md` | پیاده نشده | پیاده‌سازی و آزمون کارایی |
| Build/Lint | اجرای واقعی ثبت‌شده در `STATUS_b19.md` | مسدود به علت dependency | نصب موفق و اجرای مجدد |
| Browser/iOS/SQL/ERP | `STATUS_b19.md` | اجرا نشده | محیط واقعی و evidence قابل تکرار |

برای مشخصات کامل، جزئیات سنجه‌ها، فیلترها، قواعد مالی، عملیات مسیر/ویزیت، سلسله‌مراتب نقش‌ها و تمام backlogهای محصول، به `docs/07_MASTER_AUDIT_AND_TRACEABILITY_b19.md` و `NOT_DONE_b19.md` رجوع شود. هیچ الزام صرفاً به علت ذکر شدن در جدول به‌عنوان انجام‌شده ثبت نشده است.


## الحاقیه b20 — نتیجهٔ وظیفهٔ وصول
| الزام | شاهد | وضعیت | محدودیت باقی‌مانده |
|---|---|---|---|
| انتخاب نتیجهٔ کنترل‌شده برای task وصول مکانی | `src/lib/collectionTaskOutcome.ts`, `GeoIntelligenceWorkspace.tsx` | پیاده‌سازی UI و helper | مرورگر واقعی و API enforcement تست نشده |
| علت نتیجه ناموفق | `validateCollectionTaskOutcome` | اجباری برای NO_PAYMENT/CUSTOMER_UNAVAILABLE/DISPUTED/NO_SHOW | taxonomy قابل پیکربندی و گزارش تحلیلی باقی است |
| تعهد به پرداخت و پیگیری بعدی | helper + فرم نتیجه | تاریخ پیگیری اجباری | reminder/SLA follow-up خودکار متصل نشده |
| مبلغ وصول | پرداخت همان مشتری، status=CLEARED، amount>0 | مبلغ دستی ممنوع؛ از رکورد پرداخت خوانده می‌شود | اثبات تخصیص به فاکتور/تطبیق دفترکل هنوز جداست |
| تاریخچه و audit | `resultHistory`, `GEO_COLLECTION_TASK_RESULT_RECORDED` | محلی و افزایشی | audit ضد‌دستکاری backend باقی است |
| فایل مدرک | فرم فعلی فقط یادداشت متنی | ناقص | پیوست فایل و کنترل دسترسی evidence باقی است |


## b21 — مدارک وظیفه وصول
- وضعیت: پیاده‌سازی کلاینتی با تست دامنه و قرارداد UI.
- شواهد: `src/lib/collectionTaskEvidence.ts`, `src/components/GeoIntelligenceWorkspace.tsx`, `tests/collectionTaskEvidence.test.mjs`, `tests/geoWorkspaceContracts.test.mjs`.
- معیارهای پوشش‌داده‌شده: allowlist MIME، سقف ۵ MiB، رد فایل خالی/نوع نامجاز، اتصال به همان task، scope check در دریافت، audit محلی.
- باقی‌مانده: ذخیره‌سازی امن سمت سرور، ضدبدافزار، retention، quota مجموع و آزمون مجوز backend.


## b22 delta — collection reporting
| Requirement | Implementation evidence | Test evidence | Status / boundary |
|---|---|---|---|
| Zone collection report by status and assignee | `src/lib/geoCollectionReporting.ts`; `GeoIntelligenceWorkspace.tsx` | `tests/geoCollectionReporting.test.mjs`; workspace contracts | Implemented client-side for currently visible tasks in selected zone |
| Collection amount must originate from valid payment record | Re-resolves payment ID and checks `CLEARED`, amount > 0, and same customer | Report tests reject pending/cross-customer payments | Does not replace invoice allocation/reconciliation |
| Prevent duplicate counting of the same payment | `countedPaymentIds` deduplication and latest-result attribution | duplicate-payment assertions | Local report only |
| Export report to spreadsheet | CSV with UTF-8 BOM and formula-cell neutralization | CSV export and formula-injection assertions | Export is client-side; no server audit yet |
| Task-level visibility | `rbac.canActOnRecord('tasks','VIEW', ...)` and customer visibility filter | static workspace contract assertion | Client-side only; API/RLS enforcement pending |


## b23 delta — drill-down, detail export and period filter
| Requirement | Implementation evidence | Test evidence | Status / boundary |
|---|---|---|---|
| Drill-down to task/customer | `CollectionReportDetail`; customer names resolve from visible customer records; task details shown in workspace | report unit tests and static workspace contracts | Implemented client-side for selected zone |
| Detailed export | `collectionReportDetailsToCsv` includes task/customer/assignee/status/due/outcome/valid payment fields | detail CSV assertions | Client-side CSV only |
| Inclusive date range | `filterCollectionTasksByPeriod`; result timestamp or creation date fallback | inclusive-boundary and empty-filter tests | Filter applies before aggregation and exports |
| Maintain source integrity | Recheck payment CLEARED, amount > 0 and same customer; payment ID dedupe | payment integrity and duplicate-count tests | Not an invoice-allocation/accounting reconciliation |


## b24 delta — receivable integrity diagnostics
| Requirement | Implementation evidence | Test evidence | Status / boundary |
|---|---|---|---|
| Use PaymentAllocation as allocation source | `src/lib/receivableReconciliation.ts` rebuilds invoice outstanding from valid allocations | `tests/receivableReconciliation.test.mjs` | Implemented as diagnostic only |
| Reject invalid allocation source | Checks payment/invoice existence, CLEARED state, same customer, positive amount, unique allocation ID | 20 reconciliation assertions | Implemented client-side |
| Detect over-allocation and balance mismatch | Payment/invoice over-allocation and stored-balance discrepancy issue codes | Unit tests | Implemented diagnostic |
| Account for credit notes | Model/source not present; helper returns `authoritative:false` | Explicit blocker assertion | Not done; prevents ranking from using incomplete values |

---

## افزوده‌های b25 — نقشه و بستانکاری/اولویت وصول

| الزام | وضعیت b25 | شواهد سورس | محدودیت باقی‌مانده |
|---|---|---|---|
| نقشهٔ واقعی با tiles | پیاده‌سازی فرانت‌اند | `src/components/GeoZoneMapEditor.tsx` | tile واقعی از این محیط به‌دلیل DNS قابل آزمون نبود؛ مرورگر هنوز لازم است |
| نقشهٔ ایران | پیاده‌سازی اولیه | مرکز اولیه 53E/32N و tiles جغرافیایی | پوشش و برچسب فارسی/مرز رسمی ایران باید در مرورگر بررسی شود |
| رسم polygon لمسی | پیاده‌سازی | pointer capture/down/move/up؛ خروجی GeoJSON | آزمون واقعی iPhone/Safari و polygon پیچیده باقی است |
| انتخاب/آزمون provider | پیاده‌سازی UI | OSM Standard، XYZ سفارشی HTTPS، test tile و attribution | انتخاب تجاری نهایی/SLA/قیمت و آزمون شبکه واقعی باقی است |
| منبع بستانکاری | SQL از قبل موجود؛ مدل فرانت‌اند افزوده | `CreditNoteMirror`, `analytics.vw_InvoiceBalance`, `006_row_level_security.sql`; `src/types.ts` | اتصال API/Sync واقعی انجام نشده؛ `creditNoteSourceStatus` فقط توسط همگام‌سازی معتبر باید CONNECTED شود |
| گردش درخواست بستانکاری | پیاده‌سازی محلی | `CreditNoteRequest` در `FinanceWorkspace.tsx` | درخواست محلی سند مالی نیست و مانده را تغییر نمی‌دهد؛ اتصال ERP باقی است |
| تطبیق مانده | پیاده‌سازی و آزمون دامنه | `src/lib/receivableReconciliation.ts` و `tests/receivableCredits.test.mjs` | دادهٔ واقعی SQL/ERP و اختلاف decimal/currency هنوز آزمون نشده |
| اولویت وصول بر مبنای مانده | پیاده‌سازی مشروط | جدول رتبه‌بندی و تخصیص اولویت هنگام ساخت task در `GeoIntelligenceWorkspace.tsx` | تا source CONNECTED و reconciliation بدون issues، رتبه‌بندی مسدود است |
| آزمون‌ها | PASS | `TEST_RESULTS_b25.md` | Build/TypeCheck/Browser/SQL runtime هنوز تأیید نشده |

---

## افزوده‌های b26 — دسترس‌پذیری و فرم‌ها

| الزام | وضعیت b26 | شواهد | محدودیت باقی‌مانده |
|---|---|---|---|
| مقیاس رابط برای کم‌بینایی | پیاده‌سازی فرانت‌اند | `App.tsx`, `SettingsWorkspace.tsx`; 16/18/20px | آزمون reflow و VoiceOver/NVDA واقعی باقی است |
| کیفیت گرافیک دستی/خودکار | پیاده‌سازی فرانت‌اند | `AtmosphereLayer.tsx`, `index.css`, تنظیمات `auto/high/low` | FPS/battery واقعی روی iPhone/دستگاه ضعیف اندازه‌گیری نشده |
| ذخیرهٔ خودکار فرم پویا | پیاده‌سازی با guard | `DynamicFormRenderer.tsx`; per-user/schema/record localStorage key; restore/clear after success | محلی و غیرتضمینی؛ بررسی امنیت storage و quota باقی است |
| جلوگیری از ذخیره credential-like form | پیاده‌سازی guard | حساسیت نام فیلدهای password/token/secret/national code/bank/card/OTP | باید schemaهای واقعی و نام‌گذاری فیلدها در audit تکمیل شود |
| اعلام خطای فرم برای screen reader | پیاده‌سازی فرانت‌اند | `LiveAnnouncer.tsx`, `DynamicFormRenderer.tsx`, App root | آزمون VoiceOver/NVDA واقعی باقی است |
| تست انتشار | ناقص | `TEST_RESULTS_b26.md` | Build/TypeCheck/browser/iOS/SQL runtime/ERP هنوز اجرا نشده |
| WebGL graceful degradation | پیاده‌سازی اولیه | `src/components/auth/LightHighwayCanvas.tsx`؛ fallback CSS روی دستگاه کم‌حافظه/کم‌هسته یا Save Data | آزمون واقعی GPU/FPS/thermal روی موبایل باقی است |
| چت Real-time/offline/read receipts/Object Storage | انجام نشده | Backend/Auth/endpoint امن هنوز در دسترس نیست | در `NOT_DONE_b26.md` ثبت شده؛ کلاینت بدون سرور واقعی، قابلیت واقعی محسوب نمی‌شود |
| Virtualization/server pagination/Churn/stock aging | انجام نشده | منبع داده و تست حجم واقعی موجود نیست | نیازمند backend و دادهٔ معتبر |
