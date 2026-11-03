import { useId } from 'react';
import { lighten } from './geometry';
import { fCompact } from './fmt';

export interface Bar { label: string; value: number }
/** ستونی: میله‌های گرد گرادیانی، شبکه خط‌چین کم‌رنگ، ستون برجسته مشکی. rtl: اولین داده سمت راست. */
export function BarChart({ data, highlight, color = 'var(--color-chart-1)', rtl = true, height = 168 }:
  { data: Bar[]; highlight?: number; color?: string; rtl?: boolean; height?: number }) {
  const id = useId().replace(/:/g, '');
  const W = 300, top = 18, base = height - 24, max = Math.max(...data.map(d => d.value), 1);
  const slot = W / Math.max(data.length, 1), bw = Math.min(24, slot * 0.52);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={data.map(d => `${d.label}: ${d.value}`).join('، ')}>
      <defs>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: lighten(color, 28) }} /><stop offset="1" style={{ stopColor: color }} /></linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-ink)" stopOpacity=".72" /><stop offset="1" stopColor="var(--color-ink)" /></linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => { const y = top + ((base - top) * i) / 3;
        return <line key={i} x1="0" x2={W} y1={y} y2={y} stroke="var(--color-ink)" strokeOpacity=".1" strokeDasharray={i === 3 ? undefined : '3 4'} />; })}
      {data.map((d, k) => {
        const i = rtl ? data.length - 1 - k : k, h = Math.max(((base - top) * d.value) / max, bw), x = i * slot + (slot - bw) / 2, cx = i * slot + slot / 2;
        return (
          <g key={d.label + k}>
            <rect x={x} y={base - h} width={bw} height={h} rx={bw / 2} fill={`url(#${id}${k === highlight ? 'h' : 'n'})`} />
            <text x={cx} y={height - 7} textAnchor="middle" fontSize="10" fill="var(--color-ink-soft)">{d.label}</text>
            {k === highlight && <text x={cx} y={base - h - 7} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--color-ink)">{fCompact(d.value)}</text>}
          </g>);
      })}
    </svg>
  );
}
