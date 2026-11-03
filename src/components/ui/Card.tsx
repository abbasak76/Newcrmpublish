import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, padding = 'md', ...props }) => {
  const pads: Record<string, string> = { none: 'p-0', sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={cn("bg-surface border border-border rounded-xl shadow-sm transition-all", pads[padding], className)}
      {...props}
    />
  );
};
