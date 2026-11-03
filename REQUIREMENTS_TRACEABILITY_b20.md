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
