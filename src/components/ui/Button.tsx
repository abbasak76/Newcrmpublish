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
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-150 ease-out active:scale-[0.97] select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";
  const variants: Record<string, string> = {
    primary: "bg-[var(--c-primary)] text-white hover:bg-[var(--c-primary-hover)] shadow-[0_2px_8px_-1px_rgba(37,99,235,0.28)] hover:shadow-[0_4px_14px_-2px_rgba(37,99,235,0.38)]",
    secondary: "bg-[var(--c-primary-soft)] text-[var(--c-primary)] hover:bg-[var(--c-sunken)] border border-[var(--c-border)]",
    outline: "border border-[var(--c-border)] text-[var(--c-text-primary)] bg-[var(--c-sunken)] hover:bg-[var(--c-surface)] shadow-xs font-bold",
    ghost: "text-[var(--c-text-primary)] hover:bg-[var(--c-sunken)]",
    danger: "bg-[var(--c-danger)] text-white hover:opacity-90 shadow-[0_2px_8px_-1px_rgba(220,38,38,0.28)]",
    success: "bg-[var(--c-success)] text-white hover:opacity-90 shadow-[0_2px_8px_-1px_rgba(22,163,74,0.28)]"
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-13 px-8 text-base",
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
