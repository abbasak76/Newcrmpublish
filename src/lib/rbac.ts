import { AppState, CapabilityPermission, UserAccount, NavigationTab } from '../types';

export const PERMISSION_LABELS: Record<CapabilityPermission, string> = {
  'accounts.view': 'مشاهده حساب‌ها و مشتریان',
  'accounts.edit': 'ویرایش اطلاعات مشتریان',
  'accounts.delete': 'حذف حساب تجاری',
  'leads.view': 'مشاهده سرنخ‌های فروش',
  'leads.edit': 'ویرایش و تبدیل سرنخ',
  'quotes.view': 'مشاهده پیش‌فاکتورها',
  'quotes.create': 'صدور پیش‌فاکتور جدید',
  'quotes.approve': 'تایید پیش‌فاکتور (مدیریتی)',
  'finance.view': 'مشاهده اطلاعات مالی و وصولی',
  'finance.manage': 'ثبت پرداختی و مدیریت مالی',
  'settings.manage': 'مدیریت تنظیمات کلان سیستم',
  'cases.view': 'مشاهده پرونده‌ها و شکایات',
  'cases.edit': 'ویرایش و پاسخ به پرونده‌ها',
  'marketing.manage': 'مدیریت کمپین‌های بازاریابی',
  'knowledge.manage': 'مدیریت پایگاه دانش',
  'agents.manage': 'مدیریت دستیاران هوشمند (AI)',
  'automation.manage': 'مدیریت قوانین گردش‌کار',
  'users.manage': 'مدیریت کاربران سیستم',
  'roles.manage': 'مدیریت نقش‌ها و دسترسی‌ها',
  'internal.view': 'مشاهده اتوماسیون داخلی',
  'internal.manage': 'مدیریت و تایید اتوماسیون داخلی',
  'geo.view': 'مشاهده هوش مکانی و زون‌ها',
  'geo.manage': 'مدیریت و ویرایش زون‌های مکانی'
};

/* ==========================================================================
   ماتریس مجوز عملیات × ماژول — روی همین RBACService (بدون موتور دوم).
   - کلید صریح مجموعه‌مجوز (مثلاً "tasks.assign") اولویت دارد؛
   - در نبود آن، نگاشت موقت به CapabilityPermissionهای موجود (any-of) استفاده می‌شود؛
   - ترکیب ماژول/عملیات تعریف‌نشده = رد (default-deny).
   توجه: این کنترل فقط سمت کلاینت است و جایگزین enforcement سمت سرور/RLS نیست.
   ========================================================================== */
export type PermAction = 'VIEW' | 'CREATE' | 'EDIT' | 'ASSIGN' | 'ALLOCATE' | 'APPROVE' | 'SOFT_DELETE';
export type PermModule = 'accounts' | 'leads' | 'opportunities' | 'quotes' | 'tasks' | 'activities' | 'cases' | 'finance' | 'payments'
  | 'groups' | 'messages' | 'internal' | 'calendar' | 'reports' | 'settings' | 'users' | 'roles' | 'onboarding' | 'financeRequests' | 'geo';

export const PERMISSION_ACTIONS: PermAction[] = ['VIEW', 'CREATE', 'EDIT', 'ASSIGN', 'ALLOCATE', 'APPROVE', 'SOFT_DELETE'];
const AD = ['internal.manage', 'settings.manage'] as CapabilityPermission[];
export const PERMISSION_MATRIX: Record<PermModule, Partial<Record<PermAction, CapabilityPermission[]>>> = {
  accounts:      { VIEW: ['accounts.view'], CREATE: ['accounts.edit'], EDIT: ['accounts.edit'], ASSIGN: ['accounts.edit'], SOFT_DELETE: ['accounts.delete'] },
  leads:         { VIEW: ['leads.view'], CREATE: ['leads.edit'], EDIT: ['leads.edit'], ASSIGN: ['leads.edit'], SOFT_DELETE: ['leads.edit'] },
  opportunities: { VIEW: ['accounts.view', 'leads.view'], CREATE: ['accounts.edit', 'leads.edit'], EDIT: ['accounts.edit', 'leads.edit'], ASSIGN: ['accounts.edit'], APPROVE: ['quotes.approve'], SOFT_DELETE: ['accounts.delete'] },
  quotes:        { VIEW: ['quotes.view'], CREATE: ['quotes.create'], EDIT: ['quotes.create'], APPROVE: ['quotes.approve'], SOFT_DELETE: ['quotes.approve'] },
  tasks:         { VIEW: ['accounts.view', 'internal.view', 'internal.manage'], CREATE: ['accounts.edit', 'leads.edit', 'internal.view', 'internal.manage'], EDIT: ['accounts.edit', 'leads.edit', 'internal.view', 'internal.manage'], ASSIGN: ['internal.manage', 'accounts.edit'], APPROVE: ['internal.manage'], SOFT_DELETE: ['internal.manage'] },
  activities:    { VIEW: ['accounts.view', 'leads.view'], CREATE: ['accounts.edit', 'leads.edit'], EDIT: ['accounts.edit', 'leads.edit'], SOFT_DELETE: ['accounts.edit', 'leads.edit'] },
  cases:         { VIEW: ['cases.view'], CREATE: ['cases.edit'], EDIT: ['cases.edit'], ASSIGN: ['cases.edit'], APPROVE: ['internal.manage'], SOFT_DELETE: ['cases.edit'] },
  finance:       { VIEW: ['finance.view'], CREATE: ['finance.manage'], EDIT: ['finance.manage'], ALLOCATE: ['finance.manage'], APPROVE: ['finance.manage'], SOFT_DELETE: ['finance.manage'] },
  payments:      { VIEW: ['finance.view'], CREATE: ['finance.manage'], EDIT: ['finance.manage'], ALLOCATE: ['finance.manage'], APPROVE: ['finance.manage'], SOFT_DELETE: ['finance.manage'] },
  groups:        { VIEW: [], CREATE: AD, EDIT: AD, ASSIGN: AD, SOFT_DELETE: AD },          // VIEW = فقط عضویت واقعی
  messages:      { VIEW: [], CREATE: [], EDIT: [], SOFT_DELETE: [] },                       // عضویت + مالکیت پیام (بدون مجوز مدیریتی خودکار)
  internal:      { VIEW: ['internal.view', 'internal.manage'], CREATE: ['internal.view', 'internal.manage'], EDIT: ['internal.manage'], ASSIGN: ['internal.manage'], APPROVE: ['internal.manage'], SOFT_DELETE: ['internal.manage'] },
  calendar:      { VIEW: ['accounts.view', 'internal.view'], CREATE: ['accounts.edit', 'internal.view'], EDIT: ['accounts.edit', 'internal.view'], SOFT_DELETE: ['accounts.edit', 'internal.manage'] },
  reports:       { VIEW: ['accounts.view', 'finance.view', 'internal.view'] },
  geo:           { VIEW: ['geo.view'], CREATE: ['geo.manage'], EDIT: ['geo.manage'], ASSIGN: ['geo.manage'], SOFT_DELETE: ['geo.manage'] },
  // ⚠ نگاشت موقت؛ کلید صریح onboarding.* در permissionSet اولویت دارد
  // ⚠ نگاشت موقت: ثبت دستور = مدیران/مالی؛ تصمیم = مالی. کلید صریح financeRequests.* اولویت دارد.
  financeRequests: { VIEW: ['finance.view', 'quotes.approve'], CREATE: ['quotes.approve', 'finance.manage', 'internal.manage'], EDIT: ['quotes.approve', 'finance.manage', 'internal.manage'], APPROVE: ['finance.manage'] },
  onboarding:    { VIEW: ['users.manage'], EDIT: ['users.manage'], APPROVE: ['users.manage'], ASSIGN: ['users.manage'] },
  settings:      { VIEW: ['settings.manage'], EDIT: ['settings.manage'] },
  users:         { VIEW: ['users.manage'], CREATE: ['users.manage'], EDIT: ['users.manage'], ASSIGN: ['users.manage'], SOFT_DELETE: ['users.manage'] },
  roles:         { VIEW: ['roles.manage'], CREATE: ['roles.manage'], EDIT: ['roles.manage'], ASSIGN: ['roles.manage'], SOFT_DELETE: ['roles.manage'] },
};

/** ویژگی‌های یک رکورد برای ارزیابی مجوز + محدوده (Scope) */
export interface RecordScope {
  ownerId?: string; branchId?: string; territoryId?: string; teamId?: string; tenantId?: string;
  memberIds?: string[]; managerId?: string; deletedAt?: string | null; isDeleted?: boolean;
}

export class RBACService {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  getCurrentUser(): UserAccount | null {
    if (!this.state.users || this.state.users.length === 0 || !this.state.currentUserId) return null;
    const user = this.state.users.find(u => u.id === this.state.currentUserId) || null;
    if (!user || (user.isActive ?? user.active) === false) return null;
    return user;
  }

  hasPermission(permission: CapabilityPermission | string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const pSet = (this.state.permissionSets || []).find(p => p.id === user.permissionSetId);
    return pSet ? (pSet.permissions as string[]).includes(permission) : false;
  }

  /** مجوز عملیاتی (بدون بررسی رکورد): کلید صریح "module.action" یا نگاشت موجود؛ ناشناخته = رد */
  can(module: PermModule, action: PermAction): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (this.hasPermission(`${module}.${action.toLowerCase()}`)) return true;
    const legacy = PERMISSION_MATRIX[module]?.[action];
    if (!legacy || legacy.length === 0) return false;
    return legacy.some(p => this.hasPermission(p));
  }

  private tenantOf(user: UserAccount): string | undefined {
    const s: any = this.state;
    return (user as any).tenantId ?? s.tenantId ?? s.settings?.tenantId ?? undefined;
  }

  /**
   * مجوز عملیات روی «یک رکورد مشخص»: مجوز عملیات + Tenant + حذف‌نشده بودن + Scope (ORG/BRANCH/TERRITORY/TEAM/OWNER).
   * گفتگوها: فقط عضویت واقعی؛ مدیر سیستم خودکار عضو یا مدیر گفتگوی خصوصی نیست.
   */
  canActOnRecord(module: PermModule, action: PermAction, rec: RecordScope = {}): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    // Tenant: ناسازگار یا نامعلوم برای رکورد دارای tenant = رد امن
    const ut = this.tenantOf(user);
    if (rec.tenantId !== undefined && rec.tenantId !== null && rec.tenantId !== '') { if (!ut || ut !== rec.tenantId) return false; }
    if ((rec.deletedAt || rec.isDeleted) && action !== 'VIEW') return false;
    if (module === 'groups' || module === 'messages') {
      const isMember = !!rec.memberIds?.includes(user.id);
      if (!isMember) return false;
      if (module === 'groups') return action === 'VIEW' ? true : this.can('groups', action) || rec.managerId === user.id;
      if (action === 'VIEW' || action === 'CREATE') return true;
      if (action === 'EDIT') return rec.ownerId === user.id;
      if (action === 'SOFT_DELETE') return rec.ownerId === user.id || rec.managerId === user.id;
      return false;
    }
    if (!this.can(module, action)) return false;
    return this.canSeeRecord(rec.ownerId, rec.branchId, rec.territoryId, rec.teamId);
  }


  canSeeRecord(recordOwnerId?: string, recordBranchId?: string, recordTerritoryId?: string, recordTeamId?: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const role = (this.state.roles || []).find(r => r.id === user.roleId);
    if (!role) return false;

    switch (role.visibilityScope) {
      case 'ORG': return true;
      case 'BRANCH': return !!user.branchId && !!recordBranchId && recordBranchId === user.branchId;
      case 'TERRITORY': return !!user.territoryId && !!recordTerritoryId && recordTerritoryId === user.territoryId;
      case 'TEAM': {
        // Chat-group membership is not an authoritative sales-team scope. Require explicit team IDs.
        return !!user.teamId && !!recordTeamId && user.teamId === recordTeamId;
      }
      case 'OWNER': return recordOwnerId === user.id;
      default: return false;
    }
  }

  getFieldVisibility(entityType: string, field: string): 'SEE' | 'DO' | 'HIDDEN' {
    const user = this.getCurrentUser();
    if (!user) return 'HIDDEN';
    const pSet = (this.state.permissionSets || []).find(p => p.id === user.permissionSetId);
    // مجموعه‌مجوز بدون fieldPermissions = قابلیت پیکربندی نشده (رفتار قبلی حفظ می‌شود: DO).
    // اگر پیکربندی شده باشد، فیلد ناشناخته fail-closed (HIDDEN) است؛ "entity.*" برای پیش‌فرض موجودیت.
    if (!pSet || !pSet.fieldPermissions || Object.keys(pSet.fieldPermissions).length === 0) return pSet ? 'DO' : 'HIDDEN';
    const fp = pSet.fieldPermissions;
    return fp[`${entityType}.${field}`] || fp[`${entityType}.*`] || 'HIDDEN';
  }

  canAccessWorkspace(tab: NavigationTab): boolean {
    switch (tab) {
      case 'accounts': return this.hasPermission('accounts.view');
      case 'leads': return this.hasPermission('leads.view');
      case 'quotes': return this.hasPermission('quotes.view');
      case 'finance': return this.hasPermission('finance.view');
      case 'cases': return this.hasPermission('cases.view');
      case 'marketing': return this.hasPermission('marketing.manage');
      case 'knowledge': return this.hasPermission('knowledge.manage');
      case 'onboarding': return this.can('onboarding', 'VIEW');
      case 'settings': return this.hasPermission('settings.manage') || this.hasPermission('users.manage') || this.hasPermission('roles.manage');
      case 'internal_automation': return this.hasPermission('internal.view') || this.hasPermission('internal.manage');
      case 'dashboard': return this.hasPermission('accounts.view') || this.hasPermission('finance.view') || this.hasPermission('internal.view');
      case 'tasks': return this.hasPermission('accounts.view') || this.hasPermission('internal.view') || this.hasPermission('internal.manage');
      case 'activities': return this.hasPermission('accounts.view') || this.hasPermission('leads.view');
      case 'calendar': return this.hasPermission('accounts.view') || this.hasPermission('internal.view');
      case 'reports': return this.hasPermission('accounts.view') || this.hasPermission('finance.view') || this.hasPermission('internal.view');
      case 'operations_control': return this.hasPermission('quotes.view') || this.hasPermission('finance.view') || this.hasPermission('internal.view');
      case 'geo_intelligence': return this.hasPermission('geo.view') || this.hasPermission('geo.manage') || this.hasPermission('settings.manage') || this.hasPermission('roles.manage');
      default: return false;
    }
  }
}
