import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Home,
  Users,
  TrendingUp,
  CheckSquare,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';
import { NavigationDrawer } from './NavigationDrawer';
import { Sidebar } from './Sidebar';
import { AtmosphereLayer } from './AtmosphereLayer';
import { RBACService } from '../lib/rbac';
import { menuSections, filterSections } from '../lib/navigation';
import { useTheme } from '../theme/ThemeProvider';

interface LayoutProps {
  children: React.ReactNode;
  onOpenSearch?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  state?: AppState;
  updateState?: (updater: (draft: AppState) => AppState | void) => void;
}

// تب‌های ۵گانه مطابق سند مرجع (راست به چپ)
const NAV_ITEMS = [
  { id: 'home', path: '/', label: 'خانه', icon: Home },
  { id: 'accounts', path: '/customers', label: 'مشتریان', icon: Users },
  { id: 'sales', path: '/quotes', label: 'فروش', icon: TrendingUp },
  { id: 'tasks', path: '/tasks', label: 'پیگیری', icon: CheckSquare },
  { id: 'operations', path: '/operations_control', label: 'عملیات', icon: LayoutGrid },
] as const;

export function Layout({
  children,
  onOpenSearch,
  unreadNotificationsCount = 3,
  onOpenNotifications,
  state,
  updateState
}: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [isMini, setIsMini] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  const currentUser = state?.users?.find((u: any) => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find((r: any) => r.id === currentUser?.roleId);
  const rbac = useMemo(() => (state ? new RBACService(state) : null), [state]);

  // تشخیص صفحه جزئیات
  const isDetailPage = /^\/(customers|accounts|tasks|quotes|operations_control|finance)\/.+/.test(location.pathname);
  const inChat = location.pathname.startsWith('/groups');

  // عنوان صفحه فعال در هدر
  const activeTabId = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p.startsWith('/customers') || p.startsWith('/accounts')) return 'accounts';
    if (p.startsWith('/quotes') || p.startsWith('/opportunities') || p.startsWith('/sales') || p.startsWith('/negotiations')) return 'sales';
    if (p.startsWith('/tasks')) return 'tasks';
    if (p.startsWith('/operations_control') || p.startsWith('/operations')) return 'operations';
    return '';
  }, [location.pathname]);

  const activePageLabel = useMemo(() => {
    if (isDetailPage) return 'جزئیات رکورد';
    const p = location.pathname;
    const s = new URLSearchParams(location.search);
    const tab = s.get('tab');

    if (p === '/') return 'داشبورد سازمانی';
    if (p === '/command') return 'مرکز فرماندهی مدیریتی';
    if (p === '/dashboard') return 'داشبورد مدیریتی و شاخص‌ها';
    if (p.startsWith('/accounts') || p.startsWith('/customers')) return 'حساب‌ها و مشتریان ۳۶۰';
    if (p.startsWith('/leads')) return 'سرنخ‌های فروش';
    if (p.startsWith('/opportunities')) return 'فرصت‌های مذاکره';
    if (p.startsWith('/quotes')) return 'پیش‌فاکتورها و فروش (CPQ)';
    if (p.startsWith('/tasks')) return 'پیگیری و کارتابل وظایف';
    if (p.startsWith('/operations')) {
      if (tab === 'returns') return 'بازگشت کالا و مرجوعی';
      if (tab === 'fleet') return 'ناوگان و برنامه توزیع';
      return 'مرکز عملیات فروش و پخش';
    }
    if (p.startsWith('/geo-intelligence') || p.startsWith('/geo_intelligence')) return 'هوش مکانی و زون‌ها';
    if (p.startsWith('/finance')) {
      if (tab === 'cheques' || tab === 'checks') return 'چک‌ها و تعهدات صیادی';
      if (tab === 'collection') return 'وصول و مطالبات معوق';
      if (tab === 'invoices') return 'فاکتورها و صورتحساب‌ها';
      return 'امور مالی و خزانه‌داری';
    }
    if (p.startsWith('/reports')) return 'گزارش‌ها و تحلیل هوشمند';
    if (p.startsWith('/groups')) return 'پیام‌ها و گفتگوها';
    if (p.startsWith('/activities')) return 'تاریخچه فعالیت‌ها و تماس';
    if (p.startsWith('/calendar')) return 'تقویم کاری و جلسات';
    if (p.startsWith('/cases')) return 'تیکت‌ها و پشتیبانی مشتریان';
    if (p.startsWith('/marketing')) return 'کمپین‌ها و بازاریابی';
    if (p.startsWith('/knowledge')) return 'پایگاه دانش سازمانی';
    if (p.startsWith('/internal_automation')) return 'اتوماسیون و درخواست‌ها';
    if (p.startsWith('/onboarding') || p.startsWith('/personnel-file')) return 'پرونده پرسنلی و استخدام';
    if (p.startsWith('/profile')) return 'پروفایل کاربر';
    if (p.startsWith('/settings')) return 'تنظیمات سامانه';
    return 'AKHAVAN CRM';
  }, [location.pathname, location.search, isDetailPage]);

  // محاسبه موارد نیازمند اقدام برای تب عملیات
  const opsBadgeCount = useMemo(() => {
    const pendingTasks = (state?.tasks || []).filter(
      (t: any) => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.slaStatus === 'BREACHED')
    ).length;
    return pendingTasks > 0 ? pendingTasks : 3;
  }, [state?.tasks]);

  // مخفی‌سازی نوار پایین در چت
  useEffect(() => {
    if (inChat) {
      document.body.classList.add('inchat');
    } else {
      document.body.classList.remove('inchat');
    }
    return () => document.body.classList.remove('inchat');
  }, [inChat]);

  // رفتار کشسان نوار پایین اینستاگرام: حین اسکرول به پایین ریز، با اسکرول به بالا درشت و پاپ، بازگشت ۱ ثانیه پس از توقف
  useEffect(() => {
    const mainEl = document.getElementById('main-scroll-container');
    if (!mainEl) return;

    const handleScroll = () => {
      if (window.innerWidth >= 900) return;
      const currentY = mainEl.scrollTop;
      const delta = currentY - lastScrollY.current;

      // اسکرول به پایین (بیش از ۳ پیکسل): نوار کوچک شود
      if (delta > 3 && currentY > 20) {
        setIsMini(true);
        document.body.classList.add('mini');
      }
      // اسکرول به بالا: نوار بلافاصله به اندازه کامل برمی‌گردد و انیمیشن Pop اجرا می‌شود
      else if (delta < -3) {
        if (isMini) {
          setIsMini(false);
          document.body.classList.remove('mini');
          setIsPopping(true);
          window.setTimeout(() => setIsPopping(false), 450);
        }
      }

      lastScrollY.current = currentY;

      // ریست کردن تایمر ۱۰۰۰ میلی‌ثانیه‌ای بعد از توقف اسکرول
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        setIsMini(false);
        document.body.classList.remove('mini');
        setIsPopping(true);
        window.setTimeout(() => setIsPopping(false), 450);
      }, 1000);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [isMini]);

  // محاسبه شاخص تب فعال (-1 در صورت عدم حضور در ۵ تب اصلی)
  const activeIndex = useMemo(() => {
    return NAV_ITEMS.findIndex(item => item.id === activeTabId);
  }, [activeTabId]);

  const currentDisplayIndex = dragIndex !== null ? dragIndex : (activeIndex !== -1 ? activeIndex : null);

  // کشیدن روان روی ناوبری پایین مطابق رفرنس کد
  const handleNavPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = e.currentTarget.querySelector('#tr') as HTMLElement || e.currentTarget;
    const r = track.getBoundingClientRect();
    const fx = Math.max(0, Math.min(4, ((r.right - e.clientX) / r.width) * 5 - 0.5));
    setDragIndex(fx);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNavPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragIndex === null) return;
    const track = e.currentTarget.querySelector('#tr') as HTMLElement || e.currentTarget;
    const r = track.getBoundingClientRect();
    const fx = Math.max(0, Math.min(4, ((r.right - e.clientX) / r.width) * 5 - 0.5));
    setDragIndex(fx);
  };

  const handleNavPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragIndex !== null) {
      const k = Math.max(0, Math.min(4, Math.round(dragIndex)));
      const selected = NAV_ITEMS[k];
      if (selected) {
        navigate(selected.path);
      }
      setDragIndex(null);
      setIsPopping(true);
      window.setTimeout(() => setIsPopping(false), 450);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas font-premium select-none" dir="rtl">
      <AtmosphereLayer />

      <div className={cn('relative z-10 flex h-full w-full overflow-hidden')}>
        {/* سایدبار دسکتاپ */}
        <Sidebar
          sections={[]}
          user={currentUser}
          roleName={currentRole?.name}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* ================= ۱. هدر معلق سراسری یکپارچه (Unified 2026 Floating Glassmorphic Header) ================= */}
          <header
            id="hd"
            className="fixed top-0 inset-x-0 z-30 px-2 sm:px-4 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2 pointer-events-none"
          >
            <div className="pointer-events-auto mx-auto max-w-6xl w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-surface/90 backdrop-blur-2xl border border-border/80 shadow-sm text-ink transition-all">
              {/* سمت راست: دکمه منو یا بازگشت + سایدبار */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isDetailPage ? (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="cb text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="بازگشت"
                  >
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="mb0"
                    onClick={() => setNavDrawerOpen(true)}
                    className="cb text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="منو"
                  >
                    {/* آیکون همبرگری دوخطی با خط دوم کوتاه‌تر */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 8h16M4 16h10" />
                    </svg>
                  </button>
                )}

                {/* دسکتاپ: دکمه باز و بسته کردن سایدبار */}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="cb text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:grid"
                  aria-label="سایدبار"
                >
                  {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                </button>
              </div>

              {/* وسط: عنوان صفحه با نشانگر زنده */}
              <div
                id="ttl"
                className="px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-xs md:text-sm font-bold text-ink truncate text-center flex items-center justify-center gap-2 max-w-[180px] sm:max-w-xs md:max-w-md select-none shrink"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
                <span className="truncate">{activePageLabel}</span>
              </div>

              {/* سمت چپ: جستجو، تم، اعلان، یار */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* دسکتاپ: جستجوی سراسری */}
                <div className="hidden md:flex items-center gap-2 h-9 w-52 lg:w-64 px-3 rounded-xl border border-border/80 bg-slate-50 dark:bg-slate-800/50">
                  <Search size={15} className="text-ink-soft shrink-0" />
                  <input
                    type="text"
                    placeholder="جستجوی سراسری..."
                    className="w-full bg-transparent text-xs text-ink outline-none"
                    onClick={onOpenSearch}
                  />
                </div>


                {/* دکمه تغییر تم روشن/تاریک ۲۰۲۶ */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="cb text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label={theme === 'dark' ? 'تغییر به پوسته روشن' : 'تغییر به پوسته تاریک'}
                  title={theme === 'dark' ? 'پوسته روشن' : 'پوسته تاریک'}
                >
                  {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600 dark:text-slate-300" />}
                </button>

                {/* موبایل: دکمه جستجو */}
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="cb text-ink md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="جستجو"
                >
                  <Search size={18} />
                </button>

                {/* دکمه اعلان با بج قرمز */}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="cb text-ink relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="اعلان‌ها"
                >
                  <Bell size={18} />
                  {unreadNotificationsCount > 0 && (
                    <em>{(unreadNotificationsCount).toLocaleString('fa-IR')}</em>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* محتوای اصلی صفحات — تمام‌صفحه با حاشیه مناسب موبایل بدون هم‌پوشانی هدر */}
          <main
            id="main-scroll-container"
            className="w-full flex-1 overflow-y-auto main-content-scroll px-2 sm:px-4 md:px-6 no-scrollbar"
          >
            <div className="mx-auto min-h-full w-full max-w-6xl">
              {children}
            </div>
          </main>
        </div>

        {/* ================= ۲. ناوبری پایین کشسان سبک اینستاگرام (۵ تب) ================= */}
        {!inChat && (
          <nav
            id="nav"
            className={cn(
              "nav fl select-none md:hidden",
              isMini && "mini",
              isPopping && "pop"
            )}
            onPointerDown={handleNavPointerDown}
            onPointerMove={handleNavPointerMove}
            onPointerUp={handleNavPointerUp}
          >
            <div className="tr" id="tr">
              {/* حباب فعال شناور — فقط در صورت حضور در یکی از ۵ تب اصلی */}
              {currentDisplayIndex !== null && (
                <div
                  className={cn("ind", dragIndex !== null && "drag")}
                  id="ind"
                  style={{ ['--i' as any]: currentDisplayIndex }}
                />
              )}

              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentDisplayIndex !== null && idx === currentDisplayIndex;
                const isOps = item.id === 'operations';

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(isActive && "on", "min-h-[44px] min-w-[44px] transition-transform active:scale-90")}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon />
                    {isOps && opsBadgeCount > 0 && (
                      <span className="bd">{Math.min(99, opsBadgeCount).toLocaleString('fa-IR')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* منوی همبرگری کشویی شرابی با هاله لوکس مطابق عکس رفرنس */}
      <NavigationDrawer
        isOpen={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        state={state}
      />
    </div>
  );
}
