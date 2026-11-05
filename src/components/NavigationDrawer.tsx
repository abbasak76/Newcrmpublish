import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, X, ChevronDown } from 'lucide-react';
import { RBACService } from '../lib/rbac';
import { APP_VERSION_LABEL } from '../lib/version';
import { cn } from '../lib/utils';
import { NAV_SECTIONS, isNavActive, makeCanAccess } from '../lib/navigation';
import { Avatar } from './ui/Avatar';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state?: any;
  /** Real logout handler of the app. Falls back to navigating to /login. */
  onLogout?: () => void;
}

export function NavigationDrawer({ isOpen, onClose, state, onLogout }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true, sales: true, ops: true, finance: false, knowledge_org: false,
  });

  const currentUser = state?.users?.find((u: any) => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find((r: any) => r.id === currentUser?.roleId);
  const rbac = useMemo(() => (state ? new RBACService(state) : null), [state]);
  const canAccess = useMemo(() => makeCanAccess(rbac), [rbac]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Auto-open the section that contains the active page
  useEffect(() => {
    if (!isOpen) return;
    const active = NAV_SECTIONS.find((s) => s.items.some((i) => isNavActive(i, location.pathname, location.search)));
    if (active) setOpenSections((prev) => ({ ...prev, [active.id]: true }));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const go = (path: string) => { navigate(path); onClose(); };
  const handleLogout = () => {
    onClose();
    if (onLogout) onLogout();
    else navigate('/login');
  };

  if (!isOpen) return null;

  const settingsActive = location.pathname.startsWith('/settings');

  return (
    <div className="fixed inset-0 z-50 flex md:hidden" dir="rtl" role="dialog" aria-modal="true" aria-label="منوی اصلی">
      <div className="se-backdrop-enter fixed inset-0 bg-ink-main/40 backdrop-blur-sm" onClick={onClose} />

      <aside className="se-drawer-enter relative w-[85vw] max-w-[340px] h-full bg-surface border-l border-border shadow-modal flex flex-col">
        {/* Header: Executive Navy */}
        <div className="bg-navy text-white p-5 pt-[calc(var(--safe-top)+1.25rem)] flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-lg border border-white/20">A</div>
              <span className="font-bold tracking-wide">AKHAVAN CRM</span>
            </div>
            <button onClick={onClose} aria-label="بستن" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <button type="button" className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors text-start" onClick={() => go('/profile')}>
            <Avatar name={currentUser?.name || 'کاربر'} src={currentUser?.avatar} size="md" className="ring-2 ring-white/20" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{currentUser?.name || 'کاربر سیستم'}</div>
              <div className="text-xs text-white/70 truncate">{currentRole?.name || 'مدیر'}</div>
            </div>
          </button>
        </div>

        {/* Scrollable menu */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => canAccess(item.perm));
            if (visibleItems.length === 0) return null;
            const isSectionOpen = !!openSections[section.id];

            return (
              <div key={section.id} className="mb-2">
                <button
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isSectionOpen}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-ink-secondary hover:text-ink-main transition-colors cursor-pointer"
                >
                  <span>{section.title}</span>
                  <ChevronDown size={14} className={cn('transition-transform duration-200', isSectionOpen && 'rotate-180')} />
                </button>

                {isSectionOpen && (
                  <div className="space-y-0.5 mt-1">
                    {visibleItems.map((item) => {
                      const isActive = isNavActive(item, location.pathname, location.search);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => go(item.path)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                            isActive ? 'bg-primary-soft text-primary font-bold' : 'text-ink-main hover:bg-canvas'
                          )}
                        >
                          <Icon size={18} className={isActive ? 'text-primary' : 'text-ink-muted'} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="h-px bg-border my-2 mx-3" />

          {canAccess('settings') && (
            <button
              onClick={() => go('/settings')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer',
                settingsActive ? 'bg-primary-soft text-primary font-bold' : 'text-ink-main hover:bg-canvas'
              )}
            >
              <Settings size={18} className={settingsActive ? 'text-primary' : 'text-ink-muted'} />
              <span>تنظیمات سامانه</span>
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger-soft transition-colors cursor-pointer mt-2">
            <LogOut size={18} />
            <span>خروج از حساب</span>
          </button>
        </div>

        <div className="p-4 pb-[calc(var(--safe-bottom)+1rem)] border-t border-border bg-canvas shrink-0 text-center">
          <span className="text-[11px] text-ink-muted font-mono" dir="ltr">{APP_VERSION_LABEL}</span>
        </div>
      </aside>
    </div>
  );
}
