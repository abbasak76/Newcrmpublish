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
  PanelLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';
import { NavigationDrawer } from './NavigationDrawer';
import { Sidebar } from './Sidebar';
import { AtmosphereLayer } from './AtmosphereLayer';
import { RBACService } from '../lib/rbac';
import { menuSections, filterSections } from '../lib/navigation';

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
    if (isDetailPage) return 'جزئیات';
    if (location.pathname === '/') return 'داشبورد سازمانی';
    if (location.pathname.startsWith('/accounts') || location.pathname.startsWith('/customers')) return 'مشتریان و حساب‌ها';
    if (location.pathname.startsWith('/quotes') || location.pathname.startsWith('/opportunities')) return 'فروش و مذاکرات';
    if (location.pathname.startsWith('/tasks')) return 'پیگیری و وظایف';
    if (location.pathname.startsWith('/operations')) return 'صف عملیات و اجرا';
    if (location.pathname.startsWith('/finance')) return 'امور مالی و خزانه‌داری';
    if (location.pathname.startsWith('/groups')) return 'پیام‌ها و گفتگوها';
    if (location.pathname.startsWith('/profile')) return 'پروفایل کاربر';
    if (location.pathname.startsWith('/settings')) return 'تنظیمات سامانه';
    return 'AKHAVAN CRM';
  }, [location.pathname, isDetailPage]);

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
          {/* ================= ۱. هدر معلق سراسری (Floating Header) ================= */}
          <header
            id="hd"
            className="fixed top-0 inset-x-0 z-30 px-4 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2 pointer-events-none flex items-center justify-between gap-2 transition-all duration-300"
          >
            {/* سمت راست: دکمه منو یا بازگشت */}
            <div className="pointer-events-auto flex items-center gap-2">
              {isDetailPage ? (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="cb fl text-ink"
                  aria-label="بازگشت"
                >
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  id="mb0"
                  onClick={() => setNavDrawerOpen(true)}
                  className="cb fl text-ink"
                  aria-label="منو"
                >
                  {/* آیکون همبرگری دوخطی با خط دوم کوتاه‌تر مطابق رفرنس */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 8h16M4 16h10" />
                  </svg>
                </button>
              )}

              {/* دسکتاپ: دکمه باز و بسته کردن سایدبار */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="cb fl text-ink hidden md:grid"
                aria-label="سایدبار"
              >
                {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            {/* وسط: عنوان صفحه با Scrim/Blur محافظ جهت جلوگیری از هم‌پوشانی محتوا (D1) */}
            <div
              id="ttl"
              className="px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-border/80 shadow-xs text-xs md:text-sm font-bold text-ink truncate text-center pointer-events-auto flex-initial max-w-xs md:max-w-md transition-all"
            >
              {activePageLabel}
            </div>

            {/* سمت چپ: جستجو، اعلان و دکمه یار */}
            <div className="pointer-events-auto flex items-center gap-2">
              {/* دسکتاپ: جستجوی سراسری و کلید یار */}
              <div className="hidden md:flex items-center gap-2">
                <div className="fl flex items-center gap-2 h-10 w-72 px-3 rounded-xl border border-border bg-white/90">
                  <Search size={16} className="text-ink-soft shrink-0" />
                  <input
                    type="text"
                    placeholder="جستجوی سراسری..."
                    className="w-full bg-transparent text-xs text-ink outline-none"
                    onClick={onOpenSearch}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="btn yr h-10 px-4 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm bg-primary hover:bg-primary-hover"
                >
                  <Sparkles size={15} />
                  <span>یار هوشمند</span>
                </button>
              </div>

              {/* موبایل: دکمه جستجو */}
              <button
                type="button"
                onClick={onOpenSearch}
                className="cb fl text-ink md:hidden"
                aria-label="جستجو"
              >
                <Search size={18} />
              </button>

              {/* دکمه اعلان با بج قرمز */}
              <button
                type="button"
                onClick={onOpenNotifications}
                className="cb fl text-ink relative"
                aria-label="اعلان‌ها"
              >
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <em>{(unreadNotificationsCount).toLocaleString('fa-IR')}</em>
                )}
              </button>
            </div>
          </header>

          {/* محتوای اصلی صفحات — تمام‌صفحه با حاشیه مناسب موبایل */}
          <main
            id="main-scroll-container"
            className="w-full flex-1 overflow-y-auto pb-[calc(var(--safe-bottom)+92px)] pt-[calc(var(--safe-top)+58px)] px-2 sm:px-4 md:px-6"
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
                    className={cn(isActive && "on")}
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
