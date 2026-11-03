import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Handshake,
  TrendingUp,
  Wallet,
  CreditCard,
  PieChart,
  Truck,
  RotateCcw,
  CheckSquare,
  BarChart3,
  GitFork,
  Settings,
  Info,
  LogOut,
  ChevronDown,
  ArrowLeft,
  Gauge,
  UserPlus,
  FileSpreadsheet,
  MapPinned,
  Calendar,
  Activity,
  FolderKanban,
  ShieldCheck,
  UserCheck,
  Cpu,
  Sparkles
} from 'lucide-react';
import { RBACService } from '../lib/rbac';
import { APP_VERSION_LABEL } from '../lib/version';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state?: any;
}

export function NavigationDrawer({ isOpen, onClose, state }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // چهار دسته بندی اصلی: به طور پیش‌فرض باز برای دسترسی سریع
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sales: true,
    ops: true,
    finance: true,
    knowledge_org: true,
  });

  const currentUser = state?.users?.find((u: any) => u.id === state?.currentUserId);
  const currentRole = state?.roles?.find((r: any) => r.id === currentUser?.roleId);
  const rbac = useMemo(() => (state ? new RBACService(state) : null), [state]);
  
  const canAccess = (perm: string) => {
    if (!rbac) return true;
    if (perm === 'groups' || perm === 'command' || perm === 'profile') return true;
    return rbac.canAccessWorkspace(perm as any);
  };

  useEffect(() => {
    document.body.classList.toggle('dopen', isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('dopen');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ژست حرکتی لمسی: کشیدن به راست برای بستن منو
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX;
      if (isOpen && deltaX > 70) {
        onClose();
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  // چهار دسته بندی اصلی شامل تمام ۲۱ ماژول سیستم
  const sections = [
    {
      id: 'sales',
      title: 'فروش و مشتریان',
      items: [
        { label: 'مرکز فرماندهی مدیریتی', icon: Gauge, path: '/command', perm: 'command' },
        { label: 'حساب‌ها و مشتریان ۳۶۰', icon: Users, path: '/accounts', perm: 'accounts' },
        { label: 'سرنخ‌های فروش', icon: UserPlus, path: '/leads', perm: 'leads' },
        { label: 'فرصت‌های مذاکره', icon: TrendingUp, path: '/opportunities', perm: 'quotes' },
        { label: 'پیش‌فاکتورها و پیشنهاد فروش', icon: FileSpreadsheet, path: '/quotes', perm: 'quotes' },
      ],
    },
    {
      id: 'ops',
      title: 'توزیع، عملیات و پیگیری',
      items: [
        { label: 'مرکز عملیات فروش و پخش', icon: Truck, path: '/operations', perm: 'operations_control' },
        { label: 'هوش مکانی و مدیریت زون‌ها', icon: MapPinned, path: '/geo-intelligence', perm: 'geo_intelligence' },
        { label: 'پیگیری و تسک‌ها', icon: CheckSquare, path: '/tasks', perm: 'tasks' },
        { label: 'تقویم کاری و جلسات', icon: Calendar, path: '/calendar', perm: 'calendar' },
        { label: 'تاریخچه فعالیت‌ها و تماس', icon: Activity, path: '/activities', perm: 'activities' },
        { label: 'بازگشت کالا و مرجوعی', icon: RotateCcw, path: '/operations?tab=returns', perm: 'operations_control' },
      ],
    },
    {
      id: 'finance',
      title: 'امور مالی و خزانه‌داری',
      items: [
        { label: 'دریافت و پرداخت / مطالبات', icon: Wallet, path: '/finance', perm: 'finance' },
        { label: 'چک و تعهدات', icon: CreditCard, path: '/finance?tab=checks', perm: 'finance' },
        { label: 'گزارش‌ها و تحلیل‌های مالی', icon: PieChart, path: '/reports', perm: 'reports' },
      ],
    },
    {
      id: 'knowledge_org',
      title: 'دانش، سازمان و پشتیبانی',
      items: [
        { label: 'پایگاه دانش سازمانی', icon: FolderKanban, path: '/knowledge', perm: 'knowledge' },
        { label: 'تیکت‌ها و پشتیبانی مشتریان', icon: ShieldCheck, path: '/cases', perm: 'cases' },
        { label: 'استخدام و پرونده پرسنلی', icon: UserCheck, path: '/onboarding', perm: 'onboarding' },
        { label: 'اتوماسیون و درخواست‌ها', icon: Cpu, path: '/internal_automation', perm: 'internal_automation' },
        { label: 'کمپین‌ها و بازاریابی', icon: Sparkles, path: '/marketing', perm: 'marketing' },
        { label: 'تیم‌ها و گروه‌های سازمانی', icon: Users, path: '/groups', perm: 'groups' },
      ],
    },
  ];

  let nCounter = 0;

  return (
    <div className={cn("dr", isOpen && "on")} dir="rtl" role="dialog" aria-modal="true" aria-label="منوی اصلی">
      {/* لایه محو شیشه‌ای پشت منو */}
      <div className="sc" onClick={onClose} />

      {/* پنل اصلی شرابی با هاله لوکس مطابق رفرنس */}
      <aside className="pn">
        {/* نشان لوگو و برند اخوان مطابق رفرنس */}
        <div className="lg">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="akhavanGoldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD9A8" />
                <stop offset="100%" stopColor="#D9824F" />
              </linearGradient>
            </defs>
            <path
              d="M24 5l19 34H5z"
              fill="url(#akhavanGoldGrad)"
              stroke="#FFE7C9"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M15 33c6-1 12-6 16-14 1 7-2 13-8 16z"
              fill="#FFFFFF"
              opacity="0.92"
            />
          </svg>
          <b>AKHAVAN <span>CRM</span></b>
        </div>

        {/* لیست اسکرولی منوها */}
        <div className="mid">
          {/* آیتم فعال درخشان بالای منو (داشبورد) */}
          <button
            type="button"
            className={cn("it", currentPath === '/' ? "on" : "")}
            style={{ ['--n' as any]: nCounter++ }}
            onClick={() => go('/')}
          >
            <Home size={18} className="shrink-0" />
            <span className="font-bold">داشبورد</span>
            <Gauge size={16} className="text-[#F0A46A] opacity-90 mr-auto shrink-0" />
          </button>

          {/* چهار دسته‌بندی اصلی با تمام ماژول‌ها */}
          {sections.map(section => {
            const visibleItems = section.items.filter(item => canAccess(item.perm));
            if (visibleItems.length === 0) return null;
            const isSectionOpen = openSections[section.id] !== false;

            return (
              <div key={section.id}>
                {/* هدر بخش با نقطه طلایی، عنوان و خط محوشونده */}
                <button
                  type="button"
                  className={cn("sh", !isSectionOpen && "cl")}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isSectionOpen}
                >
                  <span>{section.title}</span>
                  <i />
                  <ChevronDown size={13} className="shrink-0" />
                </button>

                {/* زیرآیتم‌های بخش */}
                {isSectionOpen && (
                  <div className="sec">
                    {visibleItems.map(item => {
                      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                      const Icon = item.icon;
                      const n = nCounter++;

                      return (
                        <button
                          key={item.path}
                          type="button"
                          className={cn("it", isActive && "on")}
                          style={{ ['--n' as any]: n }}
                          onClick={() => go(item.path)}
                        >
                          <Icon size={18} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <hr />

          {/* ابزارها و تنظیمات */}
          {canAccess('settings') && (
            <button
              type="button"
              className={cn("it", currentPath === '/settings' && "on")}
              style={{ ['--n' as any]: nCounter++ }}
              onClick={() => go('/settings')}
            >
              <Settings size={18} />
              <span>تنظیمات</span>
            </button>
          )}

          <button
            type="button"
            className="it"
            style={{ ['--n' as any]: nCounter++ }}
            onClick={() => {
              alert(`سامانه مدیریت هوشمند اخوان (AKHAVAN CRM)\nنسخه: ${APP_VERSION_LABEL}\nمعماری: PWA موبایل‌محور با توکن‌های Solar Ember`);
            }}
          >
            <Info size={18} />
            <span>درباره نرم‌افزار</span>
          </button>

          <div
            className="it flex items-center justify-between"
            style={{ ['--n' as any]: nCounter++ }}
          >
            <div className="flex items-center gap-3">
              <span className="text-white/90">حالت نمایشی تم</span>
            </div>
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="it hover:text-red-300 transition-colors"
            style={{ ['--n' as any]: nCounter++ }}
            onClick={() => {
              onClose();
              navigate('/login');
            }}
          >
            <LogOut size={18} />
            <span>خروج از حساب</span>
          </button>

          <div className="text-[10px] text-white/40 font-mono text-center pt-2 pb-1 dir-ltr">
            {APP_VERSION_LABEL}
          </div>
        </div>

        {/* کارت پروفایل کاربر در پایین منو مطابق رفرنس */}
        <div
          className="us"
          onClick={() => go('/profile')}
          role="button"
          tabIndex={0}
          aria-label="پروفایل کاربر"
        >
          <div className="cb">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{currentUser?.name?.[0] || 'ع'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <b>{currentUser?.name || 'عباس اخوان'}</b>
            <small>{currentRole?.name || 'مدیر سیستم'}</small>
          </div>
          <ArrowLeft size={18} className="text-white/80 shrink-0" />
        </div>
      </aside>
    </div>
  );
}
