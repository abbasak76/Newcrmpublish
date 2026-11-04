# BASELINE REPORT — AKHAVAN CRM b19

- تاریخ: 2026-10-26
- مبنای مستقیم: `AkhavanCRM-SolarEmber_r11-cp9_b18.zip`
- SHA-256 مبنا: `b9ae65d840dc3dc16183076521268295dc3a03db4525ffccf70aafe4b7c828e6`
- مبنای محصول: `0.11.4 / r11-cp9-b18`
- خروجی: `0.11.5 / r11-cp9-b19`
- وضعیت Git: ZIP مبنا شامل `.git` نبود؛ بنابراین commit/status واقعی Git از این آرشیو قابل گزارش نیست. Diff فایل‌به‌فایل با ZIP اصلی ثبت شده است.
- مبنای فنی: React 19, Vite, TypeScript, Tailwind v4 و state محلی IndexedDB/Zustand طبق package/source موجود.
- محدودیت محیط: نصب dependency در این دور پس از 120 ثانیه timeout شد؛ `node_modules/.bin/vite` و type definitions در دسترس نیستند.

## تغییرات کد نسبت به b18
- `src/components/GeoIntelligenceWorkspace.tsx` — صفحهٔ جدید برای زون، سنجه، انتساب مشتری و ساخت task پیگیری وصول.
- `src/App.tsx` — route جدید و RBAC guard.
- `src/lib/navigation.ts` — لینک منوی هوش مکانی.
- `src/lib/rbac.ts` — `geo.view`, `geo.manage`, ماتریس `geo`, مجوز ورود به workspace.
- `src/types.ts` — افزودن capability permissions و navigation tab.
- `src/lib/seed.ts` — افزودن مجوزهای geo به پروفایل مدیریتی اولیه.
- `src/lib/version.ts`, `package.json`, `metadata.json` — برچسب b19 / 0.11.5.
- `tests/rbac-configurability.test.mjs`, `tests/geoWorkspaceContracts.test.mjs` و script تست — تست‌های قرارداد/مجوز.
- `CHANGELOG_b19.md`, `STATUS_b19.md`, `NOT_DONE_b19.md`, `RBAC_AUDIT_b19.md`, `HANDOFF.md`, `VERSION.md`, `docs/07_MASTER_AUDIT_AND_TRACEABILITY_b19.md` — مستندات اجرایی و traceability.

## آزمون
- `npm test`: PASS؛ جمع assertionهای گزارش‌شده در suiteها 471.
- `node scripts/audit-actions.mjs`: PASS؛ 74/74 handler تغییردهنده guard شده.
- `npm run audit:contracts`: PASS ایستا؛ 9 SQL files, 46 tables, 44 tenant-scoped tables, 44 RLS targets, 5 required views. بدون SQL Server runtime.
- `transpileModule`: PASS از نظر syntax/transpile فایل‌های تغییرکرده؛ جایگزین typecheck کامل نیست.
- `npm run lint`: BLOCKED؛ `vite/client` قابل resolve نیست.
- `npm run build`: BLOCKED؛ `vite` executable موجود نیست.
- Browser/iOS, SQL Server runtime, Backend/API, ERP: اجرا نشده‌اند.
