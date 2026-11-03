import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  action,
  className,
}) => {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-border", className)}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-canvas border border-slate-100 flex items-center justify-center text-text-secondary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-text-main mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={cn("animate-pulse bg-slate-200/70", variantStyles[variant], className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="rectangular" width="40%" height={16} />
      <Skeleton variant="circular" width={28} height={28} />
    </div>
    <Skeleton variant="text" width="70%" height={24} />
    <Skeleton variant="text" width="90%" height={12} />
    <div className="pt-2 border-t border-slate-100 flex justify-between">
      <Skeleton variant="text" width="30%" height={14} />
      <Skeleton variant="text" width="20%" height={14} />
    </div>
  </div>
);
