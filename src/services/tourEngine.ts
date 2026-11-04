import type { AppState } from '../types.ts';

export type TourRole = 'admin' | 'manager' | 'sales' | 'finance' | 'operations' | 'all';

export interface TourStep {
  id: string;
  module: 'global' | 'dashboard' | 'accounts' | 'quotes' | 'finance' | 'operations' | 'tasks';
  title: string;
  content: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  roles?: TourRole[];
  actionLabel?: string;
  actionRoute?: string;
  isNewFeature?: boolean;
}

export interface WhatsNewItem {
  id: string;
  version: string;
  title: string;
  description: string;
  tag: 'NEW' | 'IMPROVED' | 'SECURITY';
  module: string;
  route?: string;
}

// تمامی مراحل آموزش بر اساس ماژول و نقش
export const ALL_TOUR_STEPS: TourStep[] = [
  // ۱. تور پوسته سراسری (Global Shell)
  {
    id: 'shell-header',
    module: 'global',
    title: 'هدر معلق و عنوان پویا',
    content: 'هدر معلق با پوشش شیشه‌ای ضدانعکاس عنوان صفحه جاری را بدون هم‌پوشانی با متن نشان می‌دهد و وضعیت سیستم را مدیریت می‌کند.',
    targetSelector: '#ttl',
    placement: 'bottom',
    roles: ['all'],
  },
  {
    id: 'shell-menu',
    module: 'global',
    title: 'منوی همبرگری ۴گانه',
    content: 'از اینجا به تمام ۲۱ ماژول سیستم در ۴ دسته‌بندی اصلی (فروش، عملیات، مالی، دانش و سازمان) دسترسی دارید.',
    targetSelector: '#mb0',
    placement: 'bottom',
    roles: ['all'],
  },
  {
    id: 'shell-nav',
    module: 'global',
    title: 'نوار ناوبری کپسولی سبک اینستاگرام',
    content: '۵ تب پرکاربرد (خانه، مشتریان، فروش، پیگیری، عملیات) با قابلیت کشش لمسی و تغییر اندازه خودکار حین اسکرول.',
    targetSelector: '#nav',
    placement: 'top',
    roles: ['all'],
  },
  {
    id: 'shell-churn-new',
    module: 'global',
    title: 'موتور پیش‌بینی ریزش مشتری (جدید)',
    content: 'سامانه اکنون به طور هوشمند نرخ ریزش مشتریان را محاسبه کرده و وظایف پیشگیرانه حفظ حساب پیشنهاد می‌دهد.',
    targetSelector: '.churn-widget',
    placement: 'bottom',
    roles: ['admin', 'manager', 'sales'],
    isNewFeature: true,
    actionLabel: 'مشاهده در داشبورد',
    actionRoute: '/dashboard',
  },

  // ۲. داشبورد و شاخص‌ها (Dashboard)
  {
    id: 'dash-kpis',
    module: 'dashboard',
    title: 'کارت‌های فرماندهی و شاخص‌های کلیدی',
    content: 'نمای متمرکز از وظایف من، فرصت‌های باز، یادداشت‌ها و گفتگوهای کاری با لینک مستقیم به هر بخش.',
    targetSelector: '#dash-kpis',
    placement: 'bottom',
    roles: ['all'],
  },
  {
    id: 'dash-churn-portfolio',
    module: 'dashboard',
    title: 'پایش هوشمند مشتریان در معرض ریزش',
    content: 'تفکیک مشتریان به سطوح بحرانی، ریسک بالا، هشدار و سالم بر پایه کهنگی سفارشات و شکایات باز.',
    targetSelector: '.churn-widget',
    placement: 'top',
    roles: ['admin', 'manager', 'sales'],
    isNewFeature: true,
  },

  // ۳. پرونده مشتریان و حساب‌ها (Customer 360)
  {
    id: 'acc-metrics',
    module: 'accounts',
    title: '۴ بعد کلیدی شناسنامه مشتری',
    content: 'مانده بدهی تجاری، سقف اعتبار مصوب، تعداد پیش‌فاکتورها و نمره سلامت اعتباری در یک نگاه.',
    targetSelector: '#acc-metrics',
    placement: 'bottom',
    roles: ['admin', 'manager', 'sales', 'finance'],
  },
  {
    id: 'acc-churn-prediction',
    module: 'accounts',
    title: 'تحلیل پیش‌بینی ریزش اختصاصی مشتری',
    content: 'مشاهده دلایل افت تعامل و امکان ثبت فوری «وظیفه حفظ مشتری» با یک کلیک جهت اقدام کارشناس فروش.',
    targetSelector: '#acc-churn-card',
    placement: 'bottom',
    roles: ['admin', 'manager', 'sales'],
    isNewFeature: true,
  },
  {
    id: 'acc-dock',
    module: 'accounts',
    title: 'داک عملیات سریع مشتری',
    content: 'صدور پیش‌فاکتور (CPQ)، ثبت وصولی، یادداشت، وظیفه و تیکت بدون نیاز به جابجایی بین صفحات مختلف.',
    targetSelector: '#acc-dock',
    placement: 'top',
    roles: ['admin', 'manager', 'sales', 'finance'],
  },

  // ۴. خط فروش، پیش‌فاکتور و CPQ (Quotes)
  {
    id: 'quote-wizard',
    module: 'quotes',
    title: 'تنظیم پیشنهاد قیمت و پیش‌فاکتور (CPQ)',
    content: 'محاسبه خودکار پلکانی تخفیف‌ها، پایش حاشیه سود ناخالص و هشدار فروش زیر قیمت مصوب.',
    targetSelector: '#quote-actions',
    placement: 'bottom',
    roles: ['admin', 'manager', 'sales'],
  },

  // ۵. امور مالی و خزانه‌داری (Finance)
  {
    id: 'fin-reconciliation',
    module: 'finance',
    title: 'دریافت، پرداخت و تطبیق وصولی',
    content: 'پایش وجوه نقد، تخصیص مطالبات به فاکتورهای واقعی و مدیریت چک‌های صیادی ۱۶ رقمی.',
    targetSelector: '#fin-tabs',
    placement: 'bottom',
    roles: ['admin', 'manager', 'finance'],
  },

  // ۶. عملیات و توزیع (Operations)
  {
    id: 'ops-dispatch',
    module: 'operations',
    title: 'مرکز عملیات فروش و پخش',
    content: 'پایش برنامه‌های حمل، خروجی توزیع، مرجوعی‌ها و مدیریت زون‌های مکانی هوشمند.',
    targetSelector: '#ops-summary',
    placement: 'bottom',
    roles: ['admin', 'manager', 'operations'],
  },

  // ۷. پیگیری و وظایف (Tasks)
  {
    id: 'task-triage',
    module: 'tasks',
    title: 'تریاژ و صف‌بندی وظایف هوشمند',
    content: 'اولویت‌بندی خودکار کارها بر اساس سررسید SLA، امتیاز فوریت مالی و ظرفیت روزانه افراد.',
    targetSelector: '#task-filters',
    placement: 'bottom',
    roles: ['all'],
  },
];

// لیست امکانات نسخه جدید جهت نمایش در What's New
export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  {
    id: 'wn-churn-engine',
    version: '0.12.31',
    title: 'موتور پیش‌بینی ریزش مشتری (Customer Churn Prediction)',
    description: 'محاسبه خودکار ریسک ریزش مشتریان بر اساس کهنگی سفارشات، مطالبات معوق، چک‌های برگشتی و افت حجم خرید به همراه پیشنهاد وظایف بازگشت مشتری.',
    tag: 'NEW',
    module: 'accounts',
    route: '/accounts',
  },
  {
    id: 'wn-design-system',
    version: '0.12.31',
    title: 'بازطراحی هدر معلق و فاصله لمسی استاندارد',
    description: 'تقویت لایه محو شیشه‌ای هدر معلق با Scrim ضدانعکاس، دکمه‌های لمسی ارگونومیک حداقل ۴۴ پیکسلی و بهبود منوی کشویی.',
    tag: 'IMPROVED',
    module: 'global',
    route: '/',
  },
  {
    id: 'wn-sayad-validation',
    version: '0.12.31',
    title: 'اعتبارسنجی ۱۶ رقمی چک صیادی',
    description: 'ثبت چک‌های دریافتی تنها با شناسه ۱۶ رقمی عددی معتبر با جلوگیری از ثبت تکراری.',
    tag: 'SECURITY',
    module: 'finance',
    route: '/finance',
  },
];

export interface TourStorageState {
  activeModule: string | null;
  currentStepIndex: number;
  isPaused: boolean;
  completedModules: Record<string, boolean>;
  dismissedWhatsNewVersion?: string;
}

const STORAGE_KEY = 'akhavan_interactive_tour_state';

export function loadTourState(): TourStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    activeModule: null,
    currentStepIndex: 0,
    isPaused: false,
    completedModules: {},
  };
}

export function saveTourState(state: TourStorageState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // fallback
  }
}

export function getStepsForModuleAndRole(module: string, roleName?: string): TourStep[] {
  const normRole = (roleName || '').toLowerCase();
  let userRole: TourRole = 'all';
  if (normRole.includes('admin') || normRole.includes('مدیر کل') || normRole.includes('مدیر سیستم')) userRole = 'admin';
  else if (normRole.includes('فروش') || normRole.includes('sales')) userRole = 'sales';
  else if (normRole.includes('مالی') || normRole.includes('finance') || normRole.includes('حسابدار')) userRole = 'finance';
  else if (normRole.includes('عملیات') || normRole.includes('پخش') || normRole.includes('لجستیک')) userRole = 'operations';
  else if (normRole.includes('سرپرست') || normRole.includes('manager')) userRole = 'manager';

  return ALL_TOUR_STEPS.filter(step => {
    if (module !== 'all' && step.module !== module) return false;
    if (!step.roles || step.roles.includes('all')) return true;
    return step.roles.includes(userRole) || userRole === 'admin';
  });
}

export function getAvailableModules(): { id: string; label: string; icon: string }[] {
  return [
    { id: 'global', label: 'راهنمای عمومی و ناوبری', icon: 'Compass' },
    { id: 'dashboard', label: 'داشبورد مدیریتی و شاخص‌ها', icon: 'Gauge' },
    { id: 'accounts', label: 'پرونده ۳۶۰ درجه مشتریان', icon: 'Users' },
    { id: 'quotes', label: 'خط فروش و پیش‌فاکتور CPQ', icon: 'FileSpreadsheet' },
    { id: 'finance', label: 'امور مالی، خزانه‌داری و چک', icon: 'Wallet' },
    { id: 'operations', label: 'مرکز عملیات و پخش', icon: 'Truck' },
    { id: 'tasks', label: 'پیگیری و کارتابل وظایف', icon: 'CheckSquare' },
  ];
}
