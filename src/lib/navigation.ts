import React from 'react';
import {
  LayoutDashboard, Users, UserPlus, Target, FileSpreadsheet, Wallet, CheckSquare, Calendar,
  Activity, Settings, Cpu, ShieldCheck, FolderKanban, PieChart, Sparkles, Gauge, UserCheck, Truck, Boxes, ShoppingCart, MapPinned } from 'lucide-react';

export interface NavItem { id: string; path: string; label: string; icon: React.ElementType }
export interface NavSection { id: string; title: string; items: NavItem[] }

/** تنها منبع ساختار منو: هم منوی کشویی و هم Dock دسکتاپ از اینجا می‌خوانند (بدون تغییر در آیتم‌های قبلی) */
export const menuSections: NavSection[] = [
  { id: 'sales', title: 'مدیریت ارتباط و فروش', items: [
    { id: 'command', path: '/command', label: 'مرکز فرماندهی مدیریتی', icon: Gauge },
    { id: 'dashboard', path: '/dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
    { id: 'leads', path: '/leads', label: 'سرنخ‌های فروش', icon: UserPlus },
    { id: 'accounts', path: '/accounts', label: 'حساب‌ها و مشتریان ۳۶۰', icon: Users },
    { id: 'opportunities', path: '/opportunities', label: 'فرصت‌های مذاکره', icon: Target },
  ] },
  { id: 'finance', title: 'عملیات، قرارداد و مالی', items: [
    { id: 'quotes', path: '/quotes', label: 'پیش‌فاکتورها و تنظیم پیشنهاد فروش', icon: FileSpreadsheet },
    { id: 'operations_control', path: '/operations', label: 'مرکز عملیات فروش و پخش', icon: Truck },
    { id: 'geo_intelligence', path: '/geo-intelligence', label: 'هوش مکانی و مدیریت زون‌ها', icon: MapPinned },
    { id: 'finance', path: '/finance', label: 'تراکنش‌ها و وصول مطالبات', icon: Wallet },
    { id: 'reports', path: '/reports', label: 'گزارش‌ها و تحلیل هوشمند', icon: PieChart },
  ] },
  { id: 'operations', title: 'مدیریت کارها و ارتباطات', items: [
    { id: 'tasks', path: '/tasks', label: 'وظایف و پیگیری‌ها', icon: CheckSquare },
    { id: 'activities', path: '/activities', label: 'تاریخچه فعالیت‌ها و تماس', icon: Activity },
    { id: 'calendar', path: '/calendar', label: 'تقویم کاری و جلسات', icon: Calendar },
    { id: 'internal_automation', path: '/internal_automation', label: 'اتوماسیون و درخواست‌ها', icon: Cpu },
    { id: 'cases', path: '/cases', label: 'تیکت‌ها و پشتیبانی', icon: ShieldCheck },
    { id: 'marketing', path: '/marketing', label: 'کمپین‌ها و بازاریابی', icon: Sparkles },
    { id: 'knowledge', path: '/knowledge', label: 'پایگاه دانش سازمانی', icon: FolderKanban },
  ] },
  { id: 'system', title: 'تنظیمات، کاتالوگ و دسترسی', items: [
    { id: 'groups', path: '/groups', label: 'تیم‌ها و گروه‌های سازمانی', icon: FolderKanban },
    { id: 'onboarding', path: '/onboarding', label: 'استخدام و پرونده پرسنلی', icon: UserCheck },
    { id: 'settings', path: '/settings', label: 'تنظیمات پایه و دسترسی‌ها', icon: Settings },
  ] },
];

/** ماژول‌هایی که در قرص‌های بالای صفحه هستند؛ Dock فقط بقیه را نشان می‌دهد */
export const TOP_TAB_IDS = ['dashboard', 'accounts', 'opportunities', 'tasks', 'calendar', 'finance', 'reports'];
export const isActivePath = (current: string, path: string) => current === path || (path !== '/' && current.startsWith(path));

/** فیلتر منو بر اساس مجوز واقعی کاربر (RBAC). پنهان‌سازی UI جایگزین کنترل سمت سرور نیست. */
export const filterSections = (sections: NavSection[], canAccess: (id: string) => boolean): NavSection[] =>
  sections.map(s => ({ ...s, items: s.items.filter(i => canAccess(i.id)) })).filter(s => s.items.length > 0);

/** چهار مقصد اصلی کپسول ناوبری موبایل (خانه، مشتریان، وظایف، تعاملات) */
export const BOTTOM_NAV_IDS = ['home', 'accounts', 'tasks', 'groups'] as const;
