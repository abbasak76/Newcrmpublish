import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, padding = 'md', ...props }) => {
  const pads: Record<string, string> = { none: 'p-0', sm: 'p-3.5', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={cn(
        "bg-surface border border-border/75 rounded-2xl shadow-[0_2px_10px_-3px_rgba(15,23,42,0.04),0_10px_20px_-8px_rgba(15,23,42,0.03)] transition-all duration-200 ease-out hover:border-border hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08),0_16px_32px_-12px_rgba(15,23,42,0.06)]",
        pads[padding],
        className
      )}
      {...props}
    />
  );
};
