import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemePreference, useTheme } from '../theme/ThemeProvider';

const OPTS: { id: ThemePreference; label: string; icon: React.ElementType }[] = [
  { id: 'light', label: 'تم روشن', icon: Sun }, { id: 'system', label: 'مطابق سیستم', icon: Monitor }, { id: 'dark', label: 'تم تیره', icon: Moon },
];

/** انتخاب تم روشن / تیره / سیستم — مستقل از هاله جوی */
export function ThemeToggle({ className }: { className?: string }) {
  const { themePreference, setThemePreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="تم رابط کاربری" className={cn('inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5', className)}>
      {OPTS.map(o => { const on = themePreference === o.id; const I = o.icon; return (
        <button key={o.id} role="radio" aria-checked={on} aria-label={o.label} title={o.label} onClick={() => setThemePreference(o.id)}
          className={cn('se-interactive grid h-8 w-8 cursor-pointer place-items-center rounded-full', on ? 'bg-primary text-white shadow-lux' : 'text-ink-soft hover:bg-ink/10')}>
          <I size={14} />
        </button>); })}
    </div>
  );
}
