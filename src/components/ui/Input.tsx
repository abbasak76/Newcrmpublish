import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id: propId, ...props }) => {
  const generatedId = useId();
  const id = propId || generatedId;

  return (
    <div className="space-y-1.5 text-right" dir="rtl">
      {label && <label htmlFor={id} className="block text-xs font-bold text-ink">{label}</label>}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(
          "w-full bg-surface border border-border/80 rounded-2xl px-4 py-3 min-h-[44px] text-sm text-ink outline-none transition-all duration-150 placeholder:text-ink-soft/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] shadow-xs",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "",
          className
        )}
        {...props}
      />
      {error && <span id={`${id}-err`} role="alert" className="text-xs text-danger block mt-0.5">{error}</span>}
    </div>
  );
};
