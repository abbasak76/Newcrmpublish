# AKHAVAN CRM — Bootstrap & Agent Startup Protocol

این پروتکل برای اطمینان از همگام‌سازی کامل هر هوش مصنوعی (ایجنت) با وضعیت، قوانین و زیرساخت پروژه طراحی شده است. هر ایجنت قبل از انجام هرگونه تغییر یا بررسی، موظف است این مراحل را از بالا به پایین به صورت دقیق اجرا کند.

## مرحله ۰ — خواندن اسناد مادر
برای بارگذاری قوانین حاکم در حافظه کوتاه‌مدت، این دستور را اجرا کنید:
`cat INSTRUCTIONS.md PROJECT_KNOWLEDGE.md HANDOFF.md SKILLS_REGISTRY.md BOOTSTRAP.md`

## مرحله ۱ — نصب وابستگی‌ها
`npm install`
هدف: نصب و به‌روزرسانی پکیج‌ها و وابستگی‌های پروژه.

## مرحله ۲ — کامپایل و شناسایی ساختار
`npx compile-applet`
هدف: شناسایی ساختار فایل‌ها و وابستگی‌های Type-safe.

## مرحله ۳ — بررسی کیفیت کد
`npm run lint`
(یا معادل آن: `tsc --noEmit`)
خروجی مورد انتظار: بدون خطا.

## مرحله ۴ — بیلد
`npm run build`
خروجی مورد انتظار: Build succeeded.

## مرحله ۵ — تست‌ها
`npm test`
تمامی مجموعه تست‌ها باید PASS شوند. نتیجه جعلی ممنوع است.

## مرحله ۶ — اسکیل‌ها و ابزارها
ارجاع به فایل: `cat SKILLS_REGISTRY.md`
قبل از شروع هرگونه کار UI/UX یا طراحی، باید از اسکیل‌های طراحی و ابزارهای ثبت‌شده در این فایل استفاده شود.

## مرحله ۷ — اجرای محیط توسعه (در صورت نیاز)
`npm run dev -- --port 3000`

## مرحله ۸ — قوانین گزارش‌دهی ایجنت
برای هر مرحله گزارش وضعیت صریح ارائه شود (فقط یکی از حالات زیر مجاز است):
- **PASS**
- **FAIL**
- **BLOCKED**
- **NOT AVAILABLE**
موفقیت ساختگی ممنوع است. در صورت نبود ابزار یا فایل، صریح گزارش شود.

---

## ترتیب خلاصه برای اجرای سریع (Copy-Paste)
```bash
cat INSTRUCTIONS.md PROJECT_KNOWLEDGE.md HANDOFF.md SKILLS_REGISTRY.md BOOTSTRAP.md
npm install
npx compile-applet
npm run lint
npm run build
npm test
cat SKILLS_REGISTRY.md
```
