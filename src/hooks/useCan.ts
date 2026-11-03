import { useCallback, useMemo } from 'react';
import { AppState } from '../types';
import { PermAction, PermModule, RBACService, RecordScope } from '../lib/rbac';
import { generateId } from '../lib/utils';

/**
 * اتصال اکشن‌های UI به همان RBACService (تنها موتور مجوز).
 * هشدار: این کنترل سمت کلاینت است؛ enforcement نهایی باید در backend/RLS انجام شود.
 */
export function useCan(state: AppState, updateState?: (u: (d: AppState) => AppState | void) => void) {
  const rbac = useMemo(() => new RBACService(state), [state]);
  const can = useCallback((m: PermModule, a: PermAction) => rbac.can(m, a), [rbac]);
  const canOn = useCallback((m: PermModule, a: PermAction, rec?: RecordScope) => rbac.canActOnRecord(m, a, rec), [rbac]);
  /** اعلان واقعی «دسترسی غیرمجاز» در مرکز اعلان (بدون تکرار پشت‌سرهم) */
  const denied = useCallback((what: string) => {
    updateState?.(d => {
      if (!d.notifications) d.notifications = [];
      const title = 'دسترسی غیرمجاز';
      const message = `شما مجوز «${what}» را ندارید.`;
      const recent = d.notifications.find(n => !n.read && n.title === title && n.message === message && Date.now() - new Date(n.createdAt).getTime() < 15000);
      if (recent) return;
      d.notifications.push({ id: generateId(), title, message, type: 'WARNING', read: false, createdAt: new Date().toISOString() });
    });
    return undefined;
  }, [updateState]);
  return { rbac, can, canOn, denied };
}

/** نسخه غیرهوک برای handlerها: مجوز را بررسی و در صورت رد، اعلان «دسترسی غیرمجاز» ثبت می‌کند. */
export function guard(state: AppState, updateState: ((u: (d: AppState) => AppState | void) => void) | undefined, module: PermModule, action: PermAction, what: string): boolean {
  if (new RBACService(state).can(module, action)) return true;
  updateState?.(d => {
    if (!d.notifications) d.notifications = [];
    const title = 'دسترسی غیرمجاز'; const message = `شما مجوز «${what}» را ندارید.`;
    if (d.notifications.some(n => !n.read && n.title === title && n.message === message && Date.now() - new Date(n.createdAt).getTime() < 15000)) return;
    d.notifications.push({ id: generateId(), title, message, type: 'WARNING', read: false, createdAt: new Date().toISOString() });
  });
  return false;
}


/** Fail-closed guard for creating records: never attribute business records to a fabricated fallback user. */
export function requireActiveUser(
  state: AppState,
  updateState: ((u: (d: AppState) => AppState | void) => void) | undefined,
  actionLabel: string
): boolean {
  if (new RBACService(state).getCurrentUser()) return true;
  updateState?.(draft => {
    if (!draft.notifications) draft.notifications = [];
    draft.notifications.push({
      id: generateId(), title: 'کاربر فعال مشخص نیست',
      message: `برای ${actionLabel} باید کاربر فعال و معتبر وارد سیستم شده باشد. هیچ رکوردی ایجاد نشد.`,
      type: 'WARNING', read: false, createdAt: new Date().toISOString()
    });
  });
  return false;
}
