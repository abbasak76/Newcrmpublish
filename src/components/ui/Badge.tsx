import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, Info } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  ...props
}) => {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const variantStyles = {
    default: "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80",
    primary: "bg-primary/10 dark:bg-primary-950/40 text-primary dark:text-blue-400 border border-primary/25 dark:border-primary-800/50 font-bold",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 font-bold",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50 font-bold",
    danger: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50 font-bold",
    info: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/50 font-bold",
    neutral: "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/60 font-medium",
  };

  const dotColors = {
    default: "bg-text-secondary",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-text-secondary",
  };

  return (
    <span className={cn("inline-flex items-center justify-center font-medium rounded-full select-none whitespace-nowrap", sizeStyles[size], variantStyles[variant], className)} {...props}>
      {dot && <span className={cn("se-dot shrink-0", dotColors[variant].replace('bg-', 'text-'), ['success', 'warning', 'danger'].includes(variant) && 'is-live')} />}
      {children}
    </span>
  );
};

export type SemanticStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS' | 'WON' | 'LOST' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'CLEARED' | 'BOUNCED';

interface StatusBadgeProps {
  status: SemanticStatus | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm', className }) => {
  const normalized = status.toUpperCase();
  let variant: BadgeProps['variant'] = 'neutral';
  let icon: React.ReactNode = null;
  let text = label || status;

  switch (normalized) {
    case 'ACTIVE': case 'APPROVED': case 'COMPLETED': case 'WON': case 'CLEARED':
      variant = 'success'; icon = <CheckCircle2 className="w-3 h-3" />;
      if (!label) text = normalized === 'ACTIVE' ? 'فعال' : normalized === 'APPROVED' ? 'تأیید شده' : normalized === 'COMPLETED' ? 'انجام شد' : normalized === 'WON' ? 'موفق' : 'وصول شده';
      break;
    case 'IN_PROGRESS':
      variant = 'primary'; icon = <Clock className="w-3 h-3 text-primary" />;
      if (!label) text = 'در حال انجام';
      break;
    case 'PENDING': case 'DRAFT':
      variant = 'warning'; icon = <Clock className="w-3 h-3 text-warning" />;
      if (!label) text = normalized === 'PENDING' ? 'در انتظار' : 'پیش‌نویس';
      break;
    case 'OVERDUE': case 'BOUNCED': case 'REJECTED': case 'LOST': case 'CANCELLED':
      variant = 'danger'; icon = <AlertCircle className="w-3 h-3 text-danger" />;
      if (!label) text = normalized === 'OVERDUE' ? 'سررسید گذشته' : normalized === 'BOUNCED' ? 'برگشتی' : normalized === 'REJECTED' ? 'رد شده' : normalized === 'LOST' ? 'عدم موفقیت' : 'لغو شده';
      break;
    default:
      variant = 'neutral'; icon = <Info className="w-3 h-3 text-text-secondary" />;
      if (!label && normalized === 'INACTIVE') text = 'غیرفعال';
      break;
  }

  return (
    <Badge variant={variant} size={size} className={cn("gap-1 font-bold", className)}>
      {icon}<span>{text}</span>
    </Badge>
  );
};
