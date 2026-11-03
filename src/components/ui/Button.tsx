import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  block = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-95 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
    secondary: "bg-primary-50 text-primary hover:bg-primary-100",
    outline: "border border-border text-ink hover:bg-canvas",
    ghost: "text-ink hover:bg-black/5",
    danger: "bg-danger text-white hover:bg-red-700 shadow-sm",
    success: "bg-success text-white hover:bg-green-700 shadow-sm"
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base",
    icon: "h-11 w-11 p-0"
  };

  return (
    <button
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, block && 'w-full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span aria-hidden className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : icon ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export const IconButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string; active?: boolean }>(
  ({ className, active, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl transition-all duration-200',
        'active:scale-95',
        active ? 'bg-primary text-white shadow-sm' : 'bg-surface text-ink hover:bg-canvas border border-border shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
