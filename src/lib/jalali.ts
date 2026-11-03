import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
] as const;

export const JALALI_WEEKDAY_NAMES = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه'
] as const;

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: string | number): string {
  const str = String(value ?? '');
  return str.replace(/[0-9]/g, w => PERSIAN_DIGITS[+w]);
}

export function toLatinDigits(value: string | number): string {
  const str = String(value ?? '');
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.split(persianDigits[i]).join(String(i));
    res = res.split(arabicDigits[i]).join(String(i));
  }
  return res;
}

export interface JalaliDateObject {
  jy: number;
  jm: number;
  jd: number;
}

/**
 * Converts a Gregorian date (Date object or string) to Jalali components
 */
export function getJalaliDate(inputDate?: string | Date | null): JalaliDateObject {
  const d = inputDate ? new Date(inputDate) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Converts Jalali date components (jy, jm, jd) to Gregorian ISO date string (YYYY-MM-DD)
 */
export function jalaliToGregorianISO(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const m = String(gm).padStart(2, '0');
  const d = String(gd).padStart(2, '0');
  return `${gy}-${m}-${d}`;
}

/**
 * Formats date into formatted Persian string (e.g. "۱۴۰۳/۰۷/۲۲" or "۲۲ مهر ۱۴۰۳")
 */
export function formatJalaliDate(
  dateInput?: string | Date | null,
  options?: {
    format?: 'short' | 'full' | 'numeric' | 'month-year';
    usePersianDigits?: boolean;
    delimiter?: string;
  }
): string {
  if (!dateInput) return 'تعیین نشده';
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const usePersianDigits = options?.usePersianDigits !== false;
  const delimiter = options?.delimiter || '/';
  const format = options?.format || 'short';

  if (format === 'month-year') {
    const monthName = JALALI_MONTH_NAMES[jm - 1] || '';
    const res = `${monthName} ${jy}`;
    return usePersianDigits ? toPersianDigits(res) : res;
  }

  if (format === 'full') {
    const monthName = JALALI_MONTH_NAMES[jm - 1] || '';
    const weekday = JALALI_WEEKDAY_NAMES[d.getDay()];
    const res = `${weekday} ${jd} ${monthName} ${jy}`;
    return usePersianDigits ? toPersianDigits(res) : res;
  }

  const mm = String(jm).padStart(2, '0');
  const dd = String(jd).padStart(2, '0');
  const res = `${jy}${delimiter}${mm}${delimiter}${dd}`;
  return usePersianDigits ? toPersianDigits(res) : res;
}

/**
 * Universal formatter respecting calendar switch ('jalali' | 'gregorian') and number format
 */
export function formatLocalizedDate(
  dateInput?: string | Date | null,
  calendarType: 'jalali' | 'gregorian' = 'jalali',
  options?: {
    format?: 'short' | 'full' | 'numeric' | 'month-year';
    numberFormat?: 'persian' | 'latin';
    includeTime?: boolean;
  }
): string {
  if (!dateInput) return 'تعیین نشده';
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const usePersianDigits = options?.numberFormat !== 'latin';

  let datePart = '';
  if (calendarType === 'gregorian') {
    if (options?.format === 'full') {
      datePart = d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } else {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      datePart = `${y}/${m}/${day}`;
    }
  } else {
    datePart = formatJalaliDate(d, {
      format: options?.format || 'short',
      usePersianDigits
    });
  }

  if (options?.includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    return `${datePart} ${usePersianDigits ? toPersianDigits(timeStr) : timeStr}`;
  }

  return datePart;
}

/**
 * Returns human-readable relative time string in Persian (امروز، فردا، دیروز، ...)
 */
export function getRelativeJalaliDate(dateInput?: string | Date | null): string {
  if (!dateInput) return 'تعیین نشده';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'فردا';
  if (diffDays === -1) return 'دیروز';
  if (diffDays > 1 && diffDays <= 7) return `${toPersianDigits(diffDays)} روز دیگر`;
  if (diffDays < -1 && diffDays >= -7) return `${toPersianDigits(Math.abs(diffDays))} روز پیش`;

  return formatJalaliDate(d);
}

/**
 * Returns days in a Jalali month
 */
export function getJalaliMonthDays(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}
