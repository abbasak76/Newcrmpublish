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
          "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm",
          error ? "border-danger" : "",
          className
        )}
        {...props}
      />
      {error && <span id={`${id}-err`} role="alert" className="text-xs text-danger block mt-0.5">{error}</span>}
    </div>
  );
};
