import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActiveFilter { key: string; label: string; onRemove: () => void }
export interface PageToolbarProps {
  title?: string; subtitle?: string;
  search?: string; onSearchChange?: (v: string) => void; searchPlaceholder?: string;
  filters?: React.ReactNode; actions?: React.ReactNode; className?: string;
  resultCount?: number;
  activeFilters?: ActiveFilter[]; onClearAll?: () => void;
}

export function PageToolbar({ title, subtitle, search, onSearchChange, searchPlaceholder = 'جستجو...', filters, actions, className, resultCount, activeFilters = [], onClearAll }: PageToolbarProps) {
  const hasActive = activeFilters.length > 0 || !!search;
  
  return (
    <div className={cn('bg-surface border border-border rounded-2xl p-4 shadow-sm mb-4', className)}>
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        {(title || subtitle) && (
          <div className="min-w-0 flex-1">
            {title && <h1 className="truncate text-lg font-bold text-text-main">{title}</h1>}
            {subtitle && <p className="truncate text-xs text-text-secondary mt-1">{subtitle}</p>}
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onSearchChange && (
            <label className="flex h-10 w-full md:w-64 items-center gap-2 rounded-xl border border-border bg-canvas px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search size={16} className="shrink-0 text-text-muted" aria-hidden />
              <input 
                type="search" 
                value={search ?? ''} 
                onChange={e => onSearchChange(e.target.value)} 
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden" 
              />
              {!!search && (
                <button type="button" onClick={() => onSearchChange('')} aria-label="پاک‌کردن جستجو" className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-text-muted hover:bg-border transition-colors">
                  <X size={14} />
                </button>
              )}
            </label>
          )}
          {filters && <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">{filters}</div>}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
      
      {(hasActive || resultCount !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border-light" aria-live="polite">
          {resultCount !== undefined && (
            <span className="text-xs font-bold text-text-secondary tabular-nums bg-sunken px-2.5 py-1 rounded-md border border-border-light">
              {resultCount.toLocaleString('fa-IR')} نتیجه
            </span>
          )}
          {activeFilters.map(f => (
            <button key={f.key} type="button" onClick={f.onRemove} className="flex min-h-[28px] cursor-pointer items-center gap-1.5 rounded-lg border border-primary/20 bg-primary-soft px-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
              {f.label}<X size={14} aria-hidden />
            </button>
          ))}
          {hasActive && onClearAll && (
            <button type="button" onClick={onClearAll} className="min-h-[28px] cursor-pointer px-2 text-xs font-medium text-text-muted hover:text-text-main transition-colors">
              پاک‌کردن همه
            </button>
          )}
        </div>
      )}
    </div>
  );
}
