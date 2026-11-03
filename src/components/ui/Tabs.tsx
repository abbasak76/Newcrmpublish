import React from 'react';
import { cn } from '../../lib/utils';

export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onClick,
  count,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 px-4 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'bg-primary text-white shadow-lux'
          : 'glass text-text-secondary hover:bg-white hover:text-text-main'
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
