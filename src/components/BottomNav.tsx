import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, TrendingUp, CheckSquare, LayoutGrid, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { pathMatches } from '../lib/navigation';

export interface BottomNavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  perm: string;
  match: string[];
}

export const NAV_ITEMS: ReadonlyArray<BottomNavItem> = [
  { id: 'home', path: '/', label: 'خانه', icon: Home, perm: 'home', match: ['/'] },
  { id: 'accounts', path: '/customers', label: 'مشتریان', icon: Users, perm: 'accounts', match: ['/customers', '/accounts'] },
  { id: 'sales', path: '/quotes', label: 'فروش', icon: TrendingUp, perm: 'quotes', match: ['/quotes', '/opportunities', '/leads'] },
  { id: 'tasks', path: '/tasks', label: 'پیگیری', icon: CheckSquare, perm: 'tasks', match: ['/tasks'] },
  { id: 'operations', path: '/operations_control', label: 'عملیات', icon: LayoutGrid, perm: 'operations_control', match: ['/operations', '/operations_control', '/geo-intelligence'] },
];

interface BottomNavProps {
  className?: string;
  opsBadgeCount?: number;
  /** RBAC check; tabs the user cannot access are hidden. */
  canAccess?: (perm: string) => boolean;
}

export function BottomNav({ className, opsBadgeCount = 0, canAccess }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTabId =
    NAV_ITEMS.find((item) => item.match.some((m) => pathMatches(location.pathname, m)))?.id ?? '';

  const visibleItems = canAccess ? NAV_ITEMS.filter((i) => canAccess(i.perm)) : NAV_ITEMS;

  return (
    <nav
      aria-label="ناوبری اصلی"
      dir="rtl"
      className={cn(
        // Pure rectangular dock: no rounded corners, flush to bottom edge-to-edge
        'fixed bottom-0 inset-x-0 w-full z-[90] pointer-events-auto select-none rounded-none',
        'bg-[#12151E] border-t border-white/[0.08]',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.5)]',
        'pt-1',
        className
      )}
      style={{
        // iOS Safe Area Inset: sits flush at the bottom, compact and comfortable above Home Indicator
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3px)',
      }}
    >
      <div className="flex items-stretch justify-between px-1 w-full h-[46px]">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTabId === item.id;
          const isOps = item.id === 'operations';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="group relative flex-1 flex flex-col items-center justify-center cursor-pointer outline-none transition-colors"
            >
              {/* Active top horizontal electric blue bar (straight rectangular edge) */}
              {isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0 inset-x-2 h-[2.5px] bg-[#3B82F6]"
                  style={{
                    boxShadow: '0 0 8px 1px #3B82F6, 0 1px 3px rgba(59, 130, 246, 0.7)',
                  }}
                />
              )}

              {/* Soft diffused spotlight glow underneath the top line */}
              {isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 90% 65% at 50% 0%, rgba(59, 130, 246, 0.20) 0%, rgba(59, 130, 246, 0.04) 50%, transparent 80%)',
                  }}
                />
              )}

              {/* Icon Container - Compact & Sleek */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon
                  className={cn(
                    'h-[19px] w-[19px] transition-all duration-200',
                    isActive
                      ? 'text-[#3B82F6]'
                      : 'text-[#7D8A99] group-hover:text-white/80'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  fill={isActive && item.id === 'home' ? 'currentColor' : 'none'}
                />

                {/* Operations task badge */}
                {isOps && opsBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-danger text-on-danger text-[9px] font-bold flex items-center justify-center tabular-nums shadow-sm">
                    {opsBadgeCount > 99 ? '99+' : opsBadgeCount}
                  </span>
                )}
              </div>

              {/* Label - Compact 10px */}
              <span
                className={cn(
                  'relative z-10 text-[10px] leading-tight mt-0.5 transition-colors duration-200 tracking-tight',
                  isActive
                    ? 'font-bold text-[#3B82F6]'
                    : 'font-medium text-[#7D8A99] group-hover:text-white/80'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
