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
    default: "bg-[var(--c-sunken)] text-[var(--c-text-primary)] border border-[var(--c-border)]",
    primary: "bg-[var(--c-primary-soft)] text-[var(--c-primary)] border border-[var(--c-border)] font-bold",
    success: "bg-[var(--c-success-soft)] text-[var(--c-success)] border border-[var(--c-success-border)] font-bold",
    warning: "bg-[var(--c-warning-soft)] text-[var(--c-warning)] border border-[var(--c-warning-border)] font-bold",
    danger: "bg-[var(--c-danger-soft)] text-[var(--c-danger)] border border-[var(--c-danger-border)] font-bold",
    info: "bg-[var(--c-primary-soft)] text-[var(--c-primary)] border border-[var(--c-border)] font-bold",
    neutral: "bg-[var(--c-sunken)] text-[var(--c-text-secondary)] border border-[var(--c-border)] font-medium",
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
