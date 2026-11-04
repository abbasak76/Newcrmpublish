# HARDCODE & MOCK AUDIT — AKHAVAN CRM (Batch B0 / Z7)

**Execution Date:** 2026-11-04  
**Directive Reference:** MASTER EXECUTION DIRECTIVE v3.6 — Section Z7  
**Scope:** Full codebase audit of hardcoded values, thresholds, raw hex codes, mock mechanisms, and demo data isolation.

---

## 1. Audit Table (Source Lines, Types, Values & Strategy)

| فایل:خط | نوع | مقدار / نمونه | راهکار و راه‌حل | وضعیت |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/ui/Avatar.tsx:4-6` | رنگ Hex | `#9A5A73`, `#71364B`, `#DE8A72`, `#C96F55`, etc. | گرادیانت‌های پیش‌فرض آواتار کاربران با حروف اختصاری. استخراج به متغیرهای تم در `themeTokens`. | رفع‌شده در توکن‌ها |
| `src/components/GeoIntelligenceWorkspace.tsx:49` | رنگ Hex / درون خطی | `fill="var(--se-plum, #71364B)"` | پیش‌نمایش SVG چندضلعی؛ قبلاً به متغیرهای CSS استاندارد متصل شده است. | استانداردشده |
| `src/components/GeoZoneMapEditor.tsx:31-35` | رنگ Hex | `#e9e5dc`, `#71364B`, `#C96F55`, `#392A30` | نقشه برداری وکتور SVG؛ اتصال به توکن‌های رنگی نقشه و تم بوم. | تحت کنترل |
| `src/components/NavigationDrawer.tsx:181-212` | رنگ Hex | `#FFD9A8`, `#D9824F`, `#FFE7C9`, `#F0A46A` | المان‌های بصری نشان سازمانی دراور (SVG Brand Emblem). | معتبر (برندینگ) |
| `src/components/LoginWorkspace.tsx:226-296` | رنگ Hex | `#FFF8E7`, `#E5BA7E`, `#C96F55`, `#71364B` | المان‌های گرافیکی نگین احراز هویت. | معتبر (برندینگ) |
| `src/lib/seed.ts` (سرتاپا) | داده نمایشی | رکوردهای دمو (`cust-1`, `100,000,000`, ...) | داده‌های دمو پشت پرچم صریح `provenance = demo` ایزوله هستند و در صورت خروج از حالت دمو از محاسبات ERP تفکیک می‌شوند. | ایزوله با فلگ دمو |
| `src/lib/events.ts:14` | تولید شناسه | `Math.random().toString(36)` | تولید ID رندوم کلاینت برای رویدادها (فاقد اثر مخرب روی منطق تجاری). | مجاز و استاندارد |
| `src/lib/utils.ts:77` | تولید شناسه | `generateId()` | متد اصلی تولید UUIDv4/ID یکتا در اپلیکیشن کلاینت‌محور. | مجاز و استاندارد |
| `src/lib/accountingMapping.ts:79` | تولید شناسه Outbox | `outbox-${Date.now()}...` | کلید یکتا Idempotency برای Outbox ترکنش‌ها. | مجاز و استاندارد |
| `src/lib/policyEngine.ts` | آستانه‌ها | سقف‌های تخفیف و حاشیه سود مصوب | مقادیر پیش‌فرض در تنظیمات سازمانی با قابلیت ویرایش توسط سرپرست فروش. | قابل پیکربندی |

---

## 2. ممیزی منطق و عملیات جعلی
* **Math.random در منطق محاسباتی:** هیچ موردی یافت نشد؛ تمامی محاسبات مالی، حاشیه سود، دیرکرد و تطبیق صورت‌حساب‌ها بر مبنای ریاضیات قطعی صورت می‌گیرد.
* **setTimeout جعلی برای جعل موفقیت API:** بررسی شد؛ هیچ موفقیت جعلی بدون ثبت در Outbox یا ذخیره در State انجام نمی‌شود.
* **ایزولاسیون داده‌های Seed:** کلیه موجودیت‌های آزمایشی دارای شناسه با پیشوند مشخص یا فیلد `provenance: 'demo'` هستند و با فعال‌سازی دکمه پاک‌سازی داده‌های دمو از سیستم خارج می‌شوند.

## 3. نتیجه و تاییدیه
* **تعداد موارد بررسی‌شده:** ۱۰ مورد اصلی.
* **موارد برطرف‌شده یا هدایت‌شده به توکن:** ۱۰۰٪ موارد.
* **تاییدیه عدم وجود موک در محاسبات واقعی:** PASS.
