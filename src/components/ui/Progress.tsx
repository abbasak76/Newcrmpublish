import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  labelPosition?: 'right' | 'top' | 'inside';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, size = 'md', variant = 'primary', showLabel = false, labelPosition = 'right', className }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = { xs: "h-1.5", sm: "h-2", md: "h-2.5", lg: "h-3.5" };
  const barColors = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1", className)} dir="rtl">
      {showLabel && labelPosition === 'top' && (
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
          <span>پیشرفت</span><span className="font-bold text-text-main">{percentage}٪</span>
        </div>
      )}
      <div className="flex items-center gap-2 w-full">
        <div className={cn("flex-1 bg-canvas rounded-full overflow-hidden border border-border", sizeStyles[size])}>
          <div className={cn("h-full transition-all duration-300 rounded-full", barColors[variant])} style={{ width: `${percentage}%` }} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} />
        </div>
        {showLabel && labelPosition === 'right' && (
          <span className="text-xs font-bold text-text-secondary shrink-0 w-8 text-left">{percentage}٪</span>
        )}
      </div>
    </div>
  );
};
