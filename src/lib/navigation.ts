import {
  Home, Gauge, LayoutDashboard, Users, UserPlus, TrendingUp, FileSpreadsheet,
  Truck, MapPinned, CheckSquare, Calendar, Activity, RotateCcw,
  Wallet, CreditCard, PieChart, FolderKanban, ShieldCheck, UserCheck,
  Cpu, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { RBACService } from './rbac';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Navigation target (may include ?tab=) */
  path: string;
  /** RBAC workspace permission key */
  perm: string;
  /** Path prefixes (segment-aware) that make this item active */
  match: string[];
  /** Item is active only on this ?tab= value */
  tab?: string;
  /** Item is NOT active when ?tab= is one of these (they belong to sibling items) */
  excludeTabs?: string[];
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'نمای کلی',
    items: [
      { id: 'home', label: 'خانه', icon: Home, path: '/', perm: 'home', match: ['/'] },
      { id: 'dashboard', label: 'داشبورد تحلیلی', icon: LayoutDashboard, path: '/dashboard', perm: 'dashboard', match: ['/dashboard'] },
    ],
  },
  {
    id: 'sales',
    title: 'فروش و مشتریان',
    items: [
      { id: 'command', label: 'مرکز فرماندهی مدیریتی', icon: Gauge, path: '/command', perm: 'command', match: ['/command'] },
      { id: 'accounts', label: 'مشتریان و Customer 360', icon: Users, path: '/accounts', perm: 'accounts', match: ['/accounts', '/customers'] },
      { id: 'leads', label: 'سرنخ‌های فروش', icon: UserPlus, path: '/leads', perm: 'leads', match: ['/leads'] },
      { id: 'opportunities', label: 'فرصت‌های مذاکره', icon: TrendingUp, path: '/opportunities', perm: 'quotes', match: ['/opportunities'] },
      { id: 'quotes', label: 'پیش‌فاکتورها و فروش (CPQ)', icon: FileSpreadsheet, path: '/quotes', perm: 'quotes', match: ['/quotes'] },
    ],
  },
  {
    id: 'ops',
    title: 'توزیع، عملیات و پیگیری',
    items: [
      { id: 'operations', label: 'مرکز عملیات فروش و پخش', icon: Truck, path: '/operations', perm: 'operations_control', match: ['/operations', '/operations_control'], excludeTabs: ['returns'] },
      { id: 'geo_intelligence', path: '/geo-intelligence', label: 'هوش مکانی و مدیریت زون‌ها', icon: MapPinned, perm: 'geo_intelligence', match: ['/geo-intelligence'] },
      { id: 'tasks', label: 'پیگیری و تسک‌ها', icon: CheckSquare, path: '/tasks', perm: 'tasks', match: ['/tasks'] },
      { id: 'calendar', label: 'تقویم کاری و جلسات', icon: Calendar, path: '/calendar', perm: 'calendar', match: ['/calendar'] },
      { id: 'activities', label: 'تاریخچه فعالیت‌ها', icon: Activity, path: '/activities', perm: 'activities', match: ['/activities'] },
      { id: 'returns', label: 'مرجوعی و بازگشت کالا', icon: RotateCcw, path: '/operations?tab=returns', perm: 'operations_control', match: ['/operations', '/operations_control'], tab: 'returns' },
    ],
  },
  {
    id: 'finance',
    title: 'امور مالی و خزانه‌داری',
    items: [
      { id: 'finance', label: 'دریافت و پرداخت', icon: Wallet, path: '/finance', perm: 'finance', match: ['/finance'], excludeTabs: ['cheques'] },
      { id: 'cheques', label: 'چک و تعهدات', icon: CreditCard, path: '/finance?tab=cheques', perm: 'finance', match: ['/finance'], tab: 'cheques' },
      { id: 'reports', label: 'گزارش‌های مالی و تحلیلی', icon: PieChart, path: '/reports', perm: 'reports', match: ['/reports'] },
    ],
  },
  {
    id: 'knowledge_org',
    title: 'دانش، سازمان و پشتیبانی',
    items: [
      { id: 'knowledge', label: 'پایگاه دانش', icon: FolderKanban, path: '/knowledge', perm: 'knowledge', match: ['/knowledge'] },
      { id: 'cases', label: 'تیکت‌ها و پشتیبانی', icon: ShieldCheck, path: '/cases', perm: 'cases', match: ['/cases'] },
      { id: 'onboarding', label: 'پرونده پرسنلی و استخدام', icon: UserCheck, path: '/onboarding', perm: 'onboarding', match: ['/onboarding'] },
      { id: 'automation', label: 'اتوماسیون و درخواست‌ها', icon: Cpu, path: '/internal_automation', perm: 'internal_automation', match: ['/internal_automation'] },
      { id: 'marketing', label: 'کمپین‌ها و بازاریابی', icon: Sparkles, path: '/marketing', perm: 'marketing', match: ['/marketing'] },
      { id: 'groups', label: 'تیم‌ها و گروه‌های سازمانی', icon: Users, path: '/groups', perm: 'groups', match: ['/groups'] },
    ],
  },
];

/** Segment-aware prefix match: '/operations' does not match '/operations_control' */
export function pathMatches(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/';
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export function isNavActive(item: NavItem, pathname: string, search = ''): boolean {
  if (!item.match.some((m) => pathMatches(pathname, m))) return false;
  const tab = new URLSearchParams(search).get('tab');
  if (item.tab) return tab === item.tab;
  if (item.excludeTabs && tab && item.excludeTabs.includes(tab)) return false;
  return true;
}

const ALWAYS_ALLOWED = new Set(['home', 'dashboard', 'groups', 'command', 'profile']);

export function makeCanAccess(rbac: RBACService | null) {
  return (perm: string): boolean => {
    if (!rbac) return true;
    if (ALWAYS_ALLOWED.has(perm)) return true;
    return rbac.canAccessWorkspace(perm as any);
  };
}
