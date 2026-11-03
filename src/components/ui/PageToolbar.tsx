import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActiveFilter { key: string; label: string; onRemove: () => void }
export interface PageToolbarProps {
  title?: string; subtitle?: string;
  search?: string; onSearchChange?: (v: string) => void; searchPlaceholder?: string;
  filters?: React.ReactNode; actions?: React.ReactNode; className?: string;
  /** تعداد نتایج پس از اعمال جستجو/فیلتر (اختیاری) */
  resultCount?: number;
  /** فیلترهای فعال به‌صورت chip قابل‌حذف + «پاک‌کردن همه» */
  activeFilters?: ActiveFilter[]; onClearAll?: () => void;
}

/** نوار ابزار استاندارد صفحه: عنوان + جستجو + فیلترها + اقدامات + فیلترهای فعال (شیشه‌ای، گرد) */
export function PageToolbar({ title, subtitle, search, onSearchChange, searchPlaceholder = 'جستجو...', filters, actions, className, resultCount, activeFilters = [], onClearAll }: PageToolbarProps) {
  const hasActive = activeFilters.length > 0 || !!search;
  return (
    <div className={cn('glass rounded-[28px] p-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        {(title || subtitle) && (
          <div className="min-w-0 px-2">
            {title && <h1 className="truncate text-sm font-extrabold text-ink">{title}</h1>}
            {subtitle && <p className="truncate text-[11px] text-ink-soft">{subtitle}</p>}
          </div>
        )}
        {onSearchChange && (
          <label className="flex h-11 min-w-[180px] flex-1 items-center gap-2 rounded-full bg-ink/[.06] px-4 focus-within:ring-2 focus-within:ring-accent">
            <Search size={16} className="shrink-0 text-ink-soft" aria-hidden />
            <span className="sr-only">جستجو</span>
            <input type="search" value={search ?? ''} onChange={e => onSearchChange(e.target.value)} placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink-soft [&::-webkit-search-cancel-button]:hidden" />
            {!!search && <button type="button" onClick={() => onSearchChange('')} aria-label="پاک‌کردن جستجو" className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft hover:bg-ink/10"><X size={14} /></button>}
          </label>
        )}
        {filters && <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto">{filters}</div>}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {(hasActive || resultCount !== undefined) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1" aria-live="polite">
          {resultCount !== undefined && <span className="se-caption se-num">{resultCount.toLocaleString('fa-IR')} نتیجه</span>}
          {activeFilters.map(f => (
            <button key={f.key} type="button" onClick={f.onRemove} className="se-interactive flex min-h-[32px] cursor-pointer items-center gap-1 rounded-full bg-primary/10 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/15">{f.label}<X size={12} aria-hidden /><span className="sr-only">حذف فیلتر</span></button>
          ))}
          {hasActive && onClearAll && <button type="button" onClick={onClearAll} className="min-h-[32px] cursor-pointer px-2 text-[11px] font-bold text-ink-soft underline-offset-2 hover:underline">پاک‌کردن همه</button>}
        </div>
      )}
    </div>
  );
}
