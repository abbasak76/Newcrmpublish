import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronsLeft, ChevronsRight, Home, Sun, Sunrise, Sunset, Moon, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import { NavSection, isActivePath } from '../lib/navigation';
import { AtmosphereMode, useTheme } from '../theme/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

const ATMO: { id: AtmosphereMode; label: string; icon: React.ElementType }[] = [
  { id: 'auto', label: 'خودکار (ساعت محلی)', icon: Sparkles }, { id: 'twilight', label: 'گرگ‌ومیش', icon: Sunrise },
  { id: 'morning', label: 'صبح', icon: Sun }, { id: 'sunset', label: 'غروب', icon: Sunset }, { id: 'night', label: 'شب', icon: Moon },
];
export function AtmosphereSwitch({ compact = false }: { compact?: boolean }) {
  const { atmosphereMode, setAtmosphereMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="هاله جوی" className={cn('flex items-center gap-1', compact && 'flex-col')}>
      {ATMO.map(a => { const on = atmosphereMode === a.id; const I = a.icon; return (
        <button key={a.id} role="radio" aria-checked={on} aria-label={a.label} title={a.label} onClick={() => setAtmosphereMode(a.id)}
          className={cn('se-interactive grid h-9 w-9 cursor-pointer place-items-center rounded-full', on ? 'bg-primary/10 text-primary' : 'text-ink-soft hover:bg-ink/10')}>
          <I size={15} />
        </button>); })}
    </div>
  );
}

interface SidebarProps {
  sections: NavSection[];
  user?: { name?: string; avatar?: string };
  roleName?: string;
  stats?: { openTasks: number; doneTasks: number; overdue: number };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** سایدبار دسکتاپ (۲۷۲ / ۷۶ پیکسل): گروه‌بندی تمام ماژول‌ها از رجیستری navigation.ts، فیلتر شده با مجوز */
export function Sidebar({ sections, user, roleName, stats, collapsed: propCollapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(() => { try { return localStorage.getItem('akhavan-sidebar') === 'collapsed'; } catch { return false; } });
  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const setCollapsed = onToggleCollapse || (() => setInternalCollapsed(c => !c));
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(sections.map(s => [s.id, true])));
  useEffect(() => { try { localStorage.setItem('akhavan-sidebar', collapsed ? 'collapsed' : 'open'); } catch { /* ignore */ } }, [collapsed]);
  const itemCls = (on: boolean) => cn('se-interactive group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl text-start',
    collapsed ? 'h-11 justify-center' : 'px-3.5 py-2.5', on ? 'bg-primary text-white shadow-lux font-bold' : 'text-ink hover:bg-primary/[.07]');

  return (
    <aside aria-label="منوی اصلی" style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      data-collapsed={collapsed ? 'true' : 'false'} className="se-side glass-strong relative z-30 m-3 me-0 hidden shrink-0 flex-col overflow-hidden rounded-[var(--radius-se-2xl)] lg:flex">
      <div className={cn('flex items-center gap-3 p-4', collapsed && 'justify-center px-2')}>
        <button onClick={() => navigate('/')} aria-label="صفحه اصلی" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl bg-primary text-base font-black text-white shadow-lux">ا</button>
        {!collapsed && <div className="min-w-0"><h1 className="text-sm font-black tracking-tight text-ink">AKHAVAN CRM</h1><p className="truncate text-[10px] text-ink-soft">سیستم جامع فروش و سازمان</p></div>}
      </div>

      <nav className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-2.5 pb-3">
        <button onClick={() => navigate('/')} title="خانه" aria-current={pathname === '/' ? 'page' : undefined} className={itemCls(pathname === '/')}>
          <Home size={17} className="se-side-icon shrink-0" strokeWidth={pathname === '/' ? 2.5 : 1.8} /><span className="se-side-label text-xs">صفحه میز کار (خانه)</span>
        </button>
        {sections.map(s => (
          <div key={s.id} className="space-y-0.5">
            {!collapsed ? (
              <button onClick={() => setOpen(o => ({ ...o, [s.id]: !o[s.id] }))} aria-expanded={open[s.id] !== false}
                className="flex w-full cursor-pointer items-center justify-between px-3.5 py-1.5 text-[11px] font-black text-ink-soft hover:text-ink">
                <span>{s.title}</span><ChevronDown size={13} className={cn('transition-transform duration-200', open[s.id] !== false && 'rotate-180')} />
              </button>
            ) : <span aria-hidden className="mx-auto my-1 block h-px w-6 bg-border" />}
            {(collapsed || open[s.id] !== false) && s.items.map(item => {
              const on = isActivePath(pathname, item.path); const I = item.icon;
              return (
                <button key={item.id} onClick={() => navigate(item.path)} title={item.label} aria-label={item.label} aria-current={on ? 'page' : undefined} className={itemCls(on)}>
                  <I size={17} className={cn('se-side-icon shrink-0', on ? 'text-white' : 'text-ink-soft group-hover:text-primary')} strokeWidth={on ? 2.5 : 1.8} />
                  <span className="se-side-label truncate text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={cn('space-y-2 border-t border-border p-3', collapsed && 'px-2')}>
        {!collapsed && <ThemeToggle className="w-full justify-between" />}
        <AtmosphereSwitch compact={collapsed} />
        <button onClick={() => navigate('/profile')} title="پروفایل" className={cn('group relative flex w-full flex-col gap-2.5 overflow-hidden rounded-[24px] border border-[var(--card-stroke)] bg-[var(--card-bg)] p-2.5 text-start shadow-[var(--card-inset)] transition-colors hover:bg-primary/[.07]', collapsed && 'items-center')}>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative z-10 flex items-center gap-2.5">
            <span className="relative"><Avatar name={user?.name || 'کاربر'} src={user?.avatar} size="sm" /><span className="se-dot is-live absolute -bottom-0.5 -end-0.5 border-2 border-surface text-success" title="شما وارد هستید" /></span>
            <span className="se-side-label min-w-0"><span className="block truncate text-xs font-black text-ink">{user?.name || 'کاربر سیستم'}</span><span className="block truncate text-[10px] font-bold text-primary">{roleName || '—'}</span></span>
          </span>
          {stats && stats.openTasks + stats.doneTasks > 0 && (
            <span className="se-side-label relative z-10 block w-full" aria-label="پیشرفت وظایف من">
              <span className="mb-1 flex items-center justify-between text-[10px] text-ink-soft"><span>وظایف انجام‌شده</span><span className="se-num">{stats.doneTasks.toLocaleString('fa-IR')}/{(stats.openTasks + stats.doneTasks).toLocaleString('fa-IR')}{stats.overdue > 0 ? ` · ${stats.overdue.toLocaleString('fa-IR')} معوق` : ''}</span></span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-primary/15"><span className="block h-full origin-right rounded-full bg-primary transition-transform duration-700 ease-[var(--ease-enter)]" style={{ transform: `scaleX(${stats.doneTasks / (stats.openTasks + stats.doneTasks)})` }} /></span>
            </span>
          )}
        </button>
        <button onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار'} aria-expanded={!collapsed}
          className="se-interactive grid h-9 w-full cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-ink/10">
          {collapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>
    </aside>
  );
}
