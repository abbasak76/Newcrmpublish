# AKHAVAN CRM — سند جامع ساختار پایگاه داده و نگاشت سرفصل‌ها (docs/DB_SCHEMA.md)
**معماری:** نگاشت لایه‌ای حسابداری چند-ERP و ابعاد تحلیلی CRM  
**استاندارد:** بخش ۳۵ دستورالعمل Master Directive v3.3

---

## ۱. جریان نگاشت لایه‌ای حسابداری
```
کدینگ خام ERP (SEPIDAR / RAHKARAN / HAMKARAN / PAYVAND)
        ↓
لایه فنی (Technical COA Mirror: coa_mirror)
        ↓
نگاشت قوانین‌محور اولویت‌دار (account_map_rule)
        ↓
لایه ابعاد تحلیلی استاندارد CRM (analytic_dimension)
        ↓
سطل‌های گزارش‌دهی و پایش یکپارچه (report_bucket)
```

---

## ۲. تعاریف جداول و ساختارهای نگاشت

### ۲.۱ آینه سرفصل حسابداری (`coa_mirror`)
```typescript
export interface CoaMirrorRecord {
  id: string; // شناسه داخلی
  tenantId: string; // مستأجر
  sourceSystem: string; // نام سیستم ERP (مثلاً سپیدار، همکاران)
  externalCode: string; // کد حساب در ERP
  title: string; // عنوان سرفصل در ERP
  level: 'KOL' | 'MOEIN' | 'TAFSILI'; // سطح حساب
  parentCode?: string; // کد حساب والد
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  contentHash?: string;
}
```

### ۲.۲ ابعاد تحلیلی استاندارد CRM (`analytic_dimension`)
```typescript
export interface AnalyticDimension {
  id: string;
  mainGroup: 'CURRENT_ASSET' | 'NON_CURRENT_ASSET' | 'LIABILITY' | 'REVENUE' | 'OPEX' | 'NON_OPEX';
  subGroup: 'CASH' | 'RECEIVABLE' | 'INVENTORY' | 'SELLING_EXPENSE' | 'ADMIN_EXPENSE' | 'FINANCE_EXPENSE';
  nature: 'CASH' | 'ACCRUAL' | 'DOCUMENTARY' | 'STOCK' | 'DEPRECIATION';
  cashFlowClass?: 'OPERATING' | 'INVESTING' | 'FINANCING';
  reportingTarget: 'PL' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'AGING' | 'SUSPICIOUS_EXPENSE';
}
```

### ۲.۳ سطل‌های استاندارد گزارش (`report_bucket`)
| کد سطل (Bucket Code) | عنوان فارسی | نوع گزارش | رنگ شاخص | اولویت نمایش |
| :--- | :--- | :--- | :--- | :--- |
| `CASH` | موجودی نقد و بانک | ترازنامه / نقدینگی | آبی اقیانوسی (`#2563EB`) | ۱ |
| `AR` | مطالبات تجاری و بدهکاران | ترازنامه / Aging | سبز نعنایی (`#16A34A`) | ۲ |
| `AP` | بدهی به تأمین‌کنندگان | ترازنامه | نارنجی کهربایی (`#D97706`) | ۳ |
| `INV` | موجودی انبار کالا | ترازنامه | بنفش یاسی (`#7C3AED`) | ۴ |
| `FA` | دارایی‌های ثابت و تجهیزات | ترازنامه | خاکستری اسلیت (`#64748B`) | ۵ |
| `REV_SALES` | درآمد ناخالص فروش | سود و زیان | زمردی تیره (`#059669`) | ۱۰ |
| `COGS` | بهای تمام‌شده کالای فروش‌رفته | سود و زیان | قرمز ملایم (`#DC2626`) | ۱۱ |
| `OPEX_SELL` | هزینه‌های فروش، بازاریابی و توزیع | سود و زیان | نارنجی پررنگ (`#EA580C`) | ۱۲ |
| `OPEX_ADMIN` | هزینه‌های عمومی و اداری | سود و زیان | زرد خردلی (`#CA8A04`) | ۱۳ |
| `SUSPICIOUS` | هزینه مشکوک نیازمند بازبینی | هشدار مدیریتی | زرشکی بحرانی (`#991B1B`) | ۹۹ |

---

## ۳. نگاشت موجودیت‌های خاص (Entity Maps)
- **`bank_map`**: اتصال بانک‌های ERP به حساب‌های مقصد واریز در پیش‌فاکتورها و دریافت‌ها.
- **`cashbox_map`**: کنترل صندوق‌های نقدی ویزیتورها و تسویه روزانه.
- **`customer_account_map`**: پیوند کد مشتری در ERP با حساب معین تفصیلی دریافتنی.
- **`vendor_account_map`**: پیوند تأمین‌کنندگان کالا و اقلام سبد.
- **`check_map`**: وضعیت‌های چک صیادی (دریافتی، واگذارشده، در جریان وصول، برگشتی).
