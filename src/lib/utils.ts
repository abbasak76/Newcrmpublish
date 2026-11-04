/**
 * Helper utilities for Akhavan CRM
 */

export function parsePersianNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let clean = String(value);
  for (let i = 0; i < 10; i++) {
    clean = clean.split(persianDigits[i]).join(String(i));
    clean = clean.split(arabicDigits[i]).join(String(i));
  }

  // Remove commas, spaces, currency symbols
  clean = clean.replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatInputCurrency(val: string | number): string {
  if (!val && val !== 0) return '';
  const num = parsePersianNumber(val);
  if (num === 0 && String(val).trim() === '') return '';
  return num.toLocaleString('fa-IR');
}

export function formatCurrency(val: number | string): string {
  const num = parsePersianNumber(val);
  return num.toLocaleString('fa-IR');
}

export function formatRial(val: number | string | null | undefined): string {
  if (val == null || val === '') return '۰ ریال';
  const num = typeof val === 'number' ? Math.round(val) : parsePersianNumber(val);
  return `${num.toLocaleString('fa-IR')} ریال`;
}

export function formatRialCompact(val: number | string | null | undefined): string {
  if (val == null || val === '') return '۰ ریال';
  const num = typeof val === 'number' ? Math.round(val) : parsePersianNumber(val);
  return `${new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 }).format(num)} ریال`;
}

export function cleanNumericInput(val: string): string {
  return String(val || '').replace(/[^0-9]/g, '');
}

import { formatLocalizedDate } from './jalali';
export * from './jalali';

export function formatAppDate(dateStr?: string, locale?: any, format: 'short' | 'full' | 'numeric' | 'month-year' = 'short'): string {
  if (!dateStr) return 'تعیین نشده';
  try {
    const calendarType = locale?.calendar || 'jalali';
    const numberFormat = locale?.numberFormat || 'persian';
    return formatLocalizedDate(dateStr, calendarType, { format, numberFormat });
  } catch {
    return dateStr;
  }
}

/** شماره‌ی ترتیبی سند/کد: بزرگ‌ترین عدد موجود با همان پیشوند + ۱ (بدون تصادف و بدون تکرار). */
export function nextSequenceNumber(prefix: string, existing: Array<string | undefined | null>, start = 1): string {
  let max = start - 1;
  for (const v of existing) {
    const m = typeof v === 'string' && v.startsWith(prefix) ? v.slice(prefix.length).match(/^-?(\d+)$/) : null;
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function normalizePersianText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/آ/g, 'ا')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .toLowerCase()
    .trim();
}

export function matchesSearch(text?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true;
  if (!text) return false;
  return normalizePersianText(text).includes(normalizePersianText(query));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
