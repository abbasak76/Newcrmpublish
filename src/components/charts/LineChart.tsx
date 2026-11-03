import { useId } from 'react';
import { smooth, glow } from './geometry';

/** خطی: منحنی هموار ۲٫۵px با سایه رنگی، سطح گرادیانی، نقطه آخر با حلقه سفید. rtl: اولین داده سمت راست. */
export function LineChart({ values, labels, color = 'var(--color-chart-1)', rtl = true, height = 148 }:
  { values: number[]; labels?: string[]; color?: string; rtl?: boolean; height?: number }) {
  const id = useId().replace(/:/g, '');
  if (values.length === 0) return null;
  const W = 300, top = 16, base = height - (labels ? 24 : 8);
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i): [number, number] => {
    const t = values.length > 1 ? i / (values.length - 1) : 0.5;
    return [10 + (rtl ? 1 - t : t) * (W - 20), values.length === 1 ? (top + base) / 2 : base - ((v - min) / span) * (base - top)];
  });
  const ordered = [...pts].sort((a, b) => a[0] - b[0]);
  const line = smooth(ordered), last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={`روند: از ${values[0]} تا ${values[values.length - 1]}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2].map(i => <line key={i} x1="0" x2={W} y1={top + ((base - top) * i) / 2} y2={top + ((base - top) * i) / 2} stroke="var(--color-ink)" strokeOpacity=".1" strokeDasharray={i === 2 ? undefined : '3 4'} />)}
      <path d={`${line}L${ordered[ordered.length - 1][0]} ${base}L${ordered[0][0]} ${base}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ filter: glow(color, 40) }} />
      <circle cx={last[0]} cy={last[1]} r="5.5" fill={color} stroke="var(--color-card)" strokeWidth="2.5" />
      {labels?.map((l, i) => <text key={l + i} x={pts[i][0]} y={height - 7} textAnchor="middle" fontSize="10" fill="var(--color-ink-soft)">{l}</text>)}
    </svg>
  );
}
