# AKHAVAN CRM — Centralized Skills & Tools Registry

این سند، مرجع واحد تمام ابزارها، اسکیل‌ها و زیرساخت‌های نصب‌شده در پروژه است. هر ایجنت هوش مصنوعی باید پیش از شروع کار، محتوای این فایل را بخواند.

## ۱. اسکیلهای طراحی (Design & UI/UX Skills)
محل ذخیره‌سازی: `/.gemini/skills/`
- **UI/UX Pro Max:** یکپارچه‌سازی قوانین طراحی و سیستم تعاملی.
- **Emil Kowalski:** انیمیشن‌های نرم و میکرواینترکشن‌ها.
- **Impeccable:** ارتقای استاندارد زیبایی‌شناسی (دستور: `npx impeccable install`).
- **Taste (Senlin Design):** رعایت الگوهای مدرن و مینیمال.

## ۲. کامپوننتها و ریجستریها (Component Registries)
- **21st.dev:** استفاده از کامپوننت‌های مدرن (مانند ai-prompt-box).
  - دستور فراخوانی: `npx @21st-dev/cli add <user>/<slug>`
  - متغیر محیطی: `API_KEY_21ST` (تنظیم شده در .env.example)
- **Shadcn/UI:** کامپوننت‌های پایه (Vite + Tailwind v4).
  - فایل تنظیمات: `/components.json`

## ۳. تست و اتوماسیون (Testing & Integrations)
- **Playwright MCP:** تست خودکار مرورگر.
  - دستور فراخوانی: `claude mcp add playwright -s user -- npx -y @playwright/mcp@latest --isolated`
- **Figma MCP:** هماهنگی لایه‌های فیگما با کد (اتصال MCP).
- **Context7 (SDK):** مدیریت مستندات و همگام‌سازی ساختار اطلاعات.

## دستور همگام‌سازی سریع برای ایجنتها
برای مشاهده لیست کامل در لحظه:
`cat /SKILLS_REGISTRY.md`
