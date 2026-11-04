# AKHAVAN CRM — ممیزی ساختار پایگاه داده و ذخیره‌سازی (docs/DB_AUDIT.md)
**نسخه:** Master Directive v3.3  
**محیط ذخیره‌سازی فعلی:** IndexedDB محلی کلاینت (`akhavan_crm_db` v2) + لایه وضعیت Zustand  
**قراردادهای پشتیبان:** قراردادهای رابطه ای SQL Server (`database/sqlserver/v1/`)

---

## ۱. فهرست ساختارهای داده در `AppState`
| ساختار (Collection) | نوع شناسه | منشأ اولیه (Provenance) | کلیدهای خارجی و ارجاعات |
| :--- | :--- | :--- | :--- |
| `users` | `ID` (UUID) | CRM | `roleId`, `permissionSetId`, `branchId` |
| `roles` | `ID` | CRM | `parentId` |
| `permissionSets` | `ID` | CRM | آرایه‌ای از مجوزها |
| `customers` / `accounts` | `ID` | ERP Mirror / CRM | `ownerId`, `branchId`, `zoneId` |
| `invoices` | `ID` | ERP Mirror | `accountId`, `customerId`, `quoteId` |
| `payments` | `ID` | ERP Mirror / CRM | `accountId`, `customerId` |
| `cheques` | `ID` | ERP Mirror / CRM | `accountId`, `bankName`, `chequeNumber` |
| `paymentAllocations` | `ID` | ERP Mirror / CRM | `paymentId`, `invoiceId` |
| `creditNotes` | `ID` | ERP Mirror | `customerId`, `invoiceId`, `externalCreditNoteId` |
| `quotes` | `ID` | CRM | `accountId`, `lines.productId` |
| `tasks` | `ID` | CRM | `accountId`, `assigneeId`, `zoneId`, `watcherIds` |
| `activities` | `ID` | CRM | `accountId`, `ownerId` |
| `geoZones` | `ID` | CRM | `currentGeometryVersionId` |
| `zoneGeometryVersions` | `ID` | CRM | `zoneId` |
| `zoneAssignments` | `ID` | CRM | `zoneId`, `entityId` |
| `auditLogs` | `ID` | CRM (Append-only) | `entityId`, `actor` |
| `timelineEvents` | `ID` | Derived | `customerId`, `relatedEntityId` |

---

## ۲. ممیزی یکپارچگی روابط و ارقام (Data Integrity Checks)
1. **شاخص مانده بدهی (D19):**
   - در نسخه‌های گذشته، در صفحه مالی عدد ۱۰۰ میلیون ریال و در Customer 360 عدد ۱۳۵ میلیون ریال نمایش داده می‌شد.
   - ریشه: عدم استفاده از یک Selector مشترک بر پایه موتور `receivableReconciliation`.
   - راه‌حل: محاسبه متمرکز مانده بدهی بر اساس `reconcileReceivables` برای تمامی کامپوننت‌ها.
2. **برچسب‌گذاری منشأ (Provenance):**
   - تفکیک داده‌های دمو با `provenance: 'demo'` از داده‌های آینه‌شده رسمی `provenance: 'erp'` و داده‌های بومی `provenance: 'crm'`.
3. **کلیدهای تکرارناپذیر:**
   - تخصیص‌ها و رکوردهای پرداختی دارای گیت ضدتکرار `idempotencyKey` هستند.
