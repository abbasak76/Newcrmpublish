import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Users,
  TrendingUp,
  CheckSquare,
  LayoutGrid
} from 'lucide-react';
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
    if (pathname.startsWith('/quotes') || pathname.startsWith('/opportunities') || pathname.startsWith('/sales') || pathname.startsWith('/negotiations')) return 'sales';
    if (pathname.startsWith('/tasks')) return 'tasks';
    if (pathname.startsWith('/operations_control') || pathname.startsWith('/operations')) return 'operations';
    return '';
  };

  const activeTabId = getActiveTabId(location.pathname);

  return (
    <nav
      id="bottom-nav"
      aria-label="ناوبری اصلی"
      dir="rtl"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md",
        "bg-[var(--c-surface-glass)] backdrop-blur-xl border border-[var(--c-border)] shadow-lg rounded-2xl",
        "p-1.5 flex items-center justify-around gap-1 select-none transition-all duration-300",
        className
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTabId === item.id;
        const isOps = item.id === 'operations';

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            layout
            initial={false}
            animate={{
              backgroundColor: isActive ? 'var(--c-primary-soft)' : 'transparent',
              color: isActive ? 'var(--c-primary)' : 'var(--c-text-secondary)',
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={cn(
              "relative flex items-center justify-center min-h-[44px] cursor-pointer rounded-xl font-semibold select-none transition-colors",
              isActive
                ? "px-3.5 py-2 gap-2 shadow-xs"
                : "p-2.5 hover:text-[var(--c-text-primary)] hover:bg-[var(--c-sunken)]/50"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0, scale: 0.9 }}
                  animate={{ opacity: 1, width: 'auto', scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="text-xs font-bold whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {isOps && opsBadgeCount > 0 && !isActive && (
              <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--c-danger)] text-white text-[10px] font-bold font-mono flex items-center justify-center leading-none">
                {Math.min(99, opsBadgeCount).toLocaleString('fa-IR')}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
