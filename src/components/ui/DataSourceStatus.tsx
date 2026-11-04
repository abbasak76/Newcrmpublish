import React, { useState } from 'react';
import { RefreshCw, Database, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DataSourceStatusProps {
  source?: 'ERP' | 'CRM' | 'LOCAL' | 'HYBRID';
  sourceName?: string;
  lastSyncedAt?: string;
  isAuthoritative?: boolean;
  onRefresh?: () => Promise<void> | void;
  className?: string;
}

export function DataSourceStatus({
  source = 'ERP',
  sourceName = 'سامانه مالی و انبار (ERP)',
  lastSyncedAt,
  isAuthoritative = true,
  onRefresh,
  className
}: DataSourceStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // تاخیر شبیه‌سازی همگام‌سازی محلی داده‌ها
        await new Promise(r => setTimeout(r, 600));
      }
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedTime = lastSyncedAt
    ? new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastSyncedAt))
    : new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date());

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-canvas-subtle/80 border border-border-subtle text-xs text-text-secondary select-none",
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-text-main">
          <Database size={13} className="text-primary" />
          <span>منبع: {sourceName}</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-soft text-success border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {isAuthoritative ? 'سند رسمی معتبر' : 'برآورد عملیاتی'}
        </span>
        <span className="text-[11px] text-text-muted">
          آخرین همگام‌سازی: {formattedTime}
        </span>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
          justRefreshed 
            ? "bg-success-soft text-success" 
            : "bg-surface hover:bg-canvas text-text-main border border-border hover:border-primary/40 shadow-xs"
        )}
        title="همگام‌سازی و به‌روزرسانی اطلاعات از منبع"
      >
        {justRefreshed ? (
          <>
            <CheckCircle2 size={13} className="text-success" />
            <span>به‌روز شد</span>
          </>
        ) : (
          <>
            <RefreshCw size={13} className={cn("text-primary", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'در حال دریافت...' : 'به‌روزرسانی همه'}</span>
          </>
        )}
      </button>
    </div>
  );
}
