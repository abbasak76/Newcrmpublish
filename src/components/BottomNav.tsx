import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, TrendingUp, CheckSquare, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

export const NAV_ITEMS = [
  { id: 'home', path: '/', label: 'خانه', icon: Home },
  { id: 'accounts', path: '/customers', label: 'مشتریان', icon: Users },
  { id: 'sales', path: '/quotes', label: 'فروش', icon: TrendingUp },
  { id: 'tasks', path: '/tasks', label: 'پیگیری', icon: CheckSquare },
  { id: 'operations', path: '/operations_control', label: 'عملیات', icon: LayoutGrid },
] as const;

interface BottomNavProps {
  className?: string;
  opsBadgeCount?: number;
}

export function BottomNav({ className, opsBadgeCount = 0 }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabId = (pathname: string) => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/customers') || pathname.startsWith('/accounts')) return 'accounts';
    if (pathname.startsWith('/quotes') || pathname.startsWith('/opportunities') || pathname.startsWith('/leads')) return 'sales';
    if (pathname.startsWith('/tasks')) return 'tasks';
    if (pathname.startsWith('/operations') || pathname.startsWith('/geo-intelligence')) return 'operations';
    return '';
  };

  const activeTabId = getActiveTabId(location.pathname);

  return (
    <nav
      aria-label="ناوبری اصلی"
      dir="rtl"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md",
        "bg-surface-glass backdrop-blur-xl border border-border shadow-floating rounded-2xl",
        "p-1.5 flex items-center justify-between select-none",
        className
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTabId === item.id;
        const isOps = item.id === 'operations';

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center min-h-[48px] flex-1 cursor-pointer rounded-xl transition-all duration-200",
              isActive ? "text-primary" : "text-ink-muted hover:text-ink-secondary hover:bg-border-light"
            )}
          >
            <div className={cn("p-1 rounded-lg transition-colors", isActive && "bg-primary-soft")}>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] mt-0.5 font-medium transition-all", isActive ? "font-bold" : "")}>
              {item.label}
            </span>

            {isOps && opsBadgeCount > 0 && (
              <span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold font-mono flex items-center justify-center tabular-nums shadow-sm">
                {opsBadgeCount > 99 ? '99+' : opsBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
