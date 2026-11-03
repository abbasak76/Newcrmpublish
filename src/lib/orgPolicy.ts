import type { AppState } from '../types';

/**
 * سیاست‌های قابل‌پیکربندی سازمان (منبع واحد). مقدار از state.settings.orgConfig خوانده می‌شود.
 * ⚠ LEGACY_*: مقدارهای پیش‌فرض تاریخی کد (هاردکد قبلی) برای حفظ رفتار فعلی در نبود تنظیم؛
 *   تعیین عدد درست یک تصمیم کسب‌وکاری است و باید در تنظیمات سازمان مقداردهی شود.
 */
export const LEGACY_HIGH_VALUE_QUOTE_THRESHOLD = 100_000_000;
export const LEGACY_DEFAULT_CREDIT_LIMIT = 100_000_000;

const cfg = (state?: Pick<AppState, 'settings'> | null): any => (state?.settings as any)?.orgConfig || {};
const positive = (v: unknown): number | undefined => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : undefined; };

export const getHighValueQuoteThreshold = (state?: Pick<AppState, 'settings'> | null): number => positive(cfg(state).highValueQuoteThreshold) ?? LEGACY_HIGH_VALUE_QUOTE_THRESHOLD;
export const getDefaultCreditLimit = (state?: Pick<AppState, 'settings'> | null): number => positive(cfg(state).defaultCreditLimit) ?? LEGACY_DEFAULT_CREDIT_LIMIT;

/** نام سازمان (tenant) از تنظیمات؛ در نبود مقدار رشته‌ی خالی برمی‌گردد و UI به نام محصول برمی‌گردد. */
export const getTenantName = (state?: Pick<AppState, 'settings'> | null): string => {
  const v = cfg(state).tenantName;
  return typeof v === 'string' ? v.trim() : '';
};

/** سیاست هشدار ریزش مشتری؛ تا وقتی هر دو مقدار در تنظیمات سازمان تعریف نشده باشد null (هشداری تولید نمی‌شود، عدد پیش‌فرض نداریم). */
export const getChurnRiskPolicy = (state?: Pick<AppState, 'settings'> | null): { days: number; minSales: number } | null => {
  const days = positive(cfg(state).churnRiskDays); const minSales = positive(cfg(state).churnRiskMinSales);
  return days && minSales ? { days, minSales } : null;
};
