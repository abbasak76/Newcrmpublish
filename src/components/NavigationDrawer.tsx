import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Gauge, Users, UserPlus, TrendingUp, FileSpreadsheet,
  Truck, MapPinned, CheckSquare, Calendar, Activity, RotateCcw,
  Wallet, CreditCard, PieChart, FolderKanban, ShieldCheck, UserCheck,
  Cpu, Sparkles, Settings, HelpCircle, LogOut, X, ChevronDown
} from 'lucide-react';
import { RBACService } from '../lib/rbac';
import { APP_VERSION_LABEL } from '../lib/version';
import { cn } from '../lib/utils';
import { Avatar } from './ui/Avatar';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state?: any;
}

export function NavigationDrawer({ isOpen, onClose, state }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sales: true, ops: true, finance: false, knowledge_org: false,
  });

  const currentUser = state?.users?.find((u: any) => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find((r: any) => r.id === currentUser?.roleId);
  const rbac = useMemo(() => (state ? new RBACService(state) : null), [state]);
  
  const canAccess = (perm: string) => {
    if (!rbac) return true;
    if (['groups', 'command', 'profile'].includes(perm)) return true;
    return rbac.canAccessWorkspace(perm as any);
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  const go = (path: string) => { navigate(path); onClose(); };

  const sections = [
    {
      id: 'sales', title: 'فروش و مشتریان',
      items: [
        { label: 'مرکز فرماندهی مدیریتی', icon: Gauge, path: '/command', perm: 'command' },
        { label: 'مشتریان و Customer 360', icon: Users, path: '/accounts', perm: 'accounts' },
        { label: 'سرنخ‌های فروش', icon: UserPlus, path: '/leads', perm: 'leads' },
        { label: 'فرصت‌های مذاکره', icon: TrendingUp, path: '/opportunities', perm: 'quotes' },
        { label: 'پیش‌فاکتورها و فروش (CPQ)', icon: FileSpreadsheet, path: '/quotes', perm: 'quotes' },
      ],
    },
    {
      id: 'ops', title: 'توزیع، عملیات و پیگیری',
      items: [
        { label: 'مرکز عملیات فروش و پخش', icon: Truck, path: '/operations', perm: 'operations_control' },
        { label: 'هوش مکانی و مدیریت زون‌ها', icon: MapPinned, path: '/geo-intelligence', perm: 'geo_intelligence' },
        { label: 'پیگیری و تسک‌ها', icon: CheckSquare, path: '/tasks', perm: 'tasks' },
        { label: 'تقویم کاری و جلسات', icon: Calendar, path: '/calendar', perm: 'calendar' },
        { label: 'تاریخچه فعالیت‌ها', icon: Activity, path: '/activities', perm: 'activities' },
        { label: 'مرجوعی و بازگشت کالا', icon: RotateCcw, path: '/operations?tab=returns', perm: 'operations_control' },
      ],
    },
    {
      id: 'finance', title: 'امور مالی و خزانه‌داری',
      items: [
        { label: 'دریافت و پرداخت', icon: Wallet, path: '/finance', perm: 'finance' },
        { label: 'چک و تعهدات', icon: CreditCard, path: '/finance?tab=cheques', perm: 'finance' },
        { label: 'گزارش‌های مالی و تحلیلی', icon: PieChart, path: '/reports', perm: 'reports' },
      ],
    },
    {
      id: 'knowledge_org', title: 'دانش، سازمان و پشتیبانی',
      items: [
        { label: 'پایگاه دانش', icon: FolderKanban, path: '/knowledge', perm: 'knowledge' },
        { label: 'تیکت‌ها و پشتیبانی', icon: ShieldCheck, path: '/cases', perm: 'cases' },
        { label: 'پرونده پرسنلی و استخدام', icon: UserCheck, path: '/onboarding', perm: 'onboarding' },
        { label: 'اتوماسیون و درخواست‌ها', icon: Cpu, path: '/internal_automation', perm: 'internal_automation' },
        { label: 'کمپین‌ها و بازاریابی', icon: Sparkles, path: '/marketing', perm: 'marketing' },
        { label: 'تیم‌ها و گروه‌های سازمانی', icon: Users, path: '/groups', perm: 'groups' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="fixed inset-0 bg-ink-main/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <aside className="relative w-[85vw] max-w-[340px] h-full bg-surface border-l border-border shadow-modal flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        {/* Header: Executive Navy Theme */}
        <div className="bg-[#263A50] text-white p-5 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-lg border border-white/20">A</div>
              <span className="font-bold tracking-wide">AKHAVAN CRM</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors" onClick={() => go('/profile')}>
            <Avatar name={currentUser?.name || 'کاربر'} src={currentUser?.avatar} size="md" className="ring-2 ring-white/20" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{currentUser?.name || 'کاربر سیستم'}</div>
              <div className="text-xs text-white/60 truncate">{currentRole?.name || 'مدیر'}</div>
            </div>
          </div>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
          {sections.map(section => {
            const visibleItems = section.items.filter(item => canAccess(item.perm));
            if (visibleItems.length === 0) return null;
            const isSectionOpen = openSections[section.id];

            return (
              <div key={section.id} className="mb-2">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-ink-secondary hover:text-ink-main transition-colors cursor-pointer"
                >
                  <span>{section.title}</span>
                  <ChevronDown size={14} className={cn("transition-transform duration-200", isSectionOpen && "rotate-180")} />
                </button>

                {isSectionOpen && (
                  <div className="space-y-0.5 mt-1">
                    {visibleItems.map(item => {
                      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => go(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                            isActive ? "bg-primary-soft text-primary font-bold" : "text-ink-main hover:bg-canvas"
                          )}
                        >
                          <Icon size={18} className={isActive ? "text-primary" : "text-ink-muted"} />
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

          {/* Settings & Footer Links */}
          {canAccess('settings') && (
            <button onClick={() => go('/settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-main hover:bg-canvas transition-colors cursor-pointer">
              <Settings size={18} className="text-ink-muted" />
              <span>تنظیمات سامانه</span>
            </button>
          )}
          <button onClick={() => go('/login')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger-soft transition-colors cursor-pointer mt-2">
            <LogOut size={18} />
            <span>خروج از حساب</span>
          </button>
        </div>

        <div className="p-4 border-t border-border bg-canvas shrink-0 text-center">
          <span className="text-[10px] text-ink-muted font-mono" dir="ltr">{APP_VERSION_LABEL}</span>
        </div>
      </aside>
    </div>
  );
}
