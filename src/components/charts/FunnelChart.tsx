import { lighten } from './geometry';
import { fNum, fPct } from './fmt';
import type { Bar } from './BarChart';

/** قیف/میله‌ای افقی: عرض متناسب با بیشینه. showConversion فقط وقتی داده تجمعی است روشن شود. */
export function FunnelChart({ stages, showConversion = false,
  colors = ['var(--color-chart-1)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'] }:
  { stages: Bar[]; showConversion?: boolean; colors?: string[] }) {
  const max = Math.max(...stages.map(s => s.value), 1);
  return (
    <ol className="grid gap-2.5" aria-label="مراحل">
      {stages.map((s, i) => {
        const c = colors[i % colors.length];
        return (
          <li key={s.label} className="grid grid-cols-[84px_1fr] items-center gap-3 text-xs">
            <span className="font-medium text-ink-soft">{s.label}</span>
            <div className="flex justify-center">
              <div className="flex h-9 items-center justify-between gap-2 rounded-full px-4 font-bold text-ink shadow-card"
                   style={{ width: `${Math.max((s.value / max) * 100, 24)}%`, background: `linear-gradient(180deg, ${lighten(c, 25)}, ${c})` }}>
                <span>{fNum(s.value)}</span>
                {showConversion && i > 0 && stages[i - 1].value > 0 && <span className="text-[10px] opacity-75">{fPct((s.value / stages[i - 1].value) * 100)}</span>}
              </div>
            </div>
          </li>);
      })}
    </ol>
  );
}
