import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { NAV_SECTIONS, isNavActive } from '../lib/navigation';
import { Avatar } from './ui/Avatar';

interface DesktopSidebarProps {
  user?: any;
  roleName?: string;
  collapsed: boolean;
  canAccess: (perm: string) => boolean;
}

export function DesktopSidebar({ user, roleName, collapsed, canAccess }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const settingsActive = location.pathname.startsWith('/settings');

  return (
    <aside
      aria-label="ناوبری اصلی"
      dir="rtl"
      className={cn(
        'hidden md:flex shrink-0 h-full flex-col bg-surface border-l border-border transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[272px]'
      )}
    >
      {/* Brand */}
      <div className="bg-navy text-white h-16 shrink-0 flex items-center gap-3 px-4">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg">A</div>
        {!collapsed && <span className="font-bold tracking-wide truncate">AKHAVAN CRM</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-3">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => canAccess(i.perm));
          if (items.length === 0) return null;
          return (
            <div key={section.id}>
              {collapsed ? (
                <div className="h-px bg-border mx-3 mb-2" />
              ) : (
                <div className="px-3 pb-1 text-[11px] font-bold text-ink-muted tracking-wide">{section.title}</div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = isNavActive(item, location.pathname, location.search);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                        collapsed ? 'justify-center h-11' : 'px-3 py-2.5',
                        active ? 'bg-primary-soft text-primary font-bold' : 'text-ink-main hover:bg-canvas'
                      )}
                    >
                      <Icon size={18} className={active ? 'text-primary' : 'text-ink-muted'} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer: settings + user */}
      <div className="shrink-0 border-t border-border p-2 space-y-1">
        {canAccess('settings') && (
          <button
            type="button"
            title="تنظیمات سامانه"
            aria-label="تنظیمات سامانه"
            onClick={() => navigate('/settings')}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors cursor-pointer',
              collapsed ? 'justify-center h-11' : 'px-3 py-2.5',
              settingsActive ? 'bg-primary-soft text-primary font-bold' : 'text-ink-main hover:bg-canvas'
            )}
          >
            <Settings size={18} className={settingsActive ? 'text-primary' : 'text-ink-muted'} />
            {!collapsed && <span>تنظیمات سامانه</span>}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl hover:bg-canvas transition-colors cursor-pointer',
            collapsed ? 'justify-center h-12' : 'px-2 py-2'
          )}
        >
          <Avatar name={user?.name || 'کاربر'} src={user?.avatar} size="sm" />
          {!collapsed && (
            <div className="min-w-0 text-start">
              <div className="text-sm font-bold text-ink-main truncate">{user?.name || 'کاربر سیستم'}</div>
              <div className="text-xs text-ink-secondary truncate">{roleName || 'مدیر'}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
