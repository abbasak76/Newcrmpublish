import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

/** وضعیت Loading واقعی: فقط وقتی داده در حال دریافت است نمایش داده شود (نه تزئینی) */
export function Skeleton({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="در حال بارگذاری" className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => <div key={i} className={cn('se-skeleton h-4', i === lines - 1 && lines > 1 && 'w-2/3', className)} />)}
    </div>
  );
}

/** وضعیت خطا: خطای واقعی را صادقانه نشان می‌دهد (به صفر/موفقیت تبدیل نمی‌شود) */
export function ErrorState({ title = 'خطا در دریافت اطلاعات', description, onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 rounded-2xl border border-danger-line bg-danger-soft p-8 text-center', className)}>
      <AlertTriangle className="text-danger" size={28} aria-hidden />
      <h3 className="text-sm font-extrabold text-danger">{title}</h3>
      {description && <p className="max-w-sm text-xs text-text-secondary">{description}</p>}
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>تلاش مجدد</Button>}
    </div>
  );
}
