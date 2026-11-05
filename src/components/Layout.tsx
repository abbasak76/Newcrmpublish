import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, PanelLeftClose, PanelLeft, Sun, Moon, Menu, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';
import { NavigationDrawer } from './NavigationDrawer';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { RBACService } from '../lib/rbac';
import { useTheme } from '../theme/ThemeProvider';
import { AtmosphereLayer } from './AtmosphereLayer';

interface LayoutProps {
  children: React.ReactNode;
  onOpenSearch?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  state?: AppState;
  updateState?: (updater: (draft: AppState) => AppState | void) => void;
}

export function Layout({
  children,
  onOpenSearch,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  state,
  updateState
}: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentUser = state?.users?.find((u: any) => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find((r: any) => r.id === currentUser?.roleId);
  const rbac = useMemo(() => (state ? new RBACService(state) : null), [state]);

  const isDetailPage = /^\/(customers|accounts|tasks|quotes|operations_control|finance)\/.+/.test(location.pathname);
  const inChat = location.pathname.startsWith('/groups');

  // Dynamic Title Resolution
  const activePageLabel = useMemo(() => {
    if (isDetailPage) return 'جزئیات رکورد';
    const p = location.pathname;
    const s = new URLSearchParams(location.search);
    const tab = s.get('tab');

    if (p === '/') return 'داشبورد سازمانی';
    if (p === '/command') return 'مرکز فرماندهی مدیریتی';
    if (p === '/dashboard') return 'داشبورد تحلیلی';
    if (p.startsWith('/accounts') || p.startsWith('/customers')) return 'مشتریان ۳۶۰';
    if (p.startsWith('/leads')) return 'سرنخ‌های فروش';
    if (p.startsWith('/opportunities')) return 'فرصت‌های مذاکره';
    if (p.startsWith('/quotes')) return 'پیش‌فاکتورها (CPQ)';
    if (p.startsWith('/tasks')) return 'پیگیری و کارتابل';
    if (p.startsWith('/operations')) return tab === 'returns' ? 'مرجوعی کالا' : 'مرکز عملیات و پخش';
    if (p.startsWith('/geo-intelligence')) return 'هوش مکانی';
    if (p.startsWith('/finance')) return tab === 'cheques' ? 'چک‌های صیادی' : 'امور مالی و خزانه‌داری';
    if (p.startsWith('/reports')) return 'گزارش‌های تحلیلی';
    if (p.startsWith('/groups')) return 'پیام‌ها و گفتگوها';
    if (p.startsWith('/calendar')) return 'تقویم کاری';
    if (p.startsWith('/settings')) return 'تنظیمات سامانه';
    return 'AKHAVAN CRM';
  }, [location.pathname, location.search, isDetailPage]);

  const opsBadgeCount = useMemo(() => {
    return (state?.tasks || []).filter((t: any) => t.status !== 'COMPLETED' && (t.priority === 'HIGH' || t.slaStatus === 'BREACHED')).length;
  }, [state?.tasks]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas font-sans select-none" dir="rtl">
      <AtmosphereLayer />

      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar
          sections={[]}
          user={currentUser}
          roleName={currentRole?.name}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Enterprise Floating Header */}
          <header className="se-floating-header fixed top-0 inset-x-0 z-30 px-4 py-3 flex items-center justify-between transition-all md:static md:bg-transparent md:border-none md:backdrop-filter-none md:shadow-none md:pt-4">
            
            <div className="flex items-center gap-2 shrink-0">
              {isDetailPage ? (
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer" aria-label="بازگشت">
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button onClick={() => setNavDrawerOpen(true)} className="p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer md:hidden" aria-label="منو">
                  <Menu size={20} />
                </button>
              )}
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:flex p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer" aria-label="سایدبار">
                {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            <div className="flex-1 flex justify-center px-2">
              <h1 className="text-sm md:text-base font-bold text-ink-main truncate max-w-[200px] sm:max-w-md text-center">
                {activePageLabel}
              </h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="hidden md:flex items-center gap-2 h-9 w-64 px-3 rounded-lg border border-border bg-surface text-ink-secondary focus-within:border-primary transition-colors cursor-text" onClick={onOpenSearch}>
                <Search size={16} />
                <span className="text-xs">جستجوی سراسری...</span>
              </div>
              <button onClick={onOpenSearch} className="md:hidden p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer">
                <Search size={18} />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer">
                {theme === 'dark' ? <Sun size={18} className="text-warning" /> : <Moon size={18} />}
              </button>
              <button onClick={onOpenNotifications} className="relative p-2 rounded-lg text-ink-secondary hover:bg-border transition-colors cursor-pointer">
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface animate-pulse" />
                )}
              </button>
            </div>
          </header>

          <main id="main-scroll-container" className="w-full flex-1 overflow-y-auto main-content-scroll no-scrollbar md:!pt-2">
            <div className="mx-auto min-h-full w-full max-w-7xl pb-6">
              {children}
            </div>
          </main>
        </div>

        {!inChat && <BottomNav opsBadgeCount={opsBadgeCount} className="md:hidden" />}
      </div>

      <NavigationDrawer
        isOpen={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        state={state}
      />
    </div>
  );
}
