# AKHAVAN CRM — نقشه راه و برنامه اجرایی دسته‌ای (docs/PLAN.md)
**نسخه:** Master Directive v3.3  
**هدف:** بازطراحی و ارتقای استاندارد کل سامانه در بچ‌های مستقل، پیوسته و بدون توقف

---

## ماتریس بچ‌های اجرایی (Batches)

| کد بچ | عنوان و تمرکز اجرایی | فایل‌های کلیدی | معیارهای پذیرش قطعی |
| :--- | :--- | :--- | :--- |
| **B0** | قفل قابلیت‌ها و خط‌مبنای رگرسیون | `docs/FEATURE_INVENTORY.md` | ایجاد لیست کامل و پاس‌شدن ۱۰۰٪ تست‌های موجود |
| **B1** | بازطراحی سیستم طراحی و Shell (هدر، نوار کپسولی، بدون هاله زرد، حذف تودرتویی) | `src/index.css`, `src/components/Layout.tsx`, `src/components/NavigationDrawer.tsx` | حذف هاله آب‌وهوایی، هدر شناور با Scrim بلور، تب‌های آیکونی، فونت ۱۶px ورودی‌ها، رفع D1-D7 و D23 |
| **B2** | معماری ناوبری و اصلاح مسیرهای اشتباه + RBAC | `src/lib/navigation.ts`, `src/lib/rbac.ts`, `src/App.tsx` | تصحیح تب فعال، مسیرهای چک و مرجوعی، فیلتر سلسله‌مراتبی |
| **B2.5** | ممیزی DB، ساختار نگاشت حسابداری و Outbox | `src/types.ts`, `src/lib/storage.ts`, `src/lib/accountingMapping.ts` | ثبت مدل `coa_mirror`، `report_bucket` و صف Outbox |
| **B3** | لایه داده یکپارچه، وضعیت منبع و یکپارچگی اعداد | `src/components/ui/DataSourceStatus.tsx`, `src/lib/utils.ts` | نمایش دکمه «به‌روزرسانی همه»، رفع تناقض مانده D19، ارقام فارسی |
| **B4** | صفحه خانه (وظایف امروز) و داشبورد مدیریتی | `src/components/HomeWorkspace.tsx`, `src/components/DashboardWorkspace.tsx` | نمایش وظایف روزانه، سنجه‌های معتبر، کارت‌های StatCard استاندارد |
| **B5** | بانک مشتریان و پرونده هوشمند Customer 360 | `src/components/CustomersWorkspace.tsx`, `src/components/Customer360.tsx` | تبدیل جدول به کارت موبایلی، رفع تله اسکرول، ۴ بعد استاندارد |
| **B6** | خط فروش، پیش‌فاکتورها، CPQ و مذاکره | `src/components/QuotesWorkspace.tsx`, `src/components/NegotiationsWorkspace.tsx` | فیلترهای جامع، استپر وضعیت، هشدار حاشیه سود، ابطال منوط به ERP |
| **B7** | امور مالی و خزانه‌داری، چک صیادی و گزارش سنی مطالبات | `src/components/FinanceWorkspace.tsx` | فرم اختصاصی صیادی ۱۶ رقم، سن مطالبات، هشدار هزینه مشکوک |
| **B8** | هوش مکانی و نقشه حرارتی واقعی (Geospatial BI) | `src/components/GeoIntelligenceWorkspace.tsx`, `src/components/GeoZoneMapEditor.tsx` | تصحیح ترتیب مختصات، Heatmap وزن‌دار بر اساس شاخص، مأموریت وصول |
| **B9** | پیام‌رسان مستقل و چت گروهی عملیاتی | `src/components/GroupsWorkspace.tsx` | تمام‌صفحه‌سازی، مخفی‌شدن نوار ناوبری، منشن و تبدیل به تسک |
| **B10** | فرم‌های پویا، Bottom Sheetها و Select سفارشی | `src/components/shared/DynamicFormRenderer.tsx`, `src/components/ui/` | حذف `<select>` بومی، اعتبارسنجی روی Blur/Submit، اینپوت مبالغ |
| **B11** | راهنمای شروع و تست‌های رگرسیون نهایی | `src/components/OnboardingTour.tsx`, `tests/` | تصحیح گام‌ها در RTL، ارقام فارسی و اجرای موفق کل تست‌ها |
| **B12** | مرکز اعلان‌ها و هشدارهای هوشمند | `src/components/Layout.tsx`, `src/types.ts` | دسته‌بندی هشدارها و ترجیحات اعلان |
| **B13** | مدیریت دسترسی سلسله‌مراتبی و Scope | `src/lib/rbac.ts`, `src/hooks/useCan.ts` | فیلتر دقیق بر اساس سرپرست و مسیر ویزیتور |
| **B14** | بازطراحی تنظیمات به سبک iOS (۷ گروه اصلی بدون تب‌های افقی) | `src/components/SettingsWorkspace.tsx` | تبدیل ۳۰ تب افقی به لیست جست‌وجودار عمودی |

---

## پروتکل اجرای پیوسته
مطابق بند ۳.۴ مستندات، پس از تدوین این برنامه، اجرای دسته‌ها بی‌درنگ با **B1** آغاز شده و بدون توقف پیش می‌رود.
